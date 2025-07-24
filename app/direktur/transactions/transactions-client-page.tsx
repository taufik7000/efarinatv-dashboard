// app/direktur/transactions/transactions-client-page.tsx - Clean version with separated components

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, RefreshCw, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createTransactionAction } from "./actions";
import { AddTransactionModal } from "@/components/transactions/add-transaction-modal";
import { TransactionActions } from "@/components/transactions/transaction-actions";
import { convertToCustomUrl } from "@/lib/utils/upload";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // Diimpor untuk modal detail

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
    
    // State baru untuk modal detail transaksi
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
                setMessage("Transaksi berhasil dibuat! Klik refresh untuk melihat data terbaru.");
                setTimeout(() => setMessage(""), 5000);
                router.refresh(); // Menghapus timeout agar lebih responsif
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
        // TODO: Implement edit modal (jika ada)
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

    return (
        <div className="flex flex-col gap-6">
            {message && (
                <div className={`p-3 rounded-lg text-sm ${
                    message.includes('berhasil') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                    {message}
                </div>
            )}

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle>Semua Transaksi</CardTitle>
                            <CardDescription>
                                Daftar semua transaksi pemasukan dan pengeluaran yang tercatat dalam sistem.
                                {transactions.length > 0 && ` (${transactions.length} transaksi)`}
                            </CardDescription>
                        </div>
                        
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                            >
                                <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                                Refresh
                            </Button>
                            
                            <Button onClick={() => setIsAddModalOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah Transaksi
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent>
                    <div className="relative mb-4">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari berdasarkan deskripsi, pengaju, atau kategori..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="rounded-md border">
                        <Table>
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
                                            onClick={() => handleRowClick(t)} // Event onClick untuk membuka modal detail
                                            className="cursor-pointer hover:bg-muted/50" // Gaya kursor agar terlihat interaktif
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
                                                {/* Tambahkan wrapper div dengan e.stopPropagation() di sini */}
                                                <div onClick={(e) => e.stopPropagation()}> 
                                                    {t.receipt_url ? (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={(e) => { // Mencegah bubbling event ke TableRow
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
                                                    {/* Tambahkan wrapper div dengan e.stopPropagation() di sini */}
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
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Detail Transaksi</DialogTitle>
                        <DialogDescription>
                            Informasi lengkap mengenai transaksi terpilih.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedTransaction && (
                        <div className="py-4 space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-2">
                                <span className="font-semibold text-muted-foreground">Tanggal Transaksi:</span>
                                <span>{formatDate(selectedTransaction.transaction_date)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <span className="font-semibold text-muted-foreground">Deskripsi:</span>
                                <span>{selectedTransaction.description}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <span className="font-semibold text-muted-foreground">Jumlah:</span>
                                <span className={selectedTransaction.type === 'Pemasukan' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                    {selectedTransaction.type === 'Pemasukan' ? '+' : '-'} {formatRupiah(selectedTransaction.amount)}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <span className="font-semibold text-muted-foreground">Jenis:</span>
                                <span>{selectedTransaction.type}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <span className="font-semibold text-muted-foreground">Kategori:</span>
                                <span>{selectedTransaction.category?.name || 'Lain-lain'}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <span className="font-semibold text-muted-foreground">Pengaju:</span>
                                <span>{selectedTransaction.requester?.full_name || 'N/A'}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <span className="font-semibold text-muted-foreground">Status:</span>
                                <Badge variant="outline" className={statusColors[selectedTransaction.status]}>
                                    {selectedTransaction.status}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <span className="font-semibold text-muted-foreground">Disetujui Oleh:</span>
                                <span>{selectedTransaction.approver?.full_name || '-'}</span>
                            </div>
                            {selectedTransaction.receipt_url && (
                                <div className="grid grid-cols-2 gap-2 items-center">
                                    <span className="font-semibold text-muted-foreground">Bukti Transaksi:</span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => window.open(convertToCustomUrl(selectedTransaction.receipt_url!), '_blank')}
                                        className="w-fit"
                                    >
                                        <Eye className="h-4 w-4 mr-2" /> Lihat Bukti
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={handleCloseDetailModal}>Tutup</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}