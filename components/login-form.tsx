// components/login-form.tsx

// 1. Impor server actions kita
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

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    // Menggunakan flex-col untuk menempatkan Card di tengah
    <div className={cn("flex min-h-screen items-center justify-center bg-muted/40", className)} {...props}>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login ke Akun Anda</CardTitle>
          <CardDescription>
            Masukkan email dan password untuk melanjutkan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tag <form> harus membungkus semua input dan tombol aksi */}
          <form className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email" // <-- 2. Atribut 'name' ini wajib ada
                placeholder="email@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                name="password" // <-- 3. Atribut 'name' ini juga wajib
                required
              />
            </div>
            {/* Kita gabungkan tombol aksi di sini */}
            <div className="mt-2 flex flex-col gap-3">
              <Button formAction={login} type="submit" className="w-full">
                Login
              </Button>
              <Button formAction={signup} variant="outline" className="w-full">
                Sign Up
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}