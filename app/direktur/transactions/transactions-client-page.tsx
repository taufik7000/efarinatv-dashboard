// app/direktur/transactions/transactions-client-page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

// Tipe data yang diterima dari server
type Transaction = {
    id: string;
    transaction_date: string;
    description: string;
    amount: number;
    type: 'Pemasukan' | 'Pengeluaran';
    status: 'Disetujui' | 'Tertunda' | 'Ditolak';
    category: { name: string } | null;
    requester: { full_name: string } | null;
};

// Fungsi pembantu
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const formatRupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

// Skema warna untuk status
const statusColors: Record<string, string> = {
  Disetujui: "border-green-200 text-green-700 bg-green-50",
  Tertunda: "border-yellow-200 text-yellow-700 bg-yellow-50",
  Ditolak: "border-red-200 text-red-700 bg-red-50",
};

export function TransactionsClientPage({ serverTransactions }: { serverTransactions: Transaction[] }) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredTransactions = serverTransactions.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.requester?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Semua Transaksi</CardTitle>
                    <CardDescription>Daftar semua transaksi pemasukan dan pengeluaran yang tercatat dalam sistem.</CardDescription>
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
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransactions.length > 0 ? (
                                    filteredTransactions.map(t => (
                                        <TableRow key={t.id}>
                                            <TableCell className="font-medium">{formatDate(t.transaction_date)}</TableCell>
                                            <TableCell>{t.description}</TableCell>
                                            <TableCell>{t.requester?.full_name || 'N/A'}</TableCell>
                                            <TableCell>{t.category?.name || 'Lain-lain'}</TableCell>
                                            <TableCell className={`text-right font-semibold ${t.type === 'Pemasukan' ? 'text-green-600' : 'text-red-600'}`}>
                                                {t.type === 'Pemasukan' ? '+' : '-'} {formatRupiah(t.amount)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className={statusColors[t.status]}>{t.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            Tidak ada transaksi yang ditemukan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
