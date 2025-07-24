// app/redaksi/posts/create/page.tsx

import { createClient } from "@/lib/supabase/server";
import { CreatePostForm } from "./create-post-form";

// Get categories for the form
async function getCategories() {
  const supabase = await createClient();
  
  try {
    // Debug: log the attempt
    console.log('Fetching categories...');
    
    const { data: categories, error } = await supabase
      .from("postcategories")  // Changed to lowercase
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      return [];
    }

    console.log('Categories fetched:', categories);
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
      .from("posttags")  // Changed to lowercase
      .select("name")
      .order("name")
      .limit(50); // Limit to most common tags

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

export default async function CreatePostPage() {
  const categories = await getCategories();
  const existingTags = await getTags();

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Tulis Artikel Baru</h1>
        <p className="text-muted-foreground">
          Buat artikel berita yang menarik dan informatif untuk pembaca.
        </p>
      </div>

      <CreatePostForm 
        categories={categories}
        existingTags={existingTags}
      />
    </div>
  );
}