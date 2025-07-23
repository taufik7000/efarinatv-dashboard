// app/admin/users/add/page.tsx - Add user page with inline form

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Check, AlertCircle, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserAction } from "@/app/admin/users/add/actions";

const roles = [
  { value: "admin", label: "Admin" },
  { value: "direktur", label: "Direktur" },
  { value: "keuangan", label: "Keuangan" },
  { value: "redaksi", label: "Redaksi" },
  { value: "hrd", label: "HRD" },
  { value: "marketing", label: "Marketing" },
  { value: "team", label: "Team" },
];

// Success Modal Component
function SuccessModal({ 
  isOpen, 
  onClose, 
  userName, 
  userRole 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  userName: string; 
  userRole: string; 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">User Created Successfully!</h3>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-3">
            The new user account has been created successfully:
          </p>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Name:</span>
              <span className="text-gray-900">{userName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Role:</span>
              <span className="text-gray-900 capitalize">{userRole}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={onClose} className="flex-1">
            <Check className="w-4 h-4 mr-2" />
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AddUserPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdUser, setCreatedUser] = useState({ name: "", role: "" });
  const router = useRouter();

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

      // Validasi input
      if (!fullName || !email || !password || !role) {
        setMessage("All fields are required");
        return;
      }

      if (password.length < 6) {
        setMessage("Password must be at least 6 characters");
        return;
      }

      console.log('Creating user with email:', email);

      // Use server action instead of API route
      const result = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
          role
        }),
      });

      const data = await result.json();

      if (!result.ok) {
        console.error('API Error:', data);
        setMessage(data.error || 'Failed to create user');
        return;
      }

      console.log('User created successfully:', data);
      setMessage(`User ${fullName} successfully created with role ${role}`);
      
      // Reset form
      e.currentTarget.reset();
      
      // Redirect after success
      setTimeout(() => {
        router.push('/admin/users');
        router.refresh(); // Refresh to show new user
      }, 2000);

    } catch (error: any) {
      console.error('Unexpected error:', error);
      setMessage("An unexpected error occurred: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New User</h1>
          <p className="text-muted-foreground">
            Create a new user account and assign role
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Add User Form */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>
              Fill in the details for the new user account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {message && (
              <div className={`mb-4 p-3 rounded flex items-center gap-2 text-sm ${
                message.includes('successfully') || message.includes('created')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message.includes('successfully') || message.includes('created') ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {message}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Enter full name"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="user@efarinatv.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter password (min 6 characters)"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  name="role"
                  required
                  disabled={isLoading}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Creating User...' : 'Create User'}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/users')}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
            <CardDescription>
              Guidelines for creating user accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Role Descriptions</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p><strong>Admin:</strong> Full system access and user management</p>
                <p><strong>Direktur:</strong> Executive level access and reporting</p>
                <p><strong>Keuangan:</strong> Financial data and transaction access</p>
                <p><strong>Redaksi:</strong> Content creation and editorial access</p>
                <p><strong>HRD:</strong> Human resources and employee management</p>
                <p><strong>Marketing:</strong> Marketing campaigns and analytics</p>
                <p><strong>Team:</strong> Basic access for general staff</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Password Requirements</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• Minimum 6 characters</p>
                <p>• Include numbers and letters</p>
                <p>• Avoid common passwords</p>
                <p>• User can change password later</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Email Guidelines</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• Use company email domain when possible</p>
                <p>• Email must be unique in the system</p>
                <p>• Confirmation email will be sent</p>
                <p>• User can update email later</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}