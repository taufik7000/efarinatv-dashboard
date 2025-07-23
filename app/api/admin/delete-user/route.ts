// app/api/admin/delete-user/route.ts

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

export async function DELETE(request: NextRequest) {
  try {
    console.log('=== DELETE USER API START ===');
    
    // Parse request body
    const body = await request.json();
    const { userId } = body;

    console.log('Received userId:', userId);

    // Validation
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.error('Invalid UUID format:', userId);
      return NextResponse.json(
        { error: 'Invalid user ID format. Expected UUID.' },
        { status: 400 }
      );
    }

    console.log('Deleting user with valid UUID:', userId);

    // Create admin client with service role
    const supabase = createAdminClient();

    // Get user info before deletion (for logging)
    console.log('Fetching user profile...');
    const { data: profile, error: profileFetchError } = await supabase
      .from("Profile")
      .select("full_name, role")
      .eq("id", userId)
      .single();

    if (profileFetchError) {
      console.error('Error fetching profile:', profileFetchError);
      // Continue anyway, maybe profile doesn't exist
    }

    console.log('User profile:', profile);

    // Delete from Profile table first (due to foreign key)
    console.log('Deleting from Profile table...');
    const { error: profileError } = await supabase
      .from("Profile")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
      // Continue to try deleting auth user anyway
    } else {
      console.log('Profile deleted successfully');
    }

    // Delete from auth.users
    console.log('Deleting from auth.users...');
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      return NextResponse.json(
        { error: `Error deleting auth user: ${authError.message}` },
        { status: 500 }
      );
    }

    console.log('Auth user deleted successfully');
    console.log('=== DELETE USER SUCCESS ===');

    return NextResponse.json({
      success: true,
      message: `User ${profile?.full_name || 'Unknown'} successfully deleted`,
      userId: userId
    });

  } catch (error: any) {
    console.error('Unexpected error in delete-user API:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'An unexpected error occurred: ' + error.message },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}