// app/redaksi/posts/[id]/edit/edit-post-form.tsx - Updated with Tiptap

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, 
  Loader2, 
  Upload, 
  X, 
  Eye, 
  Save, 
  Send,
  Image as ImageIcon,
  Hash,
  FileText,
  Trash2,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { updatePostAction, deletePostAction } from "./actions";
import { uploadPostThumbnail } from "@/lib/utils/upload-post";
import { TiptapWrapper } from "@/components/editor/tiptap-wrapper";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ... (rest of the types remain the same)
type Post = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  thumbnail_url: string | null;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  category_id: string | null;
  author_id: string;
  created_at: string;
  updated_at: string;
  category: { id: string; name: string; color: string } | null;
  author: { full_name: string } | null;
};

type Category = {
  id: string;
  name: string;
  color?: string;
  description?: string;
};

type CurrentUser = {
  id: string;
  role: string;
  fullName: string;
};

interface EditPostFormProps {
  post: Post;
  postTags: string[];
  categories: Category[];
  existingTags: string[];
  currentUser: CurrentUser;
}

export function EditPostForm({ 
  post, 
  postTags, 
  categories, 
  existingTags, 
  currentUser 
}: EditPostFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");
  
  // Form states - initialize with existing post data
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [selectedCategory, setSelectedCategory] = useState(post.category_id || "");
  const [tags, setTags] = useState<string[]>(postTags);
  const [tagInput, setTagInput] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState(post.thumbnail_url || "");
  const [status, setStatus] = useState(post.status);
  const [featured, setFeatured] = useState(post.featured);
  
  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // Handle tag input
  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput.trim());
    }
  };

  const addTag = (tagName: string) => {
    if (tagName && !tags.includes(tagName) && tags.length < 5) {
      setTags([...tags, tagName]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage("File harus berupa gambar");
      setMessageType("error");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setMessage("Ukuran file maksimal 5MB");
      setMessageType("error");
      return;
    }

    setSelectedFile(file);
    setMessage("");
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setMessage("");

    try {
      const result = await uploadPostThumbnail(selectedFile);
      
      if (result.success && result.url) {
        setThumbnailUrl(result.url);
        setMessage("Thumbnail berhasil diupload!");
        setMessageType("success");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(result.error || "Gagal upload thumbnail");
        setMessageType("error");
      }
    } catch (error: any) {
      setMessage("Terjadi kesalahan saat upload: " + error.message);
      setMessageType("error");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (formData: FormData, submitStatus: string) => {
    setIsLoading(true);
    setMessage("");

    // Add additional form data
    formData.set("post_id", post.id);
    formData.set("content", content);  // Use Tiptap content
    formData.set("tags", tags.join(", "));
    formData.set("thumbnail_url", thumbnailUrl);
    formData.set("status", submitStatus);
    formData.set("featured", featured.toString());

    try {
      const result = await updatePostAction(formData);
      
      if (result.success) {
        setMessage(result.message);
        setMessageType("success");
        
        // Redirect after success
        setTimeout(() => {
          router.push("/redaksi/posts");
        }, 2000);
      } else {
        setMessage(result.message);
        setMessageType("error");
      }
    } catch (error: any) {
      setMessage("Terjadi kesalahan: " + error.message);
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete post
  const handleDelete = async () => {
    setIsDeleting(true);
    setMessage("");

    try {
      const result = await deletePostAction(post.id);
      
      if (result.success) {
        setMessage(result.message);
        setMessageType("success");
        
        // Redirect after success
        setTimeout(() => {
          router.push("/redaksi/posts");
        }, 1500);
      } else {
        setMessage(result.message);
        setMessageType("error");
      }
    } catch (error: any) {
      setMessage("Terjadi kesalahan: " + error.message);
      setMessageType("error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Check if user can delete
  const canDelete = ['admin', 'direktur'].includes(currentUser.role) || 
                   post.author_id === currentUser.id;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href="/redaksi/posts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar
          </Link>
        </Button>
        
        <div className="flex items-center gap-2">
          <Badge variant={status === 'published' ? 'default' : 'secondary'}>
            {status === 'published' ? 'Diterbitkan' : status === 'draft' ? 'Draft' : 'Diarsipkan'}
          </Badge>
          {featured && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-200">
              Featured
            </Badge>
          )}
          
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Hapus Artikel
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah Anda yakin ingin menghapus artikel "{post.title}"? 
                    Tindakan ini tidak dapat dibatalkan dan akan menghapus artikel secara permanen.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          messageType === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <form ref={formRef} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Konten Artikel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul Artikel *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Masukkan judul artikel yang menarik..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    disabled={isLoading}
                    className="text-lg font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Konten Artikel *</Label>
                  <TiptapWrapper
                    content={content}
                    onChange={setContent}
                    placeholder="Edit konten artikel..."
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Thumbnail Upload - Same as create form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Thumbnail Artikel
                </CardTitle>
                <CardDescription>
                  Upload gambar utama untuk artikel (opsional, max 5MB)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!thumbnailUrl ? (
                  <div className="space-y-3">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      disabled={isLoading || isUploading}
                      className="cursor-pointer"
                    />
                    {selectedFile && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleUpload}
                          disabled={isUploading || isLoading}
                        >
                          {isUploading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                          <Upload className="mr-2 h-3 w-3" />
                          {isUploading ? 'Uploading...' : 'Upload'}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <img 
                        src={thumbnailUrl} 
                        alt="Thumbnail" 
                        className="w-full max-h-48 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setThumbnailUrl("");
                          setSelectedFile(null);
                        }}
                        disabled={isLoading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Same structure as create form */}
          <div className="space-y-6">
            {/* Publish Settings, Category, Tags - same as before */}
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Publish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="featured">Artikel Unggulan</Label>
                  <Switch
                    id="featured"
                    checked={featured}
                    onCheckedChange={setFeatured}
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-6 border-t">
          <Button
            type="button"
            onClick={() => {
              const formData = new FormData(formRef.current!);
              handleSubmit(formData, status); // Keep current status
            }}
            disabled={isLoading || !title || !content}
            variant="outline"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </div>
  );
}