// app/redaksi/posts/create/create-post-form.tsx - Clean version

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
  FileText
} from "lucide-react";
import Link from "next/link";
import { createPostAction } from "./actions";
import { uploadPostThumbnail } from "@/lib/utils/upload-post";
import { TiptapWrapper } from "@/components/editor/tiptap-wrapper";

type Category = {
  id: string;
  name: string;
  color?: string;
  description?: string;
};

interface CreatePostFormProps {
  categories: Category[];
  existingTags: string[];
}

export function CreatePostForm({ categories, existingTags }: CreatePostFormProps) {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");
  
  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [status, setStatus] = useState("draft");
  const [featured, setFeatured] = useState(false);
  
  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // Fix hydration issue
  useEffect(() => {
    setIsClient(true);
  }, []);

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

    formData.set("content", content);
    formData.set("tags", tags.join(", "));
    formData.set("thumbnail_url", thumbnailUrl);
    formData.set("status", submitStatus);
    formData.set("featured", featured.toString());

    try {
      const result = await createPostAction(formData);
      
      if (result.success) {
        setMessage(result.message);
        setMessageType("success");
        
        setTimeout(() => {
          if (submitStatus === 'published') {
            router.push("/redaksi/posts");
          } else {
            router.push("/redaksi/posts?status=draft");
          }
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

  // Show loading until client hydration
  if (!isClient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Memuat form...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href="/redaksi/posts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        
        <div className="flex items-center gap-2">
          <Badge variant={status === 'published' ? 'default' : 'secondary'}>
            {status === 'published' ? 'Akan Dipublikasi' : 'Draft'}
          </Badge>
          {featured && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-200">
              Featured
            </Badge>
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
                    placeholder="Tulis konten artikel di sini... Gunakan toolbar untuk formatting dan menambahkan gambar."
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tips: Gunakan toolbar untuk formatting, tambah gambar, link, dan elemen lainnya
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Thumbnail Upload */}
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
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(thumbnailUrl, '_blank')}
                      >
                        <Eye className="mr-2 h-3 w-3" />
                        Preview
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Settings */}
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
                
                <div className="space-y-2">
                  <Label>Status Publikasi</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={status === 'draft' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStatus('draft')}
                      disabled={isLoading}
                    >
                      Draft
                    </Button>
                    <Button
                      type="button"
                      variant={status === 'published' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStatus('published')}
                      disabled={isLoading}
                    >
                      Publish
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category */}
            <Card>
              <CardHeader>
                <CardTitle>Kategori</CardTitle>
                <CardDescription>
                  {categories.length > 0 ? `${categories.length} kategori tersedia` : 'Tidak ada kategori'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categories.length > 0 ? (
                  <select
                    name="category_id"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    disabled={isLoading}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Tidak ada kategori. <br />
                    Silakan buat kategori terlebih dahulu di menu Kategori.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Tags
                </CardTitle>
                <CardDescription>
                  Maksimal 5 tags (pisahkan dengan Enter atau koma)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Tambah tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInput}
                  disabled={isLoading || tags.length >= 5}
                />
                
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                          disabled={isLoading}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {existingTags.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs">Saran Tags:</Label>
                    <div className="flex flex-wrap gap-1">
                      {existingTags.slice(0, 10).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => addTag(tag)}
                          disabled={isLoading || tags.includes(tag) || tags.length >= 5}
                          className="text-xs px-2 py-1 rounded-md border border-dashed border-muted-foreground/50 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
              handleSubmit(formData, 'draft');
            }}
            disabled={isLoading || !title || !content}
            variant="outline"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Simpan Draft
          </Button>
          
          <Button
            type="button"
            onClick={() => {
              const formData = new FormData(formRef.current!);
              handleSubmit(formData, 'published');
            }}
            disabled={isLoading || !title || !content}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Send className="mr-2 h-4 w-4" />
            Publikasikan
          </Button>
        </div>
      </form>
    </div>
  );
}