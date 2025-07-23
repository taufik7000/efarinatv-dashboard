// components/transactions/add-transaction-modal.tsx

"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Loader2, Upload, X, Eye } from "lucide-react";
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
  const [uploadedImage, setUploadedImage] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [formKey, setFormKey] = React.useState(0);

  const handleClose = () => {
    setTransactionDate(undefined);
    setUploadedImage(null);
    setSelectedFile(null);
    setMessage("");
    setFormKey(prev => prev + 1);
    onClose();
  };

  const handleSubmit = async (formData: FormData) => {
    if (transactionDate) {
      formData.set('transaction_date', format(transactionDate, 'yyyy-MM-dd'));
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Tambah Transaksi Baru</DialogTitle>
          <DialogDescription>
            Isi detail transaksi baru yang akan dicatat dalam sistem.
          </DialogDescription>
        </DialogHeader>
        
        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.includes('berhasil') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {message}
          </div>
        )}
        
        <form key={formKey} action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transaction_date">Tanggal Transaksi</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !transactionDate && "text-muted-foreground")}
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {transactionDate ? format(transactionDate, "PPP") : <span>Pilih tanggal</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={transactionDate}
                    onSelect={setTransactionDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Jenis Transaksi</Label>
              <select
                name="type"
                id="type"
                required
                disabled={isLoading}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Pilih Jenis</option>
                <option value="Pemasukan">Pemasukan</option>
                <option value="Pengeluaran">Pengeluaran</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Input
              id="description"
              name="description"
              placeholder="Masukkan deskripsi transaksi"
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="category_id">Kategori</Label>
              <select
                name="category_id"
                id="category_id"
                disabled={isLoading}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Pilih Kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receipt_upload">Bukti Transaksi (Gambar)</Label>
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
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleUpload}
                        disabled={isUploading || isLoading}
                      >
                        {isUploading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        <Upload className="mr-2 h-3 w-3" />
                        {isUploading ? 'Uploading...' : 'Upload'}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                  <span className="text-sm text-green-700">✓ Gambar berhasil diupload</span>
                  <div className="ml-auto flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(uploadedImage, '_blank')}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Menyimpan...' : 'Simpan Transaksi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}