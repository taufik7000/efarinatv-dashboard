// app/news/[slug]/page.tsx

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Eye } from "lucide-react";
import type { Metadata, ResolvingMetadata } from 'next';

// Tipe untuk props halaman
type Props = {
  params: { slug: string }
};

// Fungsi untuk mengambil data artikel dari Supabase berdasarkan slug
async function getPost(slug: string) {
  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from("posts")
    .select(`
      title,
      content,
      excerpt,
      published_at,
      thumbnail_url,
      view_count,
      author:Profile(full_name),
      category:postcategories(name, color),
      tags:posttagrelations(tag:posttags(name))
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !post) {
    if (error) console.error("Error fetching post:", error);
    return null;
  }
  
  return post;
}

// Fungsi untuk generate metadata SEO dinamis
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);

  if (!post) {
    return {
      title: "Artikel Tidak Ditemukan",
      description: "Artikel yang Anda cari tidak tersedia.",
    };
  }

  return {
    title: `${post.title} | Efarina TV`,
    description: post.excerpt || "Baca berita selengkapnya di EfarinaTV.",
    openGraph: {
      title: post.title,
      description: post.excerpt || "Baca berita selengkapnya di EfarinaTV.",
      images: post.thumbnail_url ? [post.thumbnail_url] : [],
      type: 'article',
      publishedTime: post.published_at || undefined,
      authors: post.author?.full_name ? [post.author.full_name] : [],
    },
  };
}


// Helper untuk format tanggal
const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};

// Komponen Halaman Artikel
export default async function NewsArticlePage({ params }: Props) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  // Update view count (fire and forget)
  // PERBAIKAN: Menambahkan 'await' karena createClient() adalah async
  const supabase = await createClient();
  const { error } = await supabase.rpc('increment_view_count', { post_slug: params.slug });
  if (error) {
    console.error('Error incrementing view count:', error);
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto max-w-4xl py-8 lg:py-12">
        <article>
          {/* Header Artikel */}
          <header className="mb-8">
            {post.category && (
              <a href="#" className="text-sm font-semibold text-primary hover:underline">
                {post.category.name.toUpperCase()}
              </a>
            )}
            <h1 className="mt-2 text-3xl lg:text-5xl font-bold tracking-tight text-gray-900 !leading-tight">
              {post.title}
            </h1>
            <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{post.author?.full_name || 'Tim Redaksi'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <time dateTime={post.published_at!}>
                  {formatDate(post.published_at!)}
                </time>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{(post.view_count || 0) + 1} views</span>
              </div>
            </div>
          </header>

          {/* Gambar Thumbnail */}
          {post.thumbnail_url && (
            <figure className="mb-8">
              <img
                src={post.thumbnail_url}
                alt={post.title}
                className="w-full h-auto rounded-lg object-cover shadow-lg"
              />
            </figure>
          )}

          {/* Konten Artikel */}
          <div
            className="prose prose-lg max-w-none prose-img:rounded-lg"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <footer className="mt-12 pt-6 border-t">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">Tags:</span>
                {post.tags.map((relation: any, index: number) => (
                  <Badge key={index} variant="secondary">
                    {relation.tag.name}
                  </Badge>
                ))}
              </div>
            </footer>
          )}
        </article>
      </div>
    </div>
  );
}