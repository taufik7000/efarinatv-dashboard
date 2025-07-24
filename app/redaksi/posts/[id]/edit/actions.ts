// app/redaksi/posts/[id]/edit/actions.ts

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Generate slug dari title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Generate excerpt dari content
function generateExcerpt(content: string, maxLength: number = 160): string {
  const textOnly = content.replace(/<[^>]*>/g, '');
  if (textOnly.length <= maxLength) return textOnly;
  return textOnly.substring(0, maxLength).trim() + '...';
}

type ActionResult = {
  success: boolean;
  message: string;
  postId?: string;
};

export async function updatePostAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, message: "Authentication required" };
    }

    // Extract form data
    const postId = formData.get("post_id") as string;
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const categoryId = formData.get("category_id") as string;
    const tags = formData.get("tags") as string;
    const thumbnailUrl = formData.get("thumbnail_url") as string;
    const status = formData.get("status") as string || 'draft';
    const featured = formData.get("featured") === 'true';

    // Validation
    if (!postId || !title || !content) {
      return { success: false, message: "Post ID, title and content are required" };
    }

    // Check if user can edit this post
    const { data: existingPost } = await supabase
      .from("posts")
      .select("author_id")
      .eq("id", postId)
      .single();

    if (!existingPost) {
      return { success: false, message: "Post not found" };
    }

    // Check permissions
    const { data: profile } = await supabase
      .from("Profile")
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = profile?.role?.toString().toLowerCase();
    const isAdmin = ['admin', 'direktur', 'redaksi'].includes(userRole || '');
    const isAuthor = existingPost.author_id === user.id;

    if (!isAdmin && !isAuthor) {
      return { success: false, message: "You don't have permission to edit this post" };
    }

    // Generate new slug if title changed
    const slug = generateSlug(title);
    const excerpt = generateExcerpt(content);

    // Check if new slug conflicts with other posts (excluding current post)
    const { data: conflictingPost } = await supabase
      .from("posts")
      .select("id")
      .eq("slug", slug)
      .neq("id", postId)
      .single();

    let finalSlug = slug;
    if (conflictingPost) {
      finalSlug = `${slug}-${Date.now()}`;
    }

    // Update the post
    const updateData: any = {
      title,
      slug: finalSlug,
      content,
      excerpt,
      thumbnail_url: thumbnailUrl || null,
      status,
      featured,
      category_id: categoryId || null,
      updated_at: new Date().toISOString(),
    };

    // Set published_at if status is being changed to published
    if (status === 'published') {
      updateData.published_at = new Date().toISOString();
    } else if (status === 'draft') {
      updateData.published_at = null;
    }

    const { error: updateError } = await supabase
      .from("posts")
      .update(updateData)
      .eq("id", postId);

    if (updateError) {
      console.error("Error updating post:", updateError);
      return { success: false, message: `Failed to update post: ${updateError.message}` };
    }

    // Handle tags update
    if (tags !== undefined) {
      await updatePostTags(supabase, postId, tags);
    }

    revalidatePath("/redaksi/posts");
    revalidatePath("/redaksi");
    revalidatePath(`/redaksi/posts/${postId}/edit`);
    
    return { 
      success: true, 
      message: `Post "${title}" updated successfully!`,
      postId: postId
    };

  } catch (error: any) {
    console.error("Unexpected error updating post:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

// Helper function to update tags
async function updatePostTags(supabase: any, postId: string, tagsString: string) {
  try {
    // Delete existing tag relationships
    await supabase
      .from("posttagrelations")
      .delete()
      .eq("post_id", postId);

    // Add new tags if provided
    if (tagsString && tagsString.trim()) {
      const tagNames = tagsString
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      for (const tagName of tagNames) {
        // Check if tag exists, if not create it
        let { data: existingTag } = await supabase
          .from("posttags")
          .select("id")
          .eq("name", tagName)
          .single();

        let tagId: string;

        if (!existingTag) {
          // Create new tag
          const tagSlug = generateSlug(tagName);
          const { data: newTag, error: tagError } = await supabase
            .from("posttags")
            .insert({
              name: tagName,
              slug: tagSlug
            })
            .select()
            .single();

          if (tagError) {
            console.error("Error creating tag:", tagError);
            continue;
          }
          tagId = newTag.id;
        } else {
          tagId = existingTag.id;
        }

        // Create post-tag relationship
        await supabase
          .from("posttagrelations")
          .insert({
            post_id: postId,
            tag_id: tagId
          });
      }
    }
  } catch (error) {
    console.error("Error updating post tags:", error);
  }
}

export async function deletePostAction(postId: string): Promise<ActionResult> {
  const supabase = await createClient();
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, message: "Authentication required" };
    }

    // Check if post exists and user can delete it
    const { data: post } = await supabase
      .from("posts")
      .select("title, author_id")
      .eq("id", postId)
      .single();

    if (!post) {
      return { success: false, message: "Post not found" };
    }

    // Check permissions
    const { data: profile } = await supabase
      .from("Profile")
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = profile?.role?.toString().toLowerCase();
    const isAdmin = ['admin', 'direktur'].includes(userRole || '');
    const isAuthor = post.author_id === user.id;

    if (!isAdmin && !isAuthor) {
      return { success: false, message: "You don't have permission to delete this post" };
    }

    // Delete the post (cascading will handle tag relations)
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      console.error("Error deleting post:", deleteError);
      return { success: false, message: `Failed to delete post: ${deleteError.message}` };
    }

    revalidatePath("/redaksi/posts");
    revalidatePath("/redaksi");
    
    return { 
      success: true, 
      message: `Post "${post.title}" deleted successfully!`
    };

  } catch (error: any) {
    console.error("Unexpected error deleting post:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}