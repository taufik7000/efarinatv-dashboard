// app/admin/users/page.tsx - Users management page (Client Component)

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
import { MoreHorizontal, UserPlus, Search, Filter, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { DeleteUserModal } from "@/components/admin/delete-user-modal";

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
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    user: null as any,
    isLoading: false
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const supabase = createClient();
        
        console.log('Fetching users from Profile table...');
        
        const { data: users, error } = await supabase
          .from("Profile")
          .select(`
            id,
            full_name,
            role
          `)
          .order('full_name', { ascending: true });

        console.log('Users query result:', { users, error });
        console.log('Users count:', users?.length || 0);
        
        // Debug first user structure
        if (users && users.length > 0) {
          console.log('First user structure:', users[0]);
          console.log('First user ID:', users[0].id);
          console.log('First user ID type:', typeof users[0].id);
        }

        if (error) {
          console.error('Error fetching users:', error);
          setUsers([]); // Set empty array on error
        } else {
          setUsers(users || []);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []); // Empty dependency array means run once on mount

  // Add manual refresh function
  const refreshUsers = async () => {
    setLoading(true);
    const supabase = createClient();
    
    const { data: users, error } = await supabase
      .from("Profile")
      .select(`
        id,
        full_name,
        role
      `)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error refreshing users:', error);
    } else {
      setUsers(users || []);
      console.log('Users refreshed, count:', users?.length || 0);
    }
    setLoading(false);
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyUserId = (userId: string) => {
    navigator.clipboard.writeText(userId);
    setMessage("User ID copied to clipboard");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleDeleteUser = (user: any) => {
    setDeleteModal({
      isOpen: true,
      user: user,
      isLoading: false
    });
  };

  const confirmDeleteUser = async () => {
    if (!deleteModal.user) return;

    console.log('=== DELETE USER START ===');
    console.log('Deleting user:', deleteModal.user);
    console.log('User ID:', deleteModal.user.id);
    console.log('User ID type:', typeof deleteModal.user.id);
    console.log('User ID length:', deleteModal.user.id?.length);
    
    // Validate UUID format on frontend
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(deleteModal.user.id)) {
      console.error('Invalid UUID format on frontend:', deleteModal.user.id);
      setMessage('Invalid user ID format. Cannot delete user.');
      return;
    }

    setDeleteModal(prev => ({ ...prev, isLoading: true }));

    try {
      console.log('Sending DELETE request to API...');

      const requestBody = {
        userId: deleteModal.user.id
      };
      console.log('Request body:', requestBody);

      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);

      if (!contentType?.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response:', textResponse.substring(0, 200));
        setMessage('API route error: Expected JSON response but got HTML/text');
        return;
      }

      const result = await response.json();
      console.log('API Response:', result);

      if (!response.ok) {
        console.error('API Error:', result);
        setMessage(result.error || 'Failed to delete user');
        return;
      }

      console.log('User deleted successfully:', result);
      setMessage(`User ${deleteModal.user.full_name} successfully deleted`);
      
      // Remove user from local state
      setUsers(prev => prev.filter(u => u.id !== deleteModal.user.id));
      
      // Close modal
      setDeleteModal({
        isOpen: false,
        user: null,
        isLoading: false
      });

      // Clear message after 5 seconds
      setTimeout(() => setMessage(""), 5000);

    } catch (error: any) {
      console.error('Error deleting user:', error);
      setMessage("Network error: " + error.message);
    } finally {
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const closeDeleteModal = () => {
    if (!deleteModal.isLoading) {
      setDeleteModal({
        isOpen: false,
        user: null,
        isLoading: false
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 md:gap-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      {/* Success/Error Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.includes('successfully') || message.includes('copied')
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage all users and their roles in the system
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshUsers}>
            Refresh
          </Button>
          <Button asChild>
            <Link href="/admin/users/add">
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Search and filter users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search users..." 
                  className="pl-8" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter by Role
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Complete list of registered users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          <span className="text-sm font-medium">
                            {user.full_name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">
                            {user.full_name || 'Unknown User'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ID: {user.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleColors[user.role] || roleColors.team}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {user.id.substring(0, 16)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleCopyUserId(user.id)}
                          >
                            Copy user ID
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/users/${user.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit user
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>View details</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete user
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <UserPlus className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {users.length === 0 ? 'No users found' : 'No matching users'}
                        </p>
                        <Button asChild variant="outline">
                          <Link href="/admin/users/add">Add your first user</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Registered in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(users.map(u => u.role)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Different roles assigned
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}