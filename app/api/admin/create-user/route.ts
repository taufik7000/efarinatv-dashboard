// app/api/admin/create-user/route.ts

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
  try {
    console.log('=== CREATE USER API START ===');
    
    // Debug environment variables
    console.log('SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('SERVICE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0);
    
    const body = await request.json();
    const { fullName, email, password, role } = body;

    // Validation
    if (!fullName || !email || !password || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const validRoles = ['admin', 'direktur', 'keuangan', 'redaksi', 'hrd', 'marketing', 'team'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    console.log('Creating user with email:', email);

    // Create admin client with service role
    const supabase = createAdminClient();

    // Check if email already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('Error listing users:', listError);
      return NextResponse.json(
        { error: 'Error checking existing users: ' + listError.message },
        { status: 500 }
      );
    }

    const emailExists = existingUsers.users.some(user => user.email === email);
    if (emailExists) {
      return NextResponse.json(
        { error: 'Email already exists in the system' },
        { status: 409 }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto confirm email
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: `Error creating auth user: ${authError.message}` },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user - no user data returned' },
        { status: 500 }
      );
    }

    console.log('Auth user created:', authData.user.id);

    // Create profile in database
    const { error: profileError } = await supabase
      .from("Profile")
      .insert({
        id: authData.user.id,
        full_name: fullName,
        role: role
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      
      // If profile creation fails, delete the auth user (cleanup)
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json(
        { error: `Error creating profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    console.log('Profile created successfully');
    console.log('=== CREATE USER SUCCESS ===');

    return NextResponse.json({
      success: true,
      message: `User ${fullName} successfully created with role ${role}`,
      userId: authData.user.id
    });

  } catch (error: any) {
    console.error('Unexpected error in create-user API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred: ' + error.message },
      { status: 500 }
    );
  }
}