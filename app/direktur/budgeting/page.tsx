// app/direktur/budgeting/page.tsx - Optimized version

import { createClient } from "@/lib/supabase/server";
import { BudgetClientPage } from "./budget-client-page";
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Loading component untuk Suspense
function BudgetPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Optimized data fetching function
async function getBudgetData() {
  const supabase = await createClient();

  try {
    // Parallel queries untuk mengurangi waktu loading
    const [categoriesResult, budgetsResult] = await Promise.all([
      // Query categories dengan limit jika diperlukan
      supabase
        .from('BudgetCategories')
        .select('id, name, description')
        .order('name', { ascending: true })
        .limit(100), // Tambah limit untuk performance

      // Query budgets dengan join yang lebih efisien
      supabase
        .from('Budgets')
        .select(`
          id,
          period_start,
          period_end,
          allocated_amount,
          category:BudgetCategories!inner(name)
        `)
        .order('period_start', { ascending: false })
        .limit(50) // Tambah limit untuk performance
    ]);

    // Error handling
    if (categoriesResult.error) {
      console.error("Error fetching categories:", categoriesResult.error);
      throw new Error(`Categories fetch failed: ${categoriesResult.error.message}`);
    }

    if (budgetsResult.error) {
      console.error("Error fetching budgets:", budgetsResult.error);
      throw new Error(`Budgets fetch failed: ${budgetsResult.error.message}`);
    }

    return {
      categories: categoriesResult.data || [],
      budgets: budgetsResult.data || [],
    };

  } catch (error: any) {
    console.error("Error in getBudgetData:", error);
    
    // Return empty data instead of throwing to prevent page crash
    return {
      categories: [],
      budgets: [],
      error: error.message
    };
  }
}

// Optimized server component
async function BudgetPageContent() {
  const { categories, budgets, error } = await getBudgetData();

  // Error boundary
  if (error) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">
            Gagal Memuat Data
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Terjadi kesalahan saat mengambil data anggaran.
          </p>
          <p className="text-xs text-red-500 bg-red-50 p-2 rounded">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <BudgetClientPage 
      serverCategories={categories} 
      serverBudgets={budgets}
    />
  );
}

// Main page component dengan Suspense
export default function BudgetingPage() {
  return (
    <Suspense fallback={<BudgetPageSkeleton />}>
      <BudgetPageContent />
    </Suspense>
  );
}