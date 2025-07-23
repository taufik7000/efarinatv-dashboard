// app/api/transactions/update-status/route.ts

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check user role
    const { data: profile } = await supabase
      .from('Profile')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role?.toLowerCase();
    
    if (!['direktur', 'keuangan'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: "Tidak memiliki akses untuk mengubah status transaksi" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { transactionId, status, receiptUrl } = body;

    // Validasi input
    if (!transactionId || !status) {
      return NextResponse.json(
        { success: false, error: "Transaction ID dan status wajib diisi" },
        { status: 400 }
      );
    }

    if (!['Disetujui', 'Ditolak'].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Status tidak valid" },
        { status: 400 }
      );
    }

    // Update transaction status
    const updateData: any = {
      status: status,
      approver_id: user.id,
    };

    // Tambahkan receipt_url jika disediakan saat approval
    if (receiptUrl) {
      updateData.receipt_url = receiptUrl;
    }

    // Hanya tambahkan approved_at jika kolom ada dan status disetujui
    if (status === 'Disetujui') {
      try {
        // Coba update dengan approved_at
        const { error: updateErrorWithTime } = await supabase
          .from('Transactions')
          .update({
            ...updateData,
            approved_at: new Date().toISOString()
          })
          .eq('id', transactionId)
          .eq('status', 'Tertunda');

        if (updateErrorWithTime) {
          // Jika gagal karena kolom approved_at tidak ada, coba tanpa approved_at
          console.log("approved_at column might not exist, trying without it");
          const { error: updateErrorWithoutTime } = await supabase
            .from('Transactions')
            .update(updateData)
            .eq('id', transactionId)
            .eq('status', 'Tertunda');

          if (updateErrorWithoutTime) {
            throw updateErrorWithoutTime;
          }
        }
      } catch (error) {
        console.error("Error updating with approved_at:", error);
        // Fallback: update tanpa approved_at
        const { error: updateError } = await supabase
          .from('Transactions')
          .update(updateData)
          .eq('id', transactionId)
          .eq('status', 'Tertunda');

        if (updateError) {
          throw updateError;
        }
      }
    } else {
      // Untuk status 'Ditolak', tidak perlu approved_at
      const { error: updateError } = await supabase
        .from('Transactions')
        .update(updateData)
        .eq('id', transactionId)
        .eq('status', 'Tertunda');

      if (updateError) {
        throw updateError;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Transaksi berhasil ${status.toLowerCase()}`
    });

  } catch (error: any) {
    console.error("Unexpected error in update-status:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server: " + error.message },
      { status: 500 }
    );
  }
}