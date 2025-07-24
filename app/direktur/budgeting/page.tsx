// app/direktur/budgeting/page.tsx
import { createClient } from "@/lib/supabase/server";
import { BudgetClientPage } from "./budget-client-page";
import { format, eachMonthOfInterval, startOfMonth, endOfMonth, parseISO } from 'date-fns'; // Import date-fns utilities

// Tipe data untuk konsistensi
type Category = { id: string; name: string; description: string | null };
type Budget = {
  id: string;
  category_id: string;
  period_start: string;
  period_end: string;
  allocated_amount: number;
  category: { name: string } | null;
};

// New type for Transaction, adding category_id for linking
type Transaction = {
  id: string;
  transaction_date: string;
  amount: number;
  type: 'Pemasukan' | 'Pengeluaran';
  category_id: string | null;
};

// New type for chart data
type ChartDataPoint = {
  date: string; // "YYYY-MM"
  'Anggaran Dialokasikan': number; // Total allocated budget for the month
  'Realisasi Pengeluaran': number; // Total actual expenses for the month
};

// Fungsi untuk mengambil dan memproses data dari server
async function getBudgetData(): Promise<{ 
    categories: Category[]; 
    budgets: Budget[]; 
    chartData: ChartDataPoint[]; 
    chartConfig: Record<string, { label: string; color: string }>; 
}> {
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

    // Ambil semua transaksi yang relevan untuk perhitungan realisasi (hanya Pengeluaran yang Disetujui/Tertunda)
    const { data: transactions, error: transactionError } = await supabase
      .from('Transactions')
      .select('id, transaction_date, amount, type, category_id')
      .in('status', ['Disetujui', 'Tertunda']); // Hanya hitung transaksi yang sudah disetujui atau tertunda

    if (transactionError) throw new Error(`Error fetching transactions: ${transactionError.message}`);

    // --- Data Processing for Chart ---
    const monthlyTotalActualsMap: Map<string, number> = new Map();
    const monthlyTotalAllocatedMap: Map<string, number> = new Map();

    // Process Budgets for allocated amounts (distributed monthly)
    budgets.forEach(budget => {
      const start = parseISO(budget.period_start);
      const end = parseISO(budget.period_end);
      const monthsInPeriod = eachMonthOfInterval({ start, end });

      if (monthsInPeriod.length === 0) return;

      // Distribute allocated amount evenly across months in the period
      const monthlyAllocatedAmount = budget.allocated_amount / monthsInPeriod.length;

      monthsInPeriod.forEach(month => {
        const monthKey = format(month, 'yyyy-MM');
        monthlyTotalAllocatedMap.set(monthKey, (monthlyTotalAllocatedMap.get(monthKey) || 0) + monthlyAllocatedAmount);
      });
    });

    // Process Transactions for actual spending (only 'Pengeluaran')
    transactions.forEach(transaction => {
        if (transaction.type === 'Pengeluaran') {
            const transactionDate = parseISO(transaction.transaction_date);
            const monthKey = format(transactionDate, 'yyyy-MM');
            monthlyTotalActualsMap.set(monthKey, (monthlyTotalActualsMap.get(monthKey) || 0) + transaction.amount);
        }
    });

    // Combine all unique month keys from both maps
    const allMonthKeys = new Set<string>();
    monthlyTotalActualsMap.forEach((_val, key) => allMonthKeys.add(key));
    monthlyTotalAllocatedMap.forEach((_val, key) => allMonthKeys.add(key));

    const sortedMonthKeys = Array.from(allMonthKeys).sort();

    // Build the final chart data array
    const chartData: ChartDataPoint[] = [];
    sortedMonthKeys.forEach(monthKey => {
      chartData.push({
        date: monthKey,
        'Anggaran Dialokasikan': monthlyTotalAllocatedMap.get(monthKey) || 0,
        'Realisasi Pengeluaran': monthlyTotalActualsMap.get(monthKey) || 0,
      });
    });

    // Define chart configuration for shadcn/ui chart component
    const chartConfig = {
      'Anggaran Dialokasikan': {
        label: 'Anggaran Dialokasikan',
        color: 'hsl(var(--chart-1))', // Menggunakan variabel CSS untuk warna tema
      },
      'Realisasi Pengeluaran': {
        label: 'Realisasi Pengeluaran',
        color: 'hsl(var(--chart-2))',
      },
    };

    return {
      categories: categories ?? [],
      budgets: budgets ?? [],
      chartData: chartData,
      chartConfig: chartConfig,
    };
  } catch (error) {
    console.error("Error fetching budget data for chart:", error);
    return { categories: [], budgets: [], chartData: [], chartConfig: {} };
  }
}

// Komponen Server Utama untuk halaman Budgeting
export default async function BudgetingPage() {
  const { categories, budgets, chartData, chartConfig } = await getBudgetData();

  // Fallback UI jika tidak ada data
  if (!categories.length && !budgets.length && !chartData.length) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center text-red-500">
          Gagal memuat data atau tidak ada data untuk ditampilkan. Silakan coba lagi nanti.
        </div>
      </div>
    );
  }

  return (
    <BudgetClientPage 
      serverCategories={categories} 
      serverBudgets={budgets} 
      chartData={chartData} // Teruskan data chart
      chartConfig={chartConfig} // Teruskan konfigurasi chart
    />
  );
}