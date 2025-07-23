// app/components/admin/delete-user-modal.tsx (Diperbaiki)

"use client";

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
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  userName: string;
  userRole: string;
  isLoading?: boolean;
}

export function DeleteUserModal({
  isOpen,
  onClose,
  onConfirm,
  userName,
  userRole,
  isLoading = false,
}: DeleteUserModalProps) {

  // Menggunakan 'open' dan 'onOpenChange' dari AlertDialog
  // untuk mengontrol state dari komponen induk.
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apakah Anda Yakin Ingin Menghapus Pengguna Ini?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus pengguna secara permanen
            dari otentikasi dan database profil.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {/* Detail pengguna yang akan dihapus */}
        <div className="my-4 p-4 bg-muted border border-border rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-muted-foreground">Nama:</span>
              <span className="font-semibold">{userName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-muted-foreground">Peran:</span>
              <span className="font-semibold capitalize">{userRole}</span>
            </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isLoading}>
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault(); // Mencegah dialog tertutup otomatis oleh Radix
              onConfirm();
            }}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Menghapus...' : 'Lanjutkan'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
