// app/(auth)/login/actions.ts - Fixed tanpa error logging untuk redirect

"use server";

import { createClient } from "@/lib/supabase/server";
import { getRoleDashboardPath } from "@/lib/utils/role-redirect";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function ensureUserProfile(supabase: any, userId: string, userEmail: string) {
  // Cek apakah profile sudah ada
  const { data: existingProfile, error: fetchError } = await supabase
    .from("Profile")
    .select("role, full_name")
    .eq("id", userId)
    .single();

  if (!fetchError && existingProfile) {
    // Profile sudah ada, return role
    return existingProfile.role;
  }

  console.log('Profile not found, creating new profile for user:', userId);

  // Tentukan role berdasarkan email
  let role = 'team'; // default
  const email = userEmail.toLowerCase();
  
  if (email.includes('admin')) role = 'admin';
  else if (email.includes('direktur')) role = 'direktur';
  else if (email.includes('keuangan')) role = 'keuangan';
  else if (email.includes('redaksi')) role = 'redaksi';
  else if (email.includes('hrd')) role = 'hrd';
  else if (email.includes('marketing')) role = 'marketing';

  const fullName = userEmail.split('@')[0] || 'User';

  // Buat profile baru
  const { error: createError } = await supabase
    .from("Profile")
    .insert({
      id: userId,
      full_name: fullName,
      role: role
    });

  if (createError) {
    console.error("Error creating profile:", createError);
    // Jika gagal buat profile, fallback ke role default
    return 'team';
  }

  console.log(`Profile created successfully with role: ${role} for user: ${userEmail}`);
  return role;
}

export async function login(formData: FormData) {
  console.log('=== LOGIN ATTEMPT START ===');
  
  try {
    // Validasi environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return redirect("/login?message=Konfigurasi server error");
    }

    const supabase = await createClient();
    console.log('Supabase client created successfully');

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Validasi input
    if (!email || !password) {
      console.log('Missing email or password');
      return redirect("/login?message=Email dan password wajib diisi");
    }

    console.log('Attempting login for email:', email);

    // Login ke Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error("Login Error:", authError.message);
      return redirect("/login?message=" + encodeURIComponent(authError.message));
    }

    if (!authData.user) {
      console.error("No user data returned from login");
      return redirect("/login?message=Login gagal - no user data");
    }

    console.log('Auth login successful for user:', authData.user.id);

    // Pastikan user memiliki profile, jika tidak buat otomatis
    const userRole = await ensureUserProfile(supabase, authData.user.id, authData.user.email!);
    const dashboardPath = getRoleDashboardPath(userRole);
    
    console.log('User role:', userRole);
    console.log('Redirecting to dashboard:', dashboardPath);
    console.log('=== LOGIN SUCCESS ===');

    revalidatePath("/", "layout");
    
    // redirect() akan throw NEXT_REDIRECT yang normal, jangan di-catch
    redirect(dashboardPath);

  } catch (error: any) {
    // Jangan log NEXT_REDIRECT sebagai error karena itu normal
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      // Ini adalah redirect yang normal, re-throw
      throw error;
    }
    
    // Hanya log error yang betulan unexpected
    console.error("Unexpected error during login:", error);
    return redirect("/login?message=Terjadi kesalahan tidak terduga");
  }
}

export async function signup(formData: FormData) {
  console.log('=== SIGNUP ATTEMPT START ===');
  
  try {
    // Validasi environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return redirect("/login?message=Konfigurasi server error");
    }

    const supabase = await createClient();
    console.log('Supabase client created successfully');

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Validasi input
    if (!email || !password) {
      console.log('Missing email or password');
      return redirect("/login?message=Email dan password wajib diisi");
    }

    // Validasi password minimal
    if (password.length < 6) {
      return redirect("/login?message=Password minimal 6 karakter");
    }

    console.log('Attempting signup for email:', email);

    // Signup ke Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error("Signup Error:", authError.message);
      return redirect("/login?message=" + encodeURIComponent(authError.message));
    }

    if (!authData.user) {
      console.error("No user data returned from signup");
      return redirect("/login?message=Signup gagal - no user data");
    }

    console.log('Auth signup successful for user:', authData.user.id);

    // Jika email confirmation diperlukan dan user belum confirmed
    if (!authData.user.email_confirmed_at && !authData.session) {
      console.log('Email confirmation required');
      return redirect("/login?message=Silakan cek email untuk konfirmasi akun");
    }

    // Buat profile dengan role otomatis berdasarkan email
    const userRole = await ensureUserProfile(supabase, authData.user.id, authData.user.email!);
    const dashboardPath = getRoleDashboardPath(userRole);

    console.log('=== SIGNUP SUCCESS ===');
    console.log('User role assigned:', userRole);
    console.log('Redirecting to dashboard:', dashboardPath);

    revalidatePath("/", "layout");
    
    // redirect() akan throw NEXT_REDIRECT yang normal
    redirect(dashboardPath);

  } catch (error: any) {
    // Jangan log NEXT_REDIRECT sebagai error karena itu normal
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      // Ini adalah redirect yang normal, re-throw
      throw error;
    }
    
    // Hanya log error yang betulan unexpected
    console.error("Unexpected error during signup:", error);
    return redirect("/login?message=Terjadi kesalahan tidak terduga");
  }
}

export async function logout() {
  try {
    console.log('=== LOGOUT ATTEMPT ===');
    
    const supabase = await createClient();
    
    if (!supabase || !supabase.auth) {
      console.error('Supabase client not properly initialized');
      return redirect("/login");
    }

    await supabase.auth.signOut();
    console.log('Logout successful');
    
    revalidatePath("/", "layout");
    redirect("/login");
    
  } catch (error: any) {
    // Jangan log NEXT_REDIRECT sebagai error
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    
    console.error("Error during logout:", error);
    return redirect("/login");
  }
}