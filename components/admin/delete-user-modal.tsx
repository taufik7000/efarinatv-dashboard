// components/admin/delete-user-modal.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, X } from "lucide-react";

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
  isLoading = false 
}: DeleteUserModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-3">
            Are you sure you want to delete this user? This action cannot be undone.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="font-medium text-red-700">Name:</span>
              <span className="text-red-900">{userName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-red-700">Role:</span>
              <span className="text-red-900 capitalize">{userRole}</span>
            </div>
          </div>
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> This will permanently delete the user account and all associated data.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isLoading ? 'Deleting...' : 'Delete User'}
          </Button>
        </div>
      </div>
    </div>
  );
}