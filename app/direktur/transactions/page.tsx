// app/direktur/transactions/page.tsx

import { createClient } from "@/lib/supabase/server";
import { TransactionsClientPage } from "./transactions-client-page";

// Fungsi untuk mengambil data transaksi dari server
async function getTransactions() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('Transactions')
        .select(`
            *,
            category:BudgetCategories(name),
            requester:Profile(full_name)
        `)
        .order('transaction_date', { ascending: false });

    if (error) {
        console.error("Error fetching transactions:", error);
        return [];
    }
    return data;
}

// Komponen Server yang mengambil data dan me-render Komponen Klien
export default async function TransactionsPage() {
    const transactions = await getTransactions();
    return <TransactionsClientPage serverTransactions={transactions} />;
}
