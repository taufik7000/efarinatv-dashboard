// app/direktur/budgeting/page.tsx

// Komponen ini adalah Server Component murni.
// Tugasnya adalah mengambil data dari database di sisi server.
import { createClient } from "@/lib/supabase/server";
import { BudgetClientPage } from "./budget-client-page"; // Impor komponen klien

// Tipe data untuk konsistensi
type Category = { id: string; name: string; description: string | null };
type Budget = {
    id: string;
    period_start: string;
    period_end: string;
    allocated_amount: number;
    category: { name: string } | null;
};

// Fungsi ini berjalan di server untuk mengambil data
async function getBudgetData(): Promise<{ categories: Category[], budgets: Budget[] }> {
    const supabase = await createClient();

    // 1. Ambil semua kategori anggaran
    const { data: categories, error: catError } = await supabase
        .from('BudgetCategories')
        .select('*')
        .order('name');

    if (catError) {
        console.error("Error fetching categories:", catError.message);
        // Jika terjadi error, kembalikan array kosong agar halaman tidak rusak
        return { categories: [], budgets: [] };
    }

    // 2. Ambil semua rencana anggaran yang sudah dibuat
    const { data: budgets, error: budgetError } = await supabase
        .from('Budgets')
        .select('*, category:BudgetCategories(name)') // Mengambil nama kategori melalui relasi
        .order('period_start', { ascending: false });

    if (budgetError) {
        console.error("Error fetching budgets:", budgetError.message);
        // Kembalikan kategori yang sudah berhasil diambil
        return { categories: categories || [], budgets: [] };
    }

    return { 
        categories: categories || [], 
        budgets: budgets || [] 
    };
}

// Komponen Server yang menjadi default export untuk halaman ini
export default async function BudgetingPage() {
    // 1. Panggil fungsi untuk mengambil data di server
    const { categories, budgets } = await getBudgetData();
    
    // 2. Render komponen klien dan berikan data yang sudah diambil sebagai props.
    // Semua interaksi UI akan ditangani oleh BudgetClientPage.
    return <BudgetClientPage serverCategories={categories} serverBudgets={budgets} />;
}