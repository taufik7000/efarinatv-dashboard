// app/direktur/budgeting/budget-client-page.tsx

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategoryAction, createBudgetAction } from "./actions";
import { PlusCircle, CalendarIcon } from "lucide-react";

// Impor komponen dan utilitas yang diperlukan untuk kalender
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { BudgetActualsChart } from "./components/budget-actuals-chart"; // Impor komponen chart baru

// Tipe data yang diterima dari server
type Category = { id: string; name: string; description: string | null };
type Budget = {
    id: string;
    period_start: string;
    period_end: string;
    allocated_amount: number;
    category: { name: string } | null;
};

// New type for chart data and config (sesuai dengan yang diteruskan dari page.tsx)
type ChartDataPoint = {
    date: string;
    'Anggaran Dialokasikan': number;
    'Realisasi Pengeluaran': number;
    [key: string]: number | string;
};

type ChartConfig = Record<string, { label: string; color: string }>;


// Fungsi pembantu
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
const formatRupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

// Komponen Klien yang berisi seluruh UI halaman
export function BudgetClientPage({ 
    serverCategories, 
    serverBudgets, 
    chartData, 
    chartConfig 
}: { 
    serverCategories: Category[], 
    serverBudgets: Budget[],
    chartData: ChartDataPoint[], // Terima data chart
    chartConfig: ChartConfig,    // Terima konfigurasi chart
}) {
    const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
    const [isBudgetModalOpen, setBudgetModalOpen] = useState(false);
    
    // State untuk menyimpan tanggal yang dipilih di kalender
    const [periodStart, setPeriodStart] = useState<Date | undefined>();
    const [periodEnd, setPeriodEnd] = useState<Date | undefined>();

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Manajemen Anggaran</h1>
                <p className="text-muted-foreground">
                    Buat kategori dan alokasikan rencana anggaran untuk setiap periode.
                </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Kartu untuk mengelola Kategori Anggaran */}
                <Card className="lg:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Kategori Anggaran</CardTitle>
                            <CardDescription>Kelola jenis anggaran.</CardDescription>
                        </div>
                        <Dialog open={isCategoryModalOpen} onOpenChange={setCategoryModalOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm"><PlusCircle className="h-4 w-4 mr-2" />Tambah</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <form action={async (formData) => {
                                    await createCategoryAction(formData);
                                    setCategoryModalOpen(false);
                                }}>
                                    <DialogHeader><DialogTitle>Tambah Kategori Baru</DialogTitle></DialogHeader>
                                    <div className="py-4 space-y-4">
                                        <div>
                                            <Label htmlFor="name">Nama Kategori</Label>
                                            <Input id="name" name="name" required />
                                        </div>
                                        <div>
                                            <Label htmlFor="description">Deskripsi</Label>
                                            <Input id="description" name="description" />
                                        </div>
                                    </div>
                                    <DialogFooter><Button type="submit">Simpan Kategori</Button></DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Nama</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {serverCategories.map(cat => (
                                    <TableRow key={cat.id}><TableCell>{cat.name}</TableCell></TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Kartu untuk mengelola Rencana Anggaran */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Rencana Anggaran</CardTitle>
                            <CardDescription>Alokasikan dana untuk setiap kategori.</CardDescription>
                        </div>
                        <Dialog open={isBudgetModalOpen} onOpenChange={setBudgetModalOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm"><PlusCircle className="h-4 w-4 mr-2" />Alokasikan</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <form action={async (formData) => {
                                    // Menambahkan tanggal dari state ke form data sebelum dikirim
                                    if(periodStart) formData.set('periodStart', format(periodStart, 'yyyy-MM-dd'));
                                    if(periodEnd) formData.set('periodEnd', format(periodEnd, 'yyyy-MM-dd'));
                                    
                                    await createBudgetAction(formData);
                                    setBudgetModalOpen(false);
                                    setPeriodStart(undefined);
                                    setPeriodEnd(undefined);
                                }}>
                                    <DialogHeader><DialogTitle>Alokasi Anggaran Baru</DialogTitle></DialogHeader>
                                    <div className="py-4 space-y-4">
                                        <div>
                                            <Label htmlFor="categoryId">Kategori</Label>
                                            <select name="categoryId" id="categoryId" required className="w-full p-2 border rounded bg-background">
                                                <option value="">Pilih Kategori</option>
                                                {serverCategories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <Label htmlFor="allocatedAmount">Jumlah Alokasi (Rp)</Label>
                                            <Input id="allocatedAmount" name="allocatedAmount" type="number" required />
                                        </div>
                                        {/* PEMBARUAN: Menggunakan komponen Calendar */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Tanggal Mulai</Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !periodStart && "text-muted-foreground")}>
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {periodStart ? format(periodStart, "PPP") : <span>Pilih tanggal</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar mode="single" selected={periodStart} onSelect={setPeriodStart} initialFocus />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                            <div>
                                                <Label>Tanggal Selesai</Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !periodEnd && "text-muted-foreground")}>
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {periodEnd ? format(periodEnd, "PPP") : <span>Pilih tanggal</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar mode="single" selected={periodEnd} onSelect={setPeriodEnd} initialFocus />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter><Button type="submit">Simpan Rencana</Button></DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kategori</TableHead>
                                    <TableHead>Periode</TableHead>
                                    <TableHead>Alokasi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {serverBudgets.map(budget => (
                                    <TableRow key={budget.id}>
                                        <TableCell>{budget.category?.name || 'Tidak Diketahui'}</TableCell>
                                        <TableCell>{formatDate(budget.period_start)} - {formatDate(budget.period_end)}</TableCell>
                                        <TableCell>{formatRupiah(budget.allocated_amount)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            {/* Kartu untuk Visualisasi Anggaran vs Realisasi */}
            <Card>
                <CardHeader>
                    <CardTitle>Realisasi Anggaran per Bulan</CardTitle>
                    <CardDescription>Perbandingan anggaran yang dialokasikan dengan pengeluaran aktual setiap bulan.</CardDescription>
                </CardHeader>
                <CardContent>
                    {chartData.length > 0 ? (
                        <BudgetActualsChart chartData={chartData} chartConfig={chartConfig} />
                    ) : (
                        <div className="text-center text-muted-foreground py-10">
                            Tidak ada data untuk grafik anggaran vs realisasi.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}