// app/redaksi/posts/create/actions.ts

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Generate slug dari title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Generate excerpt dari content
function generateExcerpt(content: string, maxLength: number = 160): string {
  // Remove HTML tags if any
  const textOnly = content.replace(/<[^>]*>/g, '');
  if (textOnly.length <= maxLength) return textOnly;
  return textOnly.substring(0, maxLength).trim() + '...';
}

type ActionResult = {
  success: boolean;
  message: string;
  postId?: string;
};

export async function createPostAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, message: "Authentication required" };
    }

    // Check if user has permission
    const { data: profile } = await supabase
      .from("Profile")  // Keep this as is since Profile table uses proper case
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = profile?.role?.toString().toLowerCase();
    if (!['admin', 'direktur', 'redaksi'].includes(userRole || '')) {
      return { success: false, message: "You don't have permission to create posts" };
    }

    // Extract form data
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const categoryId = formData.get("category_id") as string;
    const tags = formData.get("tags") as string; // Comma-separated tag names
    const thumbnailUrl = formData.get("thumbnail_url") as string;
    const status = formData.get("status") as string || 'draft';
    const featured = formData.get("featured") === 'true';

    // Validation
    if (!title || !content) {
      return { success: false, message: "Title and content are required" };
    }

    // Generate slug and excerpt
    const slug = generateSlug(title);
    const excerpt = generateExcerpt(content);

    // Check if slug already exists
    const { data: existingPost } = await supabase
      .from("posts")  // Changed to lowercase
      .select("id")
      .eq("slug", slug)
      .single();

    if (existingPost) {
      // If slug exists, add timestamp to make it unique
      const uniqueSlug = `${slug}-${Date.now()}`;
      
      // Create the post with unique slug
      const { data: newPost, error: postError } = await supabase
        .from("posts")  // Changed to lowercase
        .insert({
          title,
          slug: uniqueSlug,
          content,
          excerpt,
          thumbnail_url: thumbnailUrl || null,
          status,
          featured,
          category_id: categoryId || null,
          author_id: user.id,
          published_at: status === 'published' ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (postError) {
        console.error("Error creating post:", postError);
        return { success: false, message: `Failed to create post: ${postError.message}` };
      }

      // Handle tags if provided
      if (tags && tags.trim()) {
        await handlePostTags(supabase, newPost.id, tags);
      }

      revalidatePath("/redaksi/posts");
      revalidatePath("/redaksi");
      
      return { 
        success: true, 
        message: `Post "${title}" created successfully!`,
        postId: newPost.id
      };
    } else {
      // Create post with original slug
      const { data: newPost, error: postError } = await supabase
        .from("posts")  // Changed to lowercase
        .insert({
          title,
          slug,
          content,
          excerpt,
          thumbnail_url: thumbnailUrl || null,
          status,
          featured,
          category_id: categoryId || null,
          author_id: user.id,
          published_at: status === 'published' ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (postError) {
        console.error("Error creating post:", postError);
        return { success: false, message: `Failed to create post: ${postError.message}` };
      }

      // Handle tags if provided
      if (tags && tags.trim()) {
        await handlePostTags(supabase, newPost.id, tags);
      }

      revalidatePath("/redaksi/posts");
      revalidatePath("/redaksi");
      
      return { 
        success: true, 
        message: `Post "${title}" created successfully!`,
        postId: newPost.id
      };
    }

  } catch (error: any) {
    console.error("Unexpected error creating post:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

// Helper function to handle tags
async function handlePostTags(supabase: any, postId: string, tagsString: string) {
  try {
    const tagNames = tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    for (const tagName of tagNames) {
      // Check if tag exists, if not create it
      let { data: existingTag } = await supabase
        .from("posttags")  // Changed to lowercase
        .select("id")
        .eq("name", tagName)
        .single();

      let tagId: string;

      if (!existingTag) {
        // Create new tag
        const tagSlug = generateSlug(tagName);
        const { data: newTag, error: tagError } = await supabase
          .from("posttags")  // Changed to lowercase
          .insert({
            name: tagName,
            slug: tagSlug
          })
          .select()
          .single();

        if (tagError) {
          console.error("Error creating tag:", tagError);
          continue; // Skip this tag and continue with others
        }
        tagId = newTag.id;
      } else {
        tagId = existingTag.id;
      }

      // Create post-tag relationship
      await supabase
        .from("posttagrelations")  // Changed to lowercase
        .insert({
          post_id: postId,
          tag_id: tagId
        });
    }
  } catch (error) {
    console.error("Error handling post tags:", error);
    // Don't fail the whole operation if tags fail
  }
}