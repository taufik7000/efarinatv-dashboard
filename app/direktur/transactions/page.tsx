// app/direktur/transactions/page.tsx - With skeleton loading

import { createClient } from "@/lib/supabase/server";
import { TransactionsClientPage } from "./transactions-client-page";
import { Suspense } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Skeleton component untuk loading state
function TransactionsPageSkeleton() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 md:w-80" />
        <Skeleton className="h-4 w-96 md:w-[500px]" />
      </div>

      {/* Action Bar Skeleton */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 flex-1 sm:flex-none" />
          <Skeleton className="h-9 w-24 flex-1 sm:flex-none" />
        </div>
      </div>

      {/* Desktop Table Skeleton */}
      <div className="hidden lg:block">
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border">
              {/* Table Header */}
              <div className="border-b p-4">
                <div className="grid grid-cols-9 gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
              
              {/* Table Rows */}
              {[...Array(8)].map((_, i) => (
                <div key={i} className="border-b p-4 last:border-b-0">
                  <div className="grid grid-cols-9 gap-4 items-center">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Card Skeleton */}
      <div className="grid gap-3 md:gap-4 lg:hidden">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>

              {/* Description */}
              <div className="mb-3">
                <Skeleton className="h-5 w-full mb-1" />
                <Skeleton className="h-5 w-3/4" />
              </div>

              {/* Amount */}
              <div className="mb-3">
                <Skeleton className="h-6 w-32 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Optimized data fetching
async function getTransactionsData() {
  let transactions = [];
  let categories = [];
  let userRole = 'team';

  try {
    const supabase = await createClient();

    // 1. Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Authentication Error:", userError?.message || "User not found.");
      return { transactions: [], categories: [], userRole: 'team', error: 'Authentication failed' };
    }

    // 2. Parallel queries for better performance
    const [profileResult, transactionResult, categoryResult] = await Promise.all([
      // Get user profile
      supabase
        .from('Profile')
        .select('role')
        .eq('id', user.id)
        .single(),

      // Get transactions with relations
      supabase
        .from('Transactions')
        .select(`
          id,
          transaction_date,
          description,
          amount,
          type,
          status,
          receipt_url,
          category:BudgetCategories(name),
          requester:Profile!Transactions_requester_id_fkey(full_name),
          approver:Profile!Transactions_approver_id_fkey(full_name)
        `)
        .order('transaction_date', { ascending: false })
        .limit(100), // Add limit for performance

      // Get categories
      supabase
        .from('BudgetCategories')
        .select('id, name, description')
        .order('name')
        .limit(50) // Add limit for performance
    ]);

    // Handle profile
    if (profileResult.error && profileResult.error.code !== 'PGRST116') {
      console.error("Error fetching user profile:", profileResult.error.message);
    }
    userRole = profileResult.data?.role || 'team';

    // Handle transactions
    if (transactionResult.error) {
      console.error("Error fetching transactions:", transactionResult.error.message);
    } else {
      transactions = transactionResult.data || [];
    }

    // Handle categories
    if (categoryResult.error) {
      console.error("Error fetching categories:", categoryResult.error.message);
    } else {
      categories = categoryResult.data || [];
    }

    return { transactions, categories, userRole };

  } catch (error: any) {
    console.error("Unexpected error in getTransactionsData:", error.message);
    return { transactions: [], categories: [], userRole: 'team', error: error.message };
  }
}

// Server component with data
async function TransactionsPageContent() {
  const { transactions, categories, userRole, error } = await getTransactionsData();

  if (error) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">
            Gagal Memuat Data
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Terjadi kesalahan saat mengambil data transaksi.
          </p>
          <p className="text-xs text-red-500 bg-red-50 p-2 rounded max-w-md">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <TransactionsClientPage
      serverTransactions={transactions}
      serverCategories={categories}
      userRole={userRole}
    />
  );
}

// Main page component with Suspense
export default function TransactionsPage() {
  return (
    <Suspense fallback={<TransactionsPageSkeleton />}>
      <TransactionsPageContent />
    </Suspense>
  );
}