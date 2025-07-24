// app/direktur/budgeting/budget-client-page.tsx

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { 
  createCategoryAction, 
  createBudgetAction,
  updateCategoryAction,
  updateBudgetAction,
  deleteCategoryAction,
  deleteBudgetAction
} from "./actions";
import { 
  PlusCircle, 
  CalendarIcon, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Wallet,
  Tag,
  Calendar,
  DollarSign,
  Loader2
} from "lucide-react";

// Impor komponen dan utilitas yang diperlukan untuk kalender
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Tipe data yang diterima dari server
type Category = { 
  id: string; 
  name: string; 
  description: string | null 
};

type Budget = {
  id: string;
  period_start: string;
  period_end: string;
  allocated_amount: number;
  category: { name: string } | null;
};

// Fungsi pembantu
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { 
  day: 'numeric', 
  month: 'long', 
  year: 'numeric' 
});

const formatRupiah = (value: number) => new Intl.NumberFormat('id-ID', { 
  style: 'currency', 
  currency: 'IDR', 
  minimumFractionDigits: 0 
}).format(value);

// Komponen Klien yang berisi seluruh UI halaman
export function BudgetClientPage({ 
  serverCategories, 
  serverBudgets 
}: { 
  serverCategories: Category[], 
  serverBudgets: Budget[] 
}) {
  const router = useRouter();
  
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [isBudgetModalOpen, setBudgetModalOpen] = useState(false);
  const [isEditCategoryModalOpen, setEditCategoryModalOpen] = useState(false);
  const [isEditBudgetModalOpen, setEditBudgetModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ 
    isOpen: false, 
    type: '', 
    item: null as any,
    isLoading: false 
  });
  
  // Loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Message state
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // State untuk editing
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  
  // State untuk menyimpan tanggal yang dipilih di kalender
  const [periodStart, setPeriodStart] = useState<Date | undefined>();
  const [periodEnd, setPeriodEnd] = useState<Date | undefined>();

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  // Handlers untuk Category
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setEditCategoryModalOpen(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setDeleteDialog({
      isOpen: true,
      type: 'category',
      item: category,
      isLoading: false
    });
  };

  // Handlers untuk Budget
  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setPeriodStart(new Date(budget.period_start));
    setPeriodEnd(new Date(budget.period_end));
    setEditBudgetModalOpen(true);
  };

  const handleDeleteBudget = (budget: Budget) => {
    setDeleteDialog({
      isOpen: true,
      type: 'budget',
      item: budget,
      isLoading: false
    });
  };

  const confirmDelete = async () => {
    setDeleteDialog(prev => ({ ...prev, isLoading: true }));
    
    try {
      let result;
      if (deleteDialog.type === 'category') {
        result = await deleteCategoryAction(deleteDialog.item.id);
      } else {
        result = await deleteBudgetAction(deleteDialog.item.id);
      }
      
      if (result.success) {
        showMessage(result.message, 'success');
        router.refresh();
      } else {
        showMessage(result.message, 'error');
      }
      
      setDeleteDialog({ isOpen: false, type: '', item: null, isLoading: false });
    } catch (error) {
      console.error('Delete error:', error);
      showMessage('Terjadi kesalahan saat menghapus data', 'error');
      setDeleteDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleCreateCategory = async (formData: FormData) => {
    setIsCreating(true);
    try {
      const result = await createCategoryAction(formData);
      if (result.success) {
        showMessage(result.message, 'success');
        setCategoryModalOpen(false);
        router.refresh();
      } else {
        showMessage(result.message, 'error');
      }
    } catch (error) {
      showMessage('Terjadi kesalahan saat membuat kategori', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateBudget = async (formData: FormData) => {
    if (periodStart) formData.set('periodStart', format(periodStart, 'yyyy-MM-dd'));
    if (periodEnd) formData.set('periodEnd', format(periodEnd, 'yyyy-MM-dd'));
    
    setIsCreating(true);
    try {
      const result = await createBudgetAction(formData);
      if (result.success) {
        showMessage(result.message, 'success');
        setBudgetModalOpen(false);
        setPeriodStart(undefined);
        setPeriodEnd(undefined);
        router.refresh();
      } else {
        showMessage(result.message, 'error');
      }
    } catch (error) {
      showMessage('Terjadi kesalahan saat membuat anggaran', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateCategory = async (formData: FormData) => {
    if (!editingCategory) return;
    
    formData.set('id', editingCategory.id);
    setIsUpdating(true);
    
    try {
      const result = await updateCategoryAction(formData);
      if (result.success) {
        showMessage(result.message, 'success');
        setEditCategoryModalOpen(false);
        setEditingCategory(null);
        router.refresh();
      } else {
        showMessage(result.message, 'error');
      }
    } catch (error) {
      showMessage('Terjadi kesalahan saat mengupdate kategori', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateBudget = async (formData: FormData) => {
    if (!editingBudget) return;
    
    formData.set('id', editingBudget.id);
    if (periodStart) formData.set('periodStart', format(periodStart, 'yyyy-MM-dd'));
    if (periodEnd) formData.set('periodEnd', format(periodEnd, 'yyyy-MM-dd'));
    
    setIsUpdating(true);
    
    try {
      const result = await updateBudgetAction(formData);
      if (result.success) {
        showMessage(result.message, 'success');
        setEditBudgetModalOpen(false);
        setEditingBudget(null);
        setPeriodStart(undefined);
        setPeriodEnd(undefined);
        router.refresh();
      } else {
        showMessage(result.message, 'error');
      }
    } catch (error) {
      showMessage('Terjadi kesalahan saat mengupdate anggaran', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Manajemen Anggaran</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Buat kategori dan alokasikan rencana anggaran untuk setiap periode.
        </p>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kartu untuk mengelola Kategori Anggaran */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">Kategori Anggaran</CardTitle>
                  <CardDescription className="text-sm">Kelola jenis anggaran</CardDescription>
                </div>
              </div>
              <Dialog open={isCategoryModalOpen} onOpenChange={setCategoryModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="shrink-0">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Tambah
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <form action={handleCreateCategory}>
                    <DialogHeader>
                      <DialogTitle>Tambah Kategori Baru</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nama Kategori</Label>
                        <Input id="name" name="name" placeholder="Masukkan nama kategori" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Deskripsi</Label>
                        <Input id="description" name="description" placeholder="Deskripsi kategori (opsional)" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setCategoryModalOpen(false)} disabled={isCreating}>
                        Batal
                      </Button>
                      <Button type="submit" disabled={isCreating}>
                        {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isCreating ? 'Menyimpan...' : 'Simpan Kategori'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {serverCategories.length > 0 ? (
              <div className="space-y-2">
                {serverCategories.map(category => (
                  <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{category.name}</div>
                      {category.description && (
                        <div className="text-sm text-muted-foreground truncate">
                          {category.description}
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteCategory(category)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Belum ada kategori</p>
                <p className="text-xs">Tambah kategori untuk memulai</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kartu untuk mengelola Rencana Anggaran */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">Rencana Anggaran</CardTitle>
                  <CardDescription className="text-sm">Alokasikan dana untuk setiap kategori</CardDescription>
                </div>
              </div>
              <Dialog open={isBudgetModalOpen} onOpenChange={setBudgetModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="shrink-0">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Alokasikan
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <form action={handleCreateBudget}>
                    <DialogHeader>
                      <DialogTitle>Alokasi Anggaran Baru</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="categoryId">Kategori</Label>
                        <select 
                          name="categoryId" 
                          id="categoryId" 
                          required 
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                          <option value="">Pilih Kategori</option>
                          {serverCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="allocatedAmount">Jumlah Alokasi (Rp)</Label>
                        <Input 
                          id="allocatedAmount" 
                          name="allocatedAmount" 
                          type="number" 
                          placeholder="0"
                          required 
                          min="0"
                          step="1000"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tanggal Mulai</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button 
                                variant={"outline"} 
                                className={cn("w-full justify-start text-left font-normal", !periodStart && "text-muted-foreground")}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {periodStart ? format(periodStart, "dd MMM yyyy") : <span>Pilih tanggal</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent 
                                mode="single" 
                                selected={periodStart} 
                                onSelect={setPeriodStart} 
                                initialFocus 
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label>Tanggal Selesai</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button 
                                variant={"outline"} 
                                className={cn("w-full justify-start text-left font-normal", !periodEnd && "text-muted-foreground")}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {periodEnd ? format(periodEnd, "dd MMM yyyy") : <span>Pilih tanggal</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent 
                                mode="single" 
                                selected={periodEnd} 
                                onSelect={setPeriodEnd} 
                                initialFocus 
                                disabled={(date) => periodStart ? date < periodStart : false}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setBudgetModalOpen(false)} disabled={isCreating}>
                        Batal
                      </Button>
                      <Button type="submit" disabled={isCreating}>
                        {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isCreating ? 'Menyimpan...' : 'Simpan Rencana'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {serverBudgets.length > 0 ? (
              <div className="space-y-3">
                {serverBudgets.map(budget => (
                  <div key={budget.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {budget.category?.name || 'Tidak Diketahui'}
                          </Badge>
                        </div>
                        <div className="text-2xl font-bold text-primary">
                          {formatRupiah(budget.allocated_amount)}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditBudget(budget)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteBudget(budget)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(budget.period_start)}</span>
                      </div>
                      <span>—</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(budget.period_end)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-base font-medium mb-1">Belum ada rencana anggaran</p>
                <p className="text-sm">Mulai dengan mengalokasikan anggaran untuk kategori tertentu</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Category Modal */}
      <Dialog open={isEditCategoryModalOpen} onOpenChange={setEditCategoryModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form action={handleUpdateCategory}>
            <DialogHeader>
              <DialogTitle>Edit Kategori</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nama Kategori</Label>
                <Input 
                  id="edit-name" 
                  name="name" 
                  defaultValue={editingCategory?.name}
                  placeholder="Masukkan nama kategori" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Deskripsi</Label>
                <Input 
                  id="edit-description" 
                  name="description" 
                  defaultValue={editingCategory?.description || ''}
                  placeholder="Deskripsi kategori (opsional)" 
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditCategoryModalOpen(false)} disabled={isUpdating}>
                Batal
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Budget Modal */}
      <Dialog open={isEditBudgetModalOpen} onOpenChange={setEditBudgetModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <form action={handleUpdateBudget}>
            <DialogHeader>
              <DialogTitle>Edit Rencana Anggaran</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-categoryId">Kategori</Label>
                <select 
                  name="categoryId" 
                  id="edit-categoryId" 
                  required 
                  defaultValue={editingBudget?.category ? serverCategories.find(c => c.name === editingBudget.category?.name)?.id : ''}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Pilih Kategori</option>
                  {serverCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-allocatedAmount">Jumlah Alokasi (Rp)</Label>
                <Input 
                  id="edit-allocatedAmount" 
                  name="allocatedAmount" 
                  type="number" 
                  defaultValue={editingBudget?.allocated_amount}
                  placeholder="0"
                  required 
                  min="0"
                  step="1000"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal Mulai</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant={"outline"} 
                        className={cn("w-full justify-start text-left font-normal", !periodStart && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {periodStart ? format(periodStart, "dd MMM yyyy") : <span>Pilih tanggal</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent 
                        mode="single" 
                        selected={periodStart} 
                        onSelect={setPeriodStart} 
                        initialFocus 
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Selesai</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant={"outline"} 
                        className={cn("w-full justify-start text-left font-normal", !periodEnd && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {periodEnd ? format(periodEnd, "dd MMM yyyy") : <span>Pilih tanggal</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent 
                        mode="single" 
                        selected={periodEnd} 
                        onSelect={setPeriodEnd} 
                        initialFocus 
                        disabled={(date) => periodStart ? date < periodStart : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditBudgetModalOpen(false)} disabled={isUpdating}>
                Batal
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => !deleteDialog.isLoading && setDeleteDialog(prev => ({ ...prev, isOpen: open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus {deleteDialog.type === 'category' ? 'Kategori' : 'Rencana Anggaran'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.type === 'category' ? (
                <>Apakah Anda yakin ingin menghapus kategori "<strong>{deleteDialog.item?.name}</strong>"? Tindakan ini tidak dapat dibatalkan dan akan mempengaruhi semua anggaran yang terkait.</>
              ) : (
                <>Apakah Anda yakin ingin menghapus rencana anggaran untuk "<strong>{deleteDialog.item?.category?.name}</strong>" sebesar <strong>{deleteDialog.item ? formatRupiah(deleteDialog.item.allocated_amount) : ''}</strong>? Tindakan ini tidak dapat dibatalkan.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDialog.isLoading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteDialog.isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteDialog.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deleteDialog.isLoading ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}