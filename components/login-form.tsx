// components/login-form.tsx

"use client";

import { login, signup } from "@/app/(auth)/login/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (formData: FormData) => {
    setIsLoading(true);
    try {
      await login(formData);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (formData: FormData) => {
    setIsLoading(true);
    try {
      await signup(formData);
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex min-h-screen items-center justify-center bg-muted/40", className)} {...props}>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">EfarinaTV Login</CardTitle>
          <CardDescription>
            Masukkan email dan password untuk melanjutkan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4">
            {message && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {decodeURIComponent(message)}
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="admin@efarinatv.com"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="mt-2 flex flex-col gap-3">
              <Button 
                formAction={handleLogin} 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
              
              <Button 
                formAction={handleSignup} 
                variant="outline" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Sign Up"}
              </Button>
            </div>
          </form>
          
          <div className="mt-4 text-xs text-muted-foreground">
            <p>Demo accounts:</p>
            <p>admin@efarinatv.com (Admin)</p>
            <p>direktur@efarinatv.com (Direktur)</p>
            <p>keuangan@efarinatv.com (Keuangan)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}