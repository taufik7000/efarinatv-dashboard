// components/transactions/transaction-actions.tsx

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Check, XCircle, MoreHorizontal } from "lucide-react";
import { ApprovalReceiptModal } from "./approval-receipt-modal";

type Transaction = {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  type: 'Pemasukan' | 'Pengeluaran';
  status: 'Disetujui' | 'Tertunda' | 'Ditolak';
  category: { name: string } | null;
  requester: { full_name: string } | null;
  approver: { full_name: string } | null;
  receipt_url: string | null;
};

interface TransactionActionsProps {
  transaction: Transaction;
  canEdit: boolean;
  onEdit: (transaction: Transaction) => void;
  onUpdateStatus: (transactionId: string, status: 'Disetujui' | 'Ditolak', receiptUrl?: string) => Promise<void>;
}

export function TransactionActions({
  transaction,
  canEdit,
  onEdit,
  onUpdateStatus
}: TransactionActionsProps) {
  const [showReceiptModal, setShowReceiptModal] = React.useState(false);

  if (!canEdit) return null;

  // Modifikasi handler untuk menerima event dan menghentikan propagasi
  const handleApprove = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Hentikan propagasi event
    // Jika tidak ada bukti transaksi, tampilkan modal upload
    if (!transaction.receipt_url) {
      setShowReceiptModal(true);
    } else {
      // Langsung setujui jika sudah ada bukti
      await onUpdateStatus(transaction.id, 'Disetujui');
    }
  };

  const handleApproveWithReceipt = async (receiptUrl?: string) => {
    await onUpdateStatus(transaction.id, 'Disetujui', receiptUrl);
    setShowReceiptModal(false);
  };

  // Modifikasi handler untuk menerima event dan menghentikan propagasi
  const handleReject = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Hentikan propagasi event
    await onUpdateStatus(transaction.id, 'Ditolak');
  };

  // Modifikasi handler untuk menerima event dan menghentikan propagasi
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Hentikan propagasi event
    onEdit(transaction);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={(e) => e.stopPropagation()} // Pertahankan ini untuk tombol pemicu dropdown
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Aksi Transaksi</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleEdit} // Panggil handler yang sudah dimodifikasi
            disabled={transaction.status !== 'Tertunda'}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Transaksi
          </DropdownMenuItem>
          
          {transaction.status === 'Tertunda' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleApprove} // Panggil handler yang sudah dimodifikasi
                className="text-green-600 focus:text-green-600"
              >
                <Check className="mr-2 h-4 w-4" />
                Setujui
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleReject} // Panggil handler yang sudah dimodifikasi
                className="text-red-600 focus:text-red-600"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Tolak
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ApprovalReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        onApprove={handleApproveWithReceipt}
        transactionId={transaction.id}
        transactionDescription={transaction.description}
      />
    </>
  );
}