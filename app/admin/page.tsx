// app/admin/page.tsx - Optimized version

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Shield, Activity, Settings } from "lucide-react";
import { Suspense } from "react";

// Separate loading component
function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Optimized stats function with single query
async function getStats() {
  try {
    const supabase = await createClient();
    
    // Single query to get all profiles
    const { data: profiles, error } = await supabase
      .from("Profile")
      .select("role, full_name, id")
      .order('id', { ascending: false });

    if (error) {
      console.error('Error fetching profiles:', error);
      return {
        totalUsers: 0,
        usersByRole: {},
        recentUsers: []
      };
    }

    const profilesData = profiles || [];
    
    // Process data in memory instead of multiple queries
    const usersByRole = profilesData.reduce((acc: any, user: any) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    const recentUsers = profilesData.slice(0, 5);

    return {
      totalUsers: profilesData.length,
      usersByRole,
      recentUsers
    };
  } catch (error) {
    console.error('Error in getStats:', error);
    return {
      totalUsers: 0,
      usersByRole: {},
      recentUsers: []
    };
  }
}

// Main dashboard component
async function DashboardContent() {
  const stats = await getStats();

  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    direktur: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    keuangan: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    redaksi: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    hrd: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    marketing: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
    team: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  };

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered users in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(stats.usersByRole).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Different roles assigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.usersByRole.admin || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Administrator accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Simplified Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <a
              href="/admin/users/add"
              className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              <span className="text-sm font-medium">Add New User</span>
            </a>
            <a
              href="/admin/users"
              className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
            >
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Manage Users</span>
            </a>
            <a
              href="/admin/roles"
              className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
            >
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Role Management</span>
            </a>
            <a
              href="/admin/settings"
              className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium">System Settings</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function AdminDashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}