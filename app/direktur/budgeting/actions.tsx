// app/direktur/budgeting/actions.ts

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