// lib/utils/upload.ts

import { createClient } from "@/lib/supabase/client";

export type UploadResult = {
  success: boolean;
  url?: string;
  error?: string;
};

export async function uploadReceiptImage(file: File, userId: string): Promise<UploadResult> {
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

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('transaction-receipts')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: `Gagal upload: ${error.message}` };
    }

    // PERBAIKAN: Selalu gunakan custom URL untuk upload baru
    const customUrl = getCustomFileUrl(fileName);
    
    return { success: true, url: customUrl };

  } catch (error: any) {
    console.error('Unexpected upload error:', error);
    return { success: false, error: "Terjadi kesalahan saat upload" };
  }
}

// Fungsi untuk generate custom URL
function getCustomFileUrl(fileName: string): string {
  // Ambil base URL dari environment atau fallback ke localhost
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  
  return `${baseUrl}/api/files/transaction-receipts/${fileName}`;
}

// Fungsi untuk convert URL lama ke URL baru
export function convertToCustomUrl(supabaseUrl: string): string {
  try {
    // Extract filename dari URL Supabase
    const match = supabaseUrl.match(/transaction-receipts\/(.+)$/);
    if (match) {
      const fileName = match[1];
      return getCustomFileUrl(fileName);
    }
    return supabaseUrl; // Fallback ke URL asli jika gagal parse
  } catch {
    return supabaseUrl;
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