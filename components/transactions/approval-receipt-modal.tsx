// components/transactions/approval-receipt-modal.tsx

"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, Eye, X } from "lucide-react";
import { uploadReceiptImage, validateImageFile } from "@/lib/utils/upload";
import { createClient } from "@/lib/supabase/client";

interface ApprovalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (receiptUrl?: string) => Promise<void>;
  transactionId: string;
  transactionDescription: string;
}

export function ApprovalReceiptModal({
  isOpen,
  onClose,
  onApprove,
  transactionId,
  transactionDescription
}: ApprovalReceiptModalProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [uploadedImage, setUploadedImage] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isApproving, setIsApproving] = React.useState(false);
  const [message, setMessage] = React.useState("");

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

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(uploadedImage || undefined);
      handleClose();
    } catch (error) {
      // Error handling akan dilakukan di parent component
    } finally {
      setIsApproving(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadedImage(null);
    setMessage("");
    onClose();
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setSelectedFile(null);
    setMessage("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Bukti Transaksi</DialogTitle>
          <DialogDescription>
            Upload bukti transaksi untuk: <strong>{transactionDescription}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('berhasil') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              {message}
            </div>
          )}

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
                    disabled={isUploading || isApproving}
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
                        disabled={isUploading || isApproving}
                      >
                        {isUploading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        <Upload className="mr-2 h-3 w-3" />
                        {isUploading ? 'Uploading...' : 'Upload'}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                    <span className="text-sm text-green-700">✓ Gambar berhasil diupload</span>
                    <div className="ml-auto flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(uploadedImage, '_blank')}
                        disabled={isApproving}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleRemoveImage}
                        disabled={isApproving}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isUploading || isApproving}
          >
            Batal
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isUploading || isApproving}
          >
            {isApproving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isApproving ? 'Menyetujui...' : 'Setujui Transaksi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}