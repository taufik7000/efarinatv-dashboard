// app/api/admin/delete-user/route.ts - Versi yang lebih kuat dengan penanganan error yang lebih baik

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Fungsi untuk membuat klien admin Supabase dengan kunci service role
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Validasi bahwa environment variables telah diatur
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase URL or Service Role Key is missing from environment variables.');
    throw new Error('Konfigurasi server tidak lengkap. Kunci admin diperlukan.');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('=== API PENGHAPUSAN PENGGUNA DIMULAI ===');
    
    const body = await request.json();
    const { userId } = body;

    // Validasi input userId
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID diperlukan dalam body permintaan' },
        { status: 400 }
      );
    }

    // Validasi format UUID untuk keamanan
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.error('Format UUID tidak valid:', userId);
      return NextResponse.json(
        { error: 'Format User ID tidak valid. Diharapkan UUID.' },
        { status: 400 }
      );
    }

    console.log('Memvalidasi dan akan menghapus pengguna dengan UUID:', userId);

    const supabase = createAdminClient();

    // Langkah 1: Hapus data dari tabel 'Profile' terlebih dahulu
    console.log(`Menghapus profil untuk userId: ${userId}...`);
    const { error: profileError } = await supabase
      .from("Profile")
      .delete()
      .eq("id", userId);

    // **PERBAIKAN UTAMA**: Jika penghapusan profil gagal, hentikan proses dan kembalikan error.
    // Ini mencegah pengguna auth terhapus jika profilnya gagal dihapus.
    if (profileError) {
      console.error('Error saat menghapus profil:', profileError);
      return NextResponse.json(
        { error: `Gagal menghapus profil pengguna: ${profileError.message}` },
        { status: 500 }
      );
    }
    console.log('Profil berhasil dihapus.');

    // Langkah 2: Hapus pengguna dari 'auth.users'
    console.log(`Menghapus pengguna auth untuk userId: ${userId}...`);
    const { data: deletedUser, error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error saat menghapus pengguna auth:', authError);
      return NextResponse.json(
        { error: `Gagal menghapus otentikasi pengguna: ${authError.message}` },
        { status: 500 }
      );
    }

    console.log('Pengguna auth berhasil dihapus.');
    console.log('=== API PENGHAPUSAN PENGGUNA BERHASIL ===');

    return NextResponse.json({
      success: true,
      message: `Pengguna dengan ID ${userId} berhasil dihapus secara permanen.`,
      deletedUser: deletedUser
    });

  } catch (error: any) {
    console.error('Error tak terduga di API hapus pengguna:', error);
    // Menangani error jika request.json() gagal atau error lainnya
    return NextResponse.json(
      { error: 'Terjadi kesalahan internal pada server: ' + error.message },
      { status: 500 }
    );
  }
}

// Menangani request OPTIONS untuk CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
