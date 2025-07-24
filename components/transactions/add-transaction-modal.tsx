// components/transactions/add-transaction-modal.tsx

"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Loader2, Upload, X, Eye, TrendingUp, TrendingDown, Tag } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { uploadReceiptImage, validateImageFile } from "@/lib/utils/upload";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: string;
  name: string;
  description: string | null;
};

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  categories: Category[];
  isLoading: boolean;
}

export function AddTransactionModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  isLoading
}: AddTransactionModalProps) {
  const [transactionDate, setTransactionDate] = React.useState<Date>();
  const [transactionType, setTransactionType] = React.useState<string>("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("");
  const [uploadedImage, setUploadedImage] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [formKey, setFormKey] = React.useState(0);

  const handleClose = () => {
    setTransactionDate(undefined);
    setTransactionType("");
    setSelectedCategory("");
    setUploadedImage(null);
    setSelectedFile(null);
    setMessage("");
    setFormKey(prev => prev + 1);
    onClose();
  };

  const handleSubmit = async (formData: FormData) => {
    // Validasi form
    if (!transactionDate) {
      setMessage("Tanggal transaksi wajib diisi");
      return;
    }
    
    if (!transactionType) {
      setMessage("Jenis transaksi wajib dipilih");
      return;
    }

    if (transactionDate) {
      formData.set('transaction_date', format(transactionDate, 'yyyy-MM-dd'));
    }
    
    if (transactionType) {
      formData.set('type', transactionType);
    }
    
    if (selectedCategory) {
      formData.set('category_id', selectedCategory);
    }
    
    if (uploadedImage) {
      formData.set('receipt_url', uploadedImage);
    }
    
    await onSubmit(formData);
    handleClose();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setMessage(validation.error || "File tidak valid");
      return;
    }

    setSelectedFile(file);
    setMessage("");
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setMessage("User tidak ditemukan");
        return;
      }

      const result = await uploadReceiptImage(selectedFile, user.id);
      
      if (result.success && result.url) {
        setUploadedImage(result.url);
        setMessage("Gambar berhasil diupload!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(result.error || "Gagal upload gambar");
      }
    } catch (error: any) {
      setMessage("Terjadi kesalahan saat upload: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setSelectedFile(null);
    setMessage("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Transaksi Baru</DialogTitle>
          <DialogDescription>
            Isi detail transaksi baru yang akan dicatat dalam sistem.
          </DialogDescription>
        </DialogHeader>
        
        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.includes('berhasil') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}
        
        <form key={formKey} action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tanggal Transaksi */}
            <div className="space-y-2">
              <Label htmlFor="transaction_date">Tanggal Transaksi</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !transactionDate && "text-muted-foreground"
                    )}
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {transactionDate ? format(transactionDate, "dd MMMM yyyy") : <span>Pilih tanggal</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={transactionDate}
                    onSelect={setTransactionDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Jenis Transaksi dengan Shadcn Select */}
            <div className="space-y-2">
              <Label htmlFor="type">Jenis Transaksi</Label>
              <Select 
                value={transactionType} 
                onValueChange={setTransactionType}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih jenis transaksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pemasukan">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span>Pemasukan</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Pengeluaran">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span>Pengeluaran</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Deskripsi */}
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi Transaksi</Label>
            <Input
              id="description"
              name="description"
              placeholder="Masukkan deskripsi transaksi"
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Jumlah */}
            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah (Rp)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder="0"
                required
                min="0"
                step="1000"
                disabled={isLoading}
              />
            </div>

            {/* Kategori dengan Shadcn Select */}
            <div className="space-y-2">
              <Label htmlFor="category_id">Kategori</Label>
              <Select 
                value={selectedCategory} 
                onValueChange={setSelectedCategory}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih kategori (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span>{category.name}</span>
                          {category.description && (
                            <span className="text-xs text-muted-foreground">
                              {category.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Upload Bukti Transaksi */}
          <div className="space-y-2">
            <Label htmlFor="receipt_upload">Bukti Transaksi (Opsional)</Label>
            <div className="space-y-3">
              {!uploadedImage ? (
                <>
                  <Input
                    id="receipt_upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={isLoading || isUploading}
                    className="cursor-pointer"
                  />
                  {selectedFile && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{selectedFile.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleUpload}
                        disabled={isUploading || isLoading}
                      >
                        {isUploading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        <Upload className="mr-2 h-3 w-3" />
                        {isUploading ? 'Upload...' : 'Upload'}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm text-green-700 font-medium">
                      ✓ Gambar berhasil diupload
                    </div>
                    <div className="text-xs text-green-600">
                      Siap untuk disimpan bersama transaksi
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(uploadedImage, '_blank')}
                      disabled={isLoading}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleRemoveImage}
                      disabled={isLoading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !transactionDate || !transactionType}
              className="w-full sm:w-auto"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Menyimpan...' : 'Simpan Transaksi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}