"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Tipe untuk hasil dari server action
type ActionResult = {
  success: boolean;
  message: string;
};

// Server Action untuk membuat transaksi baru
export async function createTransactionAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Otentikasi pengguna gagal." };
  }

  // Mengambil data dari form
  const transactionData = {
    transaction_date: formData.get("transaction_date") as string,
    description: formData.get("description") as string,
    amount: Number(formData.get("amount") as string),
    type: formData.get("type") as string,
    category_id: formData.get("category_id") as string,
    receipt_url: formData.get("receipt_url") as string | null,
    requester_id: user.id,
    status: 'Tertunda', // Status default saat dibuat
  };

  // Validasi dasar
  if (!transactionData.transaction_date || !transactionData.description || !transactionData.amount || !transactionData.type) {
    return { success: false, message: "Kolom yang wajib diisi tidak boleh kosong." };
  }

  const { error } = await supabase
    .from("Transactions")
    .insert(transactionData);

  if (error) {
    console.error("Error creating transaction:", error);
    return { success: false, message: `Gagal membuat transaksi: ${error.message}` };
  }

  revalidatePath("/direktur/transactions");
  return { success: true, message: "Transaksi baru berhasil dibuat dan sedang menunggu persetujuan." };
}
