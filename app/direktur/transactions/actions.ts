// app/direktur/transactions/actions.ts

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
    category_id: formData.get("category_id") as string || null,
    receipt_url: formData.get("receipt_url") as string || null,
    requester_id: user.id, // Pastikan ini sesuai dengan tipe di database
    status: 'Tertunda', // Status default saat dibuat
  };

  console.log("Creating transaction with data:", transactionData);
  console.log("User ID:", user.id);

  // Validasi dasar
  if (!transactionData.transaction_date || !transactionData.description || !transactionData.amount || !transactionData.type) {
    return { success: false, message: "Kolom wajib (tanggal, deskripsi, jumlah, jenis) tidak boleh kosong." };
  }

  // Validasi jenis transaksi
  if (!['Pemasukan', 'Pengeluaran'].includes(transactionData.type)) {
    return { success: false, message: "Jenis transaksi tidak valid." };
  }

  // Validasi amount harus positif
  if (transactionData.amount <= 0) {
    return { success: false, message: "Jumlah transaksi harus lebih dari 0." };
  }

  try {
    const { data, error } = await supabase
      .from("Transactions")
      .insert(transactionData)
      .select(); // Tambahkan select untuk mendapatkan data yang diinsert

    if (error) {
      console.error("Error creating transaction:", error);
      return { success: false, message: `Gagal membuat transaksi: ${error.message}` };
    }

    console.log("Transaction created successfully:", data);
    revalidatePath("/direktur/transactions");
    return { success: true, message: "Transaksi baru berhasil dibuat dan sedang menunggu persetujuan." };
  } catch (error: any) {
    console.error("Unexpected error creating transaction:", error);
    return { success: false, message: "Terjadi kesalahan tidak terduga saat membuat transaksi." };
  }
}