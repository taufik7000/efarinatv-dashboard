

import { createClient } from "@/lib/supabase/server";
import { TransactionsClientPage } from "./transactions-client-page";

export default async function TransactionsPage() {
    // Inisialisasi variabel dengan nilai default
    let transactions = [];
    let categories = [];
    let userRole = 'team'; // Default role

    try {
        const supabase = await createClient();

        // 1. Dapatkan pengguna yang sedang login
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            // Jika tidak ada user, tampilkan pesan error atau redirect
            // console.error("Authentication Error:", userError?.message || "User not found.");
            return <div>Error: Gagal memuat data pengguna. Silakan coba login kembali.</div>;
        }

        // 2. Dapatkan profil dan peran (role) pengguna
        const { data: profile, error: profileError } = await supabase
            .from('Profile')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error("Error fetching user profile:", profileError.message);
            // Tetap lanjutkan dengan role default jika profil tidak ditemukan,
            // atau tampilkan error jika role sangat krusial.
        }
        userRole = profile?.role || 'team';

        // 3. Dapatkan data transaksi dengan join ke tabel lain
        const { data: transactionData, error: transactionError } = await supabase
            .from('Transactions')
            .select(`
                id,
                transaction_date,
                description,
                amount,
                type,
                status,
                receipt_url,
                approved_at,
                category:BudgetCategories(name),
                requester:Profile!Transactions_requester_id_fkey(full_name),
                approver:Profile!Transactions_approver_id_fkey(full_name)
            `)
            .order('transaction_date', { ascending: false });

        if (transactionError) {
            console.error("Error fetching transactions:", transactionError.message);
            // Anda bisa menambahkan logika fallback di sini jika diperlukan
        } else {
            transactions = transactionData || [];
        }

        // 4. Dapatkan data kategori
        const { data: categoryData, error: categoryError } = await supabase
            .from('BudgetCategories')
            .select('id, name, description')
            .order('name');

        if (categoryError) {
            console.error("Error fetching categories:", categoryError.message);
        } else {
            categories = categoryData || [];
        }

    } catch (error: any) {
        console.error("An unexpected error occurred in TransactionsPage:", error.message);
        // Tampilkan halaman error umum jika terjadi kesalahan tak terduga
        return <div>Terjadi kesalahan pada server.</div>;
    }

    // 5. Render komponen client dengan data dari server
    return (
        <TransactionsClientPage
            serverTransactions={transactions}
            serverCategories={categories}
            userRole={userRole}
        />
    );
}