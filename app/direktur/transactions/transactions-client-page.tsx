// app/direktur/transactions/transactions-client-page.tsx - With skeleton for loading states

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, RefreshCw, Eye, Calendar, User, Tag, DollarSign, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createTransactionAction } from "./actions";
import { AddTransactionModal } from "@/components/transactions/add-transaction-modal";
import { TransactionActions } from "@/components/transactions/transaction-actions";
import { convertToCustomUrl } from "@/lib/utils/upload";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Skeleton untuk refresh loading
function TransactionsRefreshSkeleton() {
  return (
    <div className="space-y-3">
      {/* Desktop skeleton */}
      <div className="hidden lg:block">
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border">
              {[...Array(5)].map((_, i) => (
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

      {/* Mobile skeleton */}
      <div className="grid gap-3 lg:hidden">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-5 w-full mb-3" />
              <Skeleton className="h-6 w-32 mb-3" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Tipe data
type Transaction = {
    id: string;
    transaction_date: string;
    description: string;
    amount: number;
    type: 'Pemasukan' | 'Pengeluaran';
    status: 'Disetujui' | 'Tertunda' | 'Ditolak';
    category: { name: string } | null;
    requester: { full_name: string } | null;
    approver: { full_name: string } | null;
    receipt_url: string | null;
};

type Category = {
    id: string;
    name: string;
    description: string | null;
};

// Fungsi pembantu
const formatDate = (dateString: string) => {
    try {
        return new Date(dateString).toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
    } catch {
        return dateString;
    }
};

const formatRupiah = (value: number) => {
    try {
        return new Intl.NumberFormat('id-ID', { 
            style: 'currency', 
            currency: 'IDR', 
            minimumFractionDigits: 0 
        }).format(value);
    } catch {
        return `Rp ${value.toLocaleString()}`;
    }
};

// Skema warna untuk status
const statusColors: Record<string, string> = {
    Disetujui: "border-green-200 text-green-700 bg-green-50",
    Tertunda: "border-yellow-200 text-yellow-700 bg-yellow-50",
    Ditolak: "border-red-200 text-red-700 bg-red-50",
};

export function TransactionsClientPage({ 
    serverTransactions, 
    serverCategories, 
    userRole 
}: { 
    serverTransactions: Transaction[], 
    serverCategories: Category[],
    userRole: string
}) {
    const [transactions, setTransactions] = useState<Transaction[]>(serverTransactions);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [message, setMessage] = useState("");
    
    // State untuk modal detail transaksi
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const router = useRouter();

    // Cek apakah user bisa edit/approve
    const canEditTransactions = ['direktur', 'keuangan'].includes(userRole.toLowerCase());

    // Update local state when server data changes
    useEffect(() => {
        setTransactions(serverTransactions);
    }, [serverTransactions]);

    const filteredTransactions = transactions.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.requester?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRefresh = async () => {
        setIsRefreshing(true);
        router.refresh();
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const handleCreateTransaction = async (formData: FormData) => {
        setIsLoading(true);
        setMessage("");

        try {
            const result = await createTransactionAction(formData);
            
            if (result.success) {
                router.refresh();
                setMessage("Transaksi berhasil dibuat!");
                setTimeout(() => setMessage(""), 5000);
            } else {
                setMessage(result.message);
            }
        } catch (error: any) {
            setMessage("Terjadi kesalahan: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (transactionId: string, newStatus: 'Disetujui' | 'Ditolak', receiptUrl?: string) => {
        setIsLoading(true);
        setMessage("");

        try {
            const response = await fetch('/api/transactions/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    transactionId, 
                    status: newStatus,
                    receiptUrl 
                }),
            });

            const result = await response.json();

            if (result.success) {
                setMessage(`Transaksi berhasil ${newStatus.toLowerCase()}!`);
                setTimeout(() => setMessage(""), 3000);
                setTimeout(() => router.refresh(), 500);
            } else {
                setMessage(result.error || 'Gagal update status');
            }
        } catch (error: any) {
            setMessage("Terjadi kesalahan: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditTransaction = (transaction: Transaction) => {
        console.log("Edit transaction:", transaction);
        setMessage("Fitur edit akan segera tersedia.");
        setTimeout(() => setMessage(""), 3000);
    };

    // Fungsi untuk membuka modal detail transaksi
    const handleRowClick = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setIsDetailModalOpen(true);
    };

    // Fungsi untuk menutup modal detail transaksi
    const handleCloseDetailModal = () => {
        setSelectedTransaction(null);
        setIsDetailModalOpen(false);
    };

    // Show loading skeleton saat refresh
    if (isRefreshing) {
        return (
            <div className="flex flex-col gap-4 md:gap-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <TransactionsRefreshSkeleton />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 md:gap-6">
            {/* Header Section */}
            <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Semua Transaksi</h1>
                <p className="text-sm md:text-base text-muted-foreground">
                    Daftar semua transaksi pemasukan dan pengeluaran yang tercatat dalam sistem.
                    {transactions.length > 0 && ` (${transactions.length} transaksi)`}
                </p>
            </div>

            {/* Message Alert */}
            {message && (
                <div className={`p-3 rounded-lg text-sm ${
                    message.includes('berhasil') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {message}
                </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari transaksi..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex gap-2">
                    <Button 
                        onClick={() => setIsAddModalOpen(true)}
                        size="sm"
                        className="flex-1 sm:flex-none"
                        disabled={isLoading}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Transaksi
                    </Button>
                </div>
            </div>

            {/* Show skeleton saat loading internal operations */}
            {isLoading && (
                <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
                    <Card className="p-6">
                        <div className="flex items-center gap-3">
                            <RefreshCw className="h-5 w-5 animate-spin" />
                            <span>Memproses transaksi...</span>
                        </div>
                    </Card>
                </div>
            )}

            {/* Desktop Table View */}
            <div className="hidden lg:block">
                <Card>
                    <CardContent className="p-4">
                        <div className="p-1 rounded-md border">
                            <Table className="">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Deskripsi</TableHead>
                                        <TableHead>Pengaju</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead className="text-right">Jumlah</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead>Disetujui Oleh</TableHead>
                                        <TableHead className="text-center">Bukti</TableHead>
                                        {canEditTransactions && <TableHead className="text-center">Aksi</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTransactions.length > 0 ? (
                                        filteredTransactions.map(t => (
                                            <TableRow 
                                                key={t.id} 
                                                onClick={() => handleRowClick(t)}
                                                className="cursor-pointer hover:bg-muted/50"
                                            >
                                                <TableCell className="font-medium">
                                                    {formatDate(t.transaction_date)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-[200px] truncate" title={t.description}>
                                                        {t.description}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{t.requester?.full_name || 'N/A'}</TableCell>
                                                <TableCell>{t.category?.name || 'Lain-lain'}</TableCell>
                                                <TableCell className={`text-right font-semibold ${
                                                    t.type === 'Pemasukan' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                    {t.type === 'Pemasukan' ? '+' : '-'} {formatRupiah(t.amount)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className={statusColors[t.status]}>
                                                        {t.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {t.approver?.full_name ? (
                                                        <div className="text-sm">
                                                            <div className="font-medium">{t.approver.full_name}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div onClick={(e) => e.stopPropagation()}> 
                                                        {t.receipt_url ? (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); 
                                                                    window.open(convertToCustomUrl(t.receipt_url), '_blank');
                                                                }}
                                                                className="h-8 w-8 p-0"
                                                                title="Lihat bukti transaksi"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">-</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                {canEditTransactions && (
                                                    <TableCell className="text-center">
                                                        <div onClick={(e) => e.stopPropagation()}> 
                                                            <TransactionActions
                                                                transaction={t}
                                                                canEdit={canEditTransactions}
                                                                onEdit={handleEditTransaction}
                                                                onUpdateStatus={handleUpdateStatus}
                                                            />
                                                        </div>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={canEditTransactions ? 9 : 8} className="h-24 text-center">
                                                {searchTerm ? 'Tidak ada transaksi yang sesuai dengan pencarian.' : 'Tidak ada transaksi yang ditemukan.'}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Mobile Card View */}
            <div className="grid gap-3 md:gap-4 lg:hidden">
                {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction) => (
                        <Card 
                            key={transaction.id} 
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleRowClick(transaction)}
                        >
                            <CardContent className="p-4">
                                {/* Header dengan tanggal dan status */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>{formatDate(transaction.transaction_date)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={cn("text-xs", statusColors[transaction.status])}>
                                            {transaction.status}
                                        </Badge>
                                        {canEditTransactions && transaction.status === 'Tertunda' && (
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <TransactionActions
                                                    transaction={transaction}
                                                    canEdit={canEditTransactions}
                                                    onEdit={handleEditTransaction}
                                                    onUpdateStatus={handleUpdateStatus}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Deskripsi */}
                                <div className="mb-3">
                                    <h3 className="font-semibold text-base mb-1 line-clamp-2">
                                        {transaction.description}
                                    </h3>
                                </div>

                                {/* Jumlah */}
                                <div className="mb-3">
                                    <div className={cn(
                                        "text-lg font-bold flex items-center gap-2",
                                        transaction.type === 'Pemasukan' ? 'text-green-600' : 'text-red-600'
                                    )}>
                                        <DollarSign className="h-5 w-5" />
                                        {transaction.type === 'Pemasukan' ? '+' : '-'} {formatRupiah(transaction.amount)}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {transaction.type}
                                    </div>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <div className="text-xs text-muted-foreground">Pengaju</div>
                                                <div className="font-medium truncate">
                                                    {transaction.requester?.full_name || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <Tag className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <div className="text-xs text-muted-foreground">Kategori</div>
                                                <div className="font-medium truncate">
                                                    {transaction.category?.name || 'Lain-lain'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {transaction.approver?.full_name && (
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <div className="text-xs text-muted-foreground">Disetujui</div>
                                                    <div className="font-medium truncate">
                                                        {transaction.approver.full_name}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {transaction.receipt_url && (
                                            <div className="flex items-center gap-2">
                                                <div 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(convertToCustomUrl(transaction.receipt_url!), '_blank');
                                                    }}
                                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 cursor-pointer"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    <span className="text-xs font-medium">Lihat Bukti</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <div className="text-muted-foreground">
                                {searchTerm ? 'Tidak ada transaksi yang sesuai dengan pencarian.' : 'Tidak ada transaksi yang ditemukan.'}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Modal Tambah Transaksi */}
            <AddTransactionModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleCreateTransaction}
                categories={serverCategories}
                isLoading={isLoading}
            />

            {/* Modal Detail Transaksi */}
            <Dialog open={isDetailModalOpen} onOpenChange={handleCloseDetailModal}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detail Transaksi</DialogTitle>
                        <DialogDescription>
                            Informasi lengkap mengenai transaksi terpilih.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedTransaction && (
                        <div className="py-4 space-y-4 text-sm">
                            {/* Status Badge */}
                            <div className="flex justify-center">
                                <Badge variant="outline" className={cn("px-3 py-1", statusColors[selectedTransaction.status])}>
                                    {selectedTransaction.status}
                                </Badge>
                            </div>

                            {/* Main Info Cards */}
                            <div className="grid gap-3">
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                                            <span className="font-semibold">Informasi Transaksi</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Deskripsi:</span>
                                                <span className="font-medium text-right max-w-[200px] break-words">
                                                    {selectedTransaction.description}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Jumlah:</span>
                                                <span className={cn(
                                                    "font-bold",
                                                    selectedTransaction.type === 'Pemasukan' ? 'text-green-600' : 'text-red-600'
                                                )}>
                                                    {selectedTransaction.type === 'Pemasukan' ? '+' : '-'} {formatRupiah(selectedTransaction.amount)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Jenis:</span>
                                                <span className="font-medium">{selectedTransaction.type}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Tanggal:</span>
                                                <span className="font-medium">{formatDate(selectedTransaction.transaction_date)}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <User className="h-5 w-5 text-muted-foreground" />
                                            <span className="font-semibold">Informasi Pengguna</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Pengaju:</span>
                                                <span className="font-medium">{selectedTransaction.requester?.full_name || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Kategori:</span>
                                                <span className="font-medium">{selectedTransaction.category?.name || 'Lain-lain'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Disetujui Oleh:</span>
                                                <span className="font-medium">{selectedTransaction.approver?.full_name || '-'}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {selectedTransaction.receipt_url && (
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Eye className="h-5 w-5 text-muted-foreground" />
                                                <span className="font-semibold">Bukti Transaksi</span>
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() => window.open(convertToCustomUrl(selectedTransaction.receipt_url!), '_blank')}
                                                className="w-full"
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Lihat Bukti Transaksi
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={handleCloseDetailModal} className="w-full sm:w-auto">
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}