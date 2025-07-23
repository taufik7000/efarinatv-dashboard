// app/admin/users/add/actions.ts - Server actions for creating users

"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

type CreateUserResult = {
  success: boolean;
  message: string;
  userId?: string;
};

// Create admin client with service role key
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function createUserAction(formData: FormData): Promise<CreateUserResult> {
  try {
    console.log('=== CREATE USER ACTION START ===');
    
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;

    // Validasi input
    if (!fullName || !email || !password || !role) {
      return {
        success: false,
        message: "Semua field wajib diisi"
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        message: "Password minimal 6 karakter"
      };
    }

    const validRoles = ['admin', 'direktur', 'keuangan', 'redaksi', 'hrd', 'marketing', 'team'];
    if (!validRoles.includes(role)) {
      return {
        success: false,
        message: "Role tidak valid"
      };
    }

    console.log('Creating user with email:', email);

    // Create admin client dengan service role
    const supabase = createAdminClient();

    // Cek apakah email sudah ada
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('Error listing users:', listError);
      return {
        success: false,
        message: "Error checking existing users"
      };
    }

    const emailExists = existingUsers.users.some(user => user.email === email);
    if (emailExists) {
      return {
        success: false,
        message: "Email sudah terdaftar dalam sistem"
      };
    }

    // Buat user di Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto confirm email
    });

    if (authError) {
      console.error('Auth error:', authError);
      return {
        success: false,
        message: `Error creating auth user: ${authError.message}`
      };
    }

    if (!authData.user) {
      return {
        success: false,
        message: "Gagal membuat user - no user data returned"
      };
    }

    console.log('Auth user created:', authData.user.id);

    // Buat profile di database
    const { error: profileError } = await supabase
      .from("Profile")
      .insert({
        id: authData.user.id,
        full_name: fullName,
        role: role
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      
      // Jika gagal buat profile, hapus auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return {
        success: false,
        message: `Error creating profile: ${profileError.message}`
      };
    }

    console.log('Profile created successfully');
    console.log('=== CREATE USER SUCCESS ===');

    // Revalidate cache untuk halaman users
    revalidatePath('/admin/users');
    revalidatePath('/admin');

    return {
      success: true,
      message: `User ${fullName} berhasil dibuat dengan role ${role}`,
      userId: authData.user.id
    };

  } catch (error) {
    console.error('Unexpected error in createUserAction:', error);
    return {
      success: false,
      message: "Terjadi kesalahan tidak terduga"
    };
  }
}