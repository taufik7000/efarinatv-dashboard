"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ActionResult = {
  success: boolean;
  message: string;
};

export async function createCategoryAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name) {
    return { success: false, message: "Nama kategori wajib diisi." };
  }

  const { error } = await supabase
    .from("BudgetCategories")
    .insert({ name, description, created_by: user?.id });

  if (error) {
    console.error("Error creating budget category:", error);
    return { success: false, message: `Gagal membuat kategori: ${error.message}` };
  }

  revalidatePath("/direktur/budgeting");
  return { success: true, message: "Kategori berhasil dibuat." };
}

export async function createBudgetAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const categoryId = formData.get("categoryId") as string;
  const allocatedAmount = formData.get("allocatedAmount") as string;
  const periodStart = formData.get("periodStart") as string;
  const periodEnd = formData.get("periodEnd") as string;

  if (!categoryId || !allocatedAmount || !periodStart || !periodEnd) {
    return { success: false, message: "Semua kolom wajib diisi." };
  }

  const { error } = await supabase
    .from("Budgets")
    .insert({
      category_id: categoryId,
      allocated_amount: Number(allocatedAmount),
      period_start: periodStart,
      period_end: periodEnd,
      created_by: user?.id,
    });

  if (error) {
    console.error("Error creating budget:", error);
    return { success: false, message: `Gagal membuat anggaran: ${error.message}` };
  }

  revalidatePath("/direktur/budgeting");
  return { success: true, message: "Alokasi anggaran berhasil disimpan." };
}

// UPDATE ACTIONS
export async function updateCategoryAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!id || !name) {
    return { success: false, message: "ID dan nama kategori wajib diisi." };
  }

  const { error } = await supabase
    .from("BudgetCategories")
    .update({ 
      name, 
      description: description || null 
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating budget category:", error);
    return { success: false, message: `Gagal mengupdate kategori: ${error.message}` };
  }

  revalidatePath("/direktur/budgeting");
  return { success: true, message: "Kategori berhasil diperbarui." };
}

export async function updateBudgetAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  
  const id = formData.get("id") as string;
  const categoryId = formData.get("categoryId") as string;
  const allocatedAmount = formData.get("allocatedAmount") as string;
  const periodStart = formData.get("periodStart") as string;
  const periodEnd = formData.get("periodEnd") as string;

  if (!id || !categoryId || !allocatedAmount || !periodStart || !periodEnd) {
    return { success: false, message: "Semua kolom wajib diisi." };
  }

  const { error } = await supabase
    .from("Budgets")
    .update({
      category_id: categoryId,
      allocated_amount: Number(allocatedAmount),
      period_start: periodStart,
      period_end: periodEnd,
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating budget:", error);
    return { success: false, message: `Gagal mengupdate anggaran: ${error.message}` };
  }

  revalidatePath("/direktur/budgeting");
  return { success: true, message: "Rencana anggaran berhasil diperbarui." };
}

// DELETE ACTIONS
export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  if (!id) {
    return { success: false, message: "ID kategori tidak valid." };
  }

  // Check if category is being used in any budgets
  const { data: budgets, error: checkError } = await supabase
    .from("Budgets")
    .select("id")
    .eq("category_id", id)
    .limit(1);

  if (checkError) {
    console.error("Error checking budget usage:", checkError);
    return { success: false, message: "Gagal memeriksa penggunaan kategori." };
  }

  if (budgets && budgets.length > 0) {
    return { 
      success: false, 
      message: "Kategori tidak dapat dihapus karena masih digunakan dalam rencana anggaran." 
    };
  }

  const { error } = await supabase
    .from("BudgetCategories")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting budget category:", error);
    return { success: false, message: `Gagal menghapus kategori: ${error.message}` };
  }

  revalidatePath("/direktur/budgeting");
  return { success: true, message: "Kategori berhasil dihapus." };
}

export async function deleteBudgetAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  if (!id) {
    return { success: false, message: "ID anggaran tidak valid." };
  }

  // Check if budget has any related transactions
  const { data: transactions, error: checkError } = await supabase
    .from("Transactions")
    .select("id")
    .eq("category_id", id)
    .limit(1);

  if (checkError) {
    console.error("Error checking transaction usage:", checkError);
    // Continue with deletion even if check fails, as the constraint should handle it
  }

  const { error } = await supabase
    .from("Budgets")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting budget:", error);
    
    // Check if error is due to foreign key constraint
    if (error.message.includes('foreign key') || error.message.includes('referenced')) {
      return { 
        success: false, 
        message: "Anggaran tidak dapat dihapus karena masih ada transaksi yang terkait." 
      };
    }
    
    return { success: false, message: `Gagal menghapus anggaran: ${error.message}` };
  }

  revalidatePath("/direktur/budgeting");
  return { success: true, message: "Rencana anggaran berhasil dihapus." };
}