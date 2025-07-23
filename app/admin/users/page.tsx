// app/admin/users/page.tsx - Halaman manajemen pengguna dengan layout responsif

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, UserPlus, Search, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { DeleteUserModal } from "@/components/admin/delete-user-modal";
import { AddUserModal } from "@/components/admin/add-user-modal";

// Skema warna untuk setiap peran pengguna
const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  direktur: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  keuangan: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  redaksi: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  hrd: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  marketing: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  team: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

export default function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, user: null as any, isLoading: false });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("Profile")
        .select(`id, full_name, role`)
        .order('full_name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      setMessage('Gagal memuat data pengguna: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  const refreshUsers = () => {
    setMessage("");
    fetchUsers();
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyUserId = (userId: string) => {
    navigator.clipboard.writeText(userId);
    setMessage("User ID berhasil disalin.");
    setTimeout(() => setMessage(""), 3000);
  };
  
  const handleDeleteUser = (user: any) => {
    setDeleteModal({ isOpen: true, user, isLoading: false });
  };

  const closeDeleteModal = () => {
    if (!deleteModal.isLoading) {
      setDeleteModal({ isOpen: false, user: null, isLoading: false });
    }
  };

  const confirmDeleteUser = async () => {
    if (!deleteModal.user) return;
    setDeleteModal(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: deleteModal.user.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage(`Pengguna ${deleteModal.user.full_name} berhasil dihapus.`);
      setUsers(prev => prev.filter(u => u.id !== deleteModal.user.id));
      closeDeleteModal();
    } catch (error: any) {
      setMessage(`Gagal menghapus pengguna: ${error.message}`);
    } finally {
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
      setTimeout(() => setMessage(""), 5000);
    }
  };
  
  const handleUserAdded = () => {
    setIsAddModalOpen(false);
    fetchUsers();
    setMessage("Pengguna baru berhasil ditambahkan.");
    setTimeout(() => setMessage(""), 5000);
  };

  if (loading) {
    return <div>Memuat data pengguna...</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.includes('Gagal') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
        }`}>
          {message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Pengguna</h1>
          <p className="text-muted-foreground">Kelola semua pengguna dan peran mereka.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshUsers}>Muat Ulang</Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Tambah Pengguna
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan nama atau peran..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tampilan Tabel untuk Desktop (md dan lebih besar) */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pengguna</TableHead>
                  <TableHead className="text-center">Peran</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="py-3">
                        <div className="font-medium">{user.full_name || 'Tanpa Nama'}</div>
                        <div className="text-sm text-muted-foreground font-mono">{user.id}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${roleColors[user.role] || roleColors.team} px-3 py-1 text-xs`}>{user.role}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-green-700 border-green-200 px-3 py-1 text-xs">Aktif</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => handleCopyUserId(user.id)}>Salin User ID</DropdownMenuItem>
                            <DropdownMenuItem disabled>Edit Pengguna</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onSelect={() => handleDeleteUser(user)}>Hapus Pengguna</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">Tidak ada pengguna.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Tampilan Kartu untuk Mobile (di bawah md) */}
      <div className="grid gap-4 md:hidden">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <Card key={user.id} className="p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="font-semibold">{user.full_name || 'Tanpa Nama'}</span>
                  <span className="text-sm text-muted-foreground font-mono">{user.id.substring(0, 16)}...</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => handleCopyUserId(user.id)}>Salin User ID</DropdownMenuItem>
                    <DropdownMenuItem disabled>Edit Pengguna</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600" onSelect={() => handleDeleteUser(user)}>Hapus Pengguna</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Peran</span>
                <Badge className={`${roleColors[user.role] || roleColors.team} px-3 py-1 text-xs`}>{user.role}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className="text-green-700 border-green-200 px-3 py-1 text-xs">Aktif</Badge>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-10">
            Tidak ada pengguna.
          </div>
        )}
      </div>

      <DeleteUserModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteUser}
        userName={deleteModal.user?.full_name || ""}
        userRole={deleteModal.user?.role || ""}
        isLoading={deleteModal.isLoading}
      />
      
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUserAdded={handleUserAdded}
      />
    </div>
  );
}
