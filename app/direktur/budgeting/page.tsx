// app/direktur/budgeting/page.tsx
import { createClient } from "@/lib/supabase/server";
import { BudgetClientPage } from "./budget-client-page";

// Tipe data untuk konsistensi
type Category = { id: string; name: string; description: string | null };
type Budget = {
  id: string;
  period_start: string;
  period_end: string;
  allocated_amount: number;
  category: { name: string } | null;
};

// Fungsi untuk mengambil data dari server
async function getBudgetData(): Promise<{ categories: Category[]; budgets: Budget[] }> {
  const supabase = await createClient();

  try {
    // Ambil semua kategori anggaran
    const { data: categories, error: catError } = await supabase
      .from('BudgetCategories')
      .select('*')
      .order('name');

    if (catError) throw new Error(`Error fetching categories: ${catError.message}`);

    // Ambil semua rencana anggaran
    const { data: budgets, error: budgetError } = await supabase
      .from('Budgets')
      .select('*, category:BudgetCategories(name)')
      .order('period_start', { ascending: false });

    if (budgetError) throw new Error(`Error fetching budgets: ${budgetError.message}`);

    return {
      categories: categories ?? [],
      budgets: budgets ?? [],
    };
  } catch (error) {
    console.error(error);
    return { categories: [], budgets: [] };
  }
}

// Komponen Server
export default async function BudgetingPage() {
  const { categories, budgets } = await getBudgetData();

  // Fallback UI jika tidak ada data
  if (!categories.length && !budgets.length) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center text-red-500">
          Gagal memuat data. Silakan coba lagi nanti.
        </div>
      </div>
    );
  }

  return <BudgetClientPage serverCategories={categories} serverBudgets={budgets} />;
}