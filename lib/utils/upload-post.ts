// lib/utils/upload-post.ts

import { createClient } from "@/lib/supabase/client";

export type UploadResult = {
  success: boolean;
  url?: string;
  error?: string;
};

export async function uploadPostThumbnail(file: File): Promise<UploadResult> {
  try {
    const supabase = createClient();

    if (!file) {
      return { success: false, error: "File tidak ditemukan" };
    }

    if (!file.type.startsWith('image/')) {
      return { success: false, error: "File harus berupa gambar" };
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { success: false, error: "Ukuran file maksimal 5MB" };
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "User tidak ditemukan" };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Upload to post-thumbnails bucket
    const { data, error } = await supabase.storage
      .from('post-thumbnails')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: `Gagal upload: ${error.message}` };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('post-thumbnails')
      .getPublicUrl(fileName);
    
    return { success: true, url: publicUrl };

  } catch (error: any) {
    console.error('Unexpected upload error:', error);
    return { success: false, error: "Terjadi kesalahan saat upload" };
  }
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: "File harus berupa gambar (JPG, PNG, dll)" };
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { valid: false, error: "Ukuran file maksimal 5MB" };
  }

  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
    return { valid: false, error: "Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP" };
  }

  return { valid: true };
}