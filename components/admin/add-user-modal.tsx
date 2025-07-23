// app/components/admin/add-user-modal.tsx (Komponen Baru)

"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, AlertCircle } from "lucide-react";

const roles = [
  { value: "admin", label: "Admin" },
  { value: "direktur", label: "Direktur" },
  { value: "keuangan", label: "Keuangan" },
  { value: "redaksi", label: "Redaksi" },
  { value: "hrd", label: "HRD" },
  { value: "marketing", label: "Marketing" },
  { value: "team", label: "Team" },
];

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

export function AddUserModal({ isOpen, onClose, onUserAdded }: AddUserModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const formData = new FormData(e.currentTarget);
    
    try {
      const fullName = formData.get("fullName") as string;
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const role = formData.get("role") as string;

      if (!fullName || !email || !password || !role) {
        setMessage("Semua kolom wajib diisi");
        setMessageType("error");
        setIsLoading(false);
        return;
      }

      if (password.length < 6) {
        setMessage("Password minimal harus 6 karakter");
        setMessageType("error");
        setIsLoading(false);
        return;
      }

      const result = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, role }),
      });

      const data = await result.json();

      if (!result.ok) {
        setMessage(data.error || 'Gagal membuat pengguna');
        setMessageType("error");
        setIsLoading(false);
        return;
      }
      
      formRef.current?.reset();
      onUserAdded(); // Callback untuk me-refresh dan menutup modal
      
    } catch (error: any) {
      setMessage("Terjadi error tak terduga: " + error.message);
      setMessageType("error");
      setIsLoading(false);
    }
  }

  // Fungsi untuk mereset state saat modal ditutup
  const handleClose = () => {
      if (!isLoading) {
        setMessage("");
        setMessageType("error");
        onClose();
      }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Pengguna Baru</DialogTitle>
          <DialogDescription>
            Isi detail di bawah ini untuk membuat akun baru.
          </DialogDescription>
        </DialogHeader>
        
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 pt-4">
          {message && (
            <div className={`p-3 rounded flex items-center gap-2 text-sm ${
              messageType === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {messageType === 'error' ? <AlertCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              {message}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="fullName">Nama Lengkap</Label>
            <Input id="fullName" name="fullName" placeholder="Masukkan nama lengkap" required disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Alamat Email</Label>
            <Input id="email" name="email" type="email" placeholder="pengguna@efarinatv.com" required disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="Min. 6 karakter" required minLength={6} disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Peran</Label>
            <select
              name="role"
              required
              disabled={isLoading}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Pilih peran</option>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>Batal</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Menyimpan...' : 'Simpan Pengguna'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
