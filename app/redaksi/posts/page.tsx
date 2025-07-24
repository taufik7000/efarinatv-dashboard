// app/redaksi/posts/page.tsx

import { createClient } from "@/lib/supabase/server";
import { PostsTable } from "./posts-table";

// Get all posts with author and category info
async function getPosts() {
  const supabase = await createClient();
  
  try {
    const { data: posts, error } = await supabase
      .from("posts")
      .select(`
        id,
        title,
        slug,
        status,
        featured,
        view_count,
        created_at,
        published_at,
        updated_at,
        author:Profile(full_name),
        category:postcategories(name, color)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error);
      return [];
    }

    return posts || [];
  } catch (error) {
    console.error("Unexpected error fetching posts:", error);
    return [];
  }
}

// Get categories for filter
async function getCategories() {
  const supabase = await createClient();
  
  try {
    const { data: categories, error } = await supabase
      .from("postcategories")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      return [];
    }

    return categories || [];
  } catch (error) {
    console.error("Unexpected error fetching categories:", error);
    return [];
  }
}

// Get current user info
async function getCurrentUser() {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data: profile } = await supabase
      .from("Profile")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    return {
      id: user.id,
      role: profile?.role || 'team',
      fullName: profile?.full_name || 'User'
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export default async function PostsPage() {
  const posts = await getPosts();
  const categories = await getCategories();
  const currentUser = await getCurrentUser();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kelola Artikel</h1>
          <p className="text-muted-foreground">
            Kelola semua artikel berita yang telah dibuat.
            {posts.length > 0 && ` Total: ${posts.length} artikel`}
          </p>
        </div>
      </div>

      <PostsTable 
        posts={posts}
        categories={categories}
        currentUser={currentUser}
      />
    </div>
  );
}