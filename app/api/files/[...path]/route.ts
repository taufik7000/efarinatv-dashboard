// app/api/files/[...path]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // 1. Authentication check - hanya user yang login
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized - Login required to access files' 
      }, { status: 401 });
    }

    // 2. Path validation
    const path = params.path.join('/');
    
    // Pastikan hanya akses file di transaction-receipts
    if (!path.startsWith('transaction-receipts/')) {
      return NextResponse.json({ 
        error: 'Access denied - Invalid file path' 
      }, { status: 403 });
    }

    // Prevent path traversal attacks
    if (path.includes('..') || path.includes('//') || path.includes('\\')) {
      return NextResponse.json({ 
        error: 'Access denied - Invalid characters in path' 
      }, { status: 403 });
    }

    // 3. Role-based access (opsional - bisa diaktifkan jika perlu)
    const { data: profile } = await supabase
      .from('Profile')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role?.toLowerCase();
    
    // Hanya role tertentu yang bisa akses (uncomment jika perlu)
    // const allowedRoles = ['admin', 'direktur', 'keuangan'];
    // if (!allowedRoles.includes(userRole)) {
    //   return NextResponse.json({ 
    //     error: 'Access denied - Insufficient permissions' 
    //   }, { status: 403 });
    // }

    // 4. Check if user can access this specific file
    // Extract user ID from path (transaction-receipts/userId/filename.ext)
    const pathParts = path.split('/');
    if (pathParts.length >= 3) {
      const fileUserId = pathParts[1]; // userId dari path
      
      // User hanya bisa akses file mereka sendiri, kecuali admin/direktur/keuangan
      const canAccessAnyFile = ['admin', 'direktur', 'keuangan'].includes(userRole);
      
      if (!canAccessAnyFile && fileUserId !== user.id) {
        return NextResponse.json({ 
          error: 'Access denied - You can only access your own files' 
        }, { status: 403 });
      }
    }

    // 5. Get file from Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    const originalUrl = `${supabaseUrl}/storage/v1/object/public/${path}`;
    
    // 6. Fetch the file with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(originalUrl, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'File not found',
        details: `File not accessible: ${response.status}`
      }, { status: 404 });
    }
    
    // 7. Validate file type (hanya gambar)
    const contentType = response.headers.get('content-type') || '';
    const allowedTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/gif', 
      'image/webp'
    ];
    
    if (!allowedTypes.some(type => contentType.includes(type))) {
      return NextResponse.json({ 
        error: 'File type not allowed - Only images permitted' 
      }, { status: 403 });
    }

    // 8. Get file data and return
    const fileData = await response.arrayBuffer();
    
    // Log access for security audit
    console.log(`File accessed: ${path} by user ${user.id} (${user.email}) with role ${userRole}`);
    
    return new NextResponse(fileData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600', // Private cache, 1 hour
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
    });
    
  } catch (error) {
    console.error('Error in file proxy:', error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json({ 
        error: 'Request timeout - File too large or slow connection' 
      }, { status: 408 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}