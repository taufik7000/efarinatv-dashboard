// app/redaksi/posts/[id]/edit/page.tsx

import { createClient } from "@/lib/supabase/server";
import { EditPostForm } from "./edit-post-form";
import { notFound, redirect } from "next/navigation";

// Get post data by ID
async function getPost(postId: string) {
  const supabase = await createClient();
  
  try {
    const { data: post, error } = await supabase
      .from("posts")
      .select(`
        id,
        title,
        slug,
        content,
        excerpt,
        thumbnail_url,
        status,
        featured,
        category_id,
        author_id,
        created_at,
        updated_at,
        category:postcategories(id, name, color),
        author:Profile(full_name)
      `)
      .eq("id", postId)
      .single();

    if (error) {
      console.error("Error fetching post:", error);
      return null;
    }

    return post;
  } catch (error) {
    console.error("Unexpected error fetching post:", error);
    return null;
  }
}

// Get post tags
async function getPostTags(postId: string) {
  const supabase = await createClient();
  
  try {
    const { data: tagRelations, error } = await supabase
      .from("posttagrelations")
      .select(`
        tag:posttags(name)
      `)
      .eq("post_id", postId);

    if (error) {
      console.error("Error fetching post tags:", error);
      return [];
    }

    return tagRelations?.map(relation => relation.tag?.name).filter(Boolean) || [];
  } catch (error) {
    console.error("Unexpected error fetching post tags:", error);
    return [];
  }
}

// Get categories for the form
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

// Get existing tags for autocomplete
async function getTags() {
  const supabase = await createClient();
  
  try {
    const { data: tags, error } = await supabase
      .from("posttags")
      .select("name")
      .order("name")
      .limit(50);

    if (error) {
      console.error("Error fetching tags:", error);
      return [];
    }

    return tags?.map(tag => tag.name) || [];
  } catch (error) {
    console.error("Unexpected error fetching tags:", error);
    return [];
  }
}

// Check permissions
async function checkPermissions(postId: string) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { canEdit: false, reason: 'not_authenticated' };
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("Profile")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    const userRole = profile?.role?.toString().toLowerCase();

    // Get post data to check author
    const { data: post } = await supabase
      .from("posts")
      .select("author_id, author:Profile(full_name)")
      .eq("id", postId)
      .single();

    if (!post) {
      return { canEdit: false, reason: 'post_not_found' };
    }

    // Check permissions
    const isAdmin = ['admin', 'direktur', 'redaksi'].includes(userRole || '');
    const isAuthor = post.author_id === user.id;

    if (isAdmin || isAuthor) {
      return { canEdit: true, user: { id: user.id, role: userRole, fullName: profile?.full_name } };
    }

    return { canEdit: false, reason: 'insufficient_permissions' };
  } catch (error) {
    console.error("Error checking permissions:", error);
    return { canEdit: false, reason: 'error' };
  }
}

interface PageProps {
  params: { id: string };
}

export default async function EditPostPage({ params }: PageProps) {
  const postId = params.id;

  // Check permissions first
  const permissionCheck = await checkPermissions(postId);
  
  if (!permissionCheck.canEdit) {
    if (permissionCheck.reason === 'not_authenticated') {
      redirect('/login');
    } else if (permissionCheck.reason === 'post_not_found') {
      notFound();
    } else {
      // Insufficient permissions - redirect to posts list with message
      redirect('/redaksi/posts?error=access_denied');
    }
  }

  // Get all required data
  const [post, postTags, categories, existingTags] = await Promise.all([
    getPost(postId),
    getPostTags(postId),
    getCategories(),
    getTags()
  ]);

  if (!post) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Edit Artikel</h1>
        <p className="text-muted-foreground">
          Edit dan perbarui artikel "{post.title}".
        </p>
      </div>

      <EditPostForm 
        post={post}
        postTags={postTags}
        categories={categories}
        existingTags={existingTags}
        currentUser={permissionCheck.user}
      />
    </div>
  );
}