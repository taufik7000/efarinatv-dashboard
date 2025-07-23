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
import { PlusCircle } from "lucide-react";

type Category = { id: string; name: string; description: string | null };
type Budget = {
    id: string;
    period_start: string;
    period_end: string;
    allocated_amount: number;
    category: { name: string } | null;
};

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
const formatRupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

export function BudgetClientPage({ serverCategories, serverBudgets }: { serverCategories: Category[], serverBudgets: Budget[] }) {
    const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
    const [isBudgetModalOpen, setBudgetModalOpen] = useState(false);

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Manajemen Anggaran</h1>
                <p className="text-muted-foreground">
                    Buat kategori dan alokasikan rencana anggaran untuk setiap periode.
                </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                                    await createBudgetAction(formData);
                                    setBudgetModalOpen(false);
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
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="periodStart">Tanggal Mulai</Label>
                                                <Input id="periodStart" name="periodStart" type="date" required />
                                            </div>
                                            <div>
                                                <Label htmlFor="periodEnd">Tanggal Selesai</Label>
                                                <Input id="periodEnd" name="periodEnd" type="date" required />
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
        </div>
    );
}