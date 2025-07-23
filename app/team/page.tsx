// app/team/page.tsx - Fixed version

import { createClient } from "@/lib/supabase/server";
import { UserNav } from "@/components/auth/user-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TeamPage() {
  try {
    const supabase = await createClient(); // Added await
    
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Authentication Error</h1>
            <p className="text-muted-foreground">Please try logging in again.</p>
          </div>
        </div>
      );
    }

    // Get profile with error handling
    const { data: profile, error: profileError } = await supabase
      .from("Profile")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    // If profile doesn't exist, create one
    if (profileError) {
      console.log('Profile not found, this will be created automatically');
    }

    const userRole = profile?.role || 'team';
    const fullName = profile?.full_name || user.email?.split('@')[0] || 'User';

    return (
      <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-10">
          <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
            <div className="flex items-center gap-2 text-lg font-semibold md:text-base">
              <span>EfarinaTV</span>
            </div>
            <span className="text-muted-foreground">Team Dashboard</span>
          </nav>
          <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <div className="ml-auto flex-1 sm:flex-initial">
              {/* Space for future components */}
            </div>
            <UserNav />
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Welcome</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {fullName}
                </div>
                <p className="text-xs text-muted-foreground">
                  Role: {userRole}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Active</div>
                <p className="text-xs text-muted-foreground">
                  System running normally
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Access Level</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{userRole}</div>
                <p className="text-xs text-muted-foreground">
                  {userRole === 'admin' ? 'Full access' : 
                   userRole === 'direktur' ? 'Executive access' :
                   userRole === 'team' ? 'Standard permissions' : 
                   'Department access'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">User ID</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-mono">
                  {user.id.substring(0, 8)}...
                </div>
                <p className="text-xs text-muted-foreground">
                  Account identifier
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Team Dashboard</CardTitle>
                <CardDescription>
                  Welcome to your team dashboard. From here you can access your daily tasks and collaborate with your team.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Today's Tasks
                      </p>
                      <p className="text-sm text-muted-foreground">
                        No pending tasks
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Team Messages
                      </p>
                      <p className="text-sm text-muted-foreground">
                        All caught up!
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and shortcuts for team members.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                    View Schedule
                  </button>
                  <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                    Submit Report
                  </button>
                  <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                    Contact Support
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
              <CardDescription>
                Development information (remove in production)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>User Email:</strong> {user.email}
                </div>
                <div>
                  <strong>User ID:</strong> {user.id}
                </div>
                <div>
                  <strong>Role:</strong> {userRole}
                </div>
                <div>
                  <strong>Full Name:</strong> {fullName}
                </div>
                <div>
                  <strong>Profile Status:</strong> {profile ? 'Found' : 'Not found (will be created)'}
                </div>
                <div>
                  <strong>Dashboard:</strong> /team
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  } catch (error) {
    console.error('Error in TeamPage:', error);
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Dashboard Error</h1>
          <p className="text-muted-foreground">Something went wrong loading the dashboard.</p>
        </div>
      </div>
    );
  }
}