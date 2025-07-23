import Link from "next/link";
import { UserNav } from "@/components/auth/user-nav";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard,
  Wallet,
  BarChart3,
  Activity,
  Settings,
  Menu,
  Building2
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";

// Mendefinisikan item menu khusus untuk direktur
const directorMenuItems = [
  {
    title: "Dashboard Utama",
    href: "/direktur",
    icon: LayoutDashboard,
  },
  {
    title: "Manajemen Anggaran",
    href: "/direktur/budgeting",
    icon: Wallet,
  },
  {
    title: "Laporan Keuangan",
    href: "/direktur/reports",
    icon: BarChart3,
  },
  {
    title: "Analitik & Performa",
    href: "/direktur/analytics",
    icon: Activity,
  },
  {
    title: "Pengaturan",
    href: "/direktur/settings",
    icon: Settings,
  },
];

// Komponen untuk navigasi mobile menggunakan Sheet
function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 md:hidden"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Buka menu navigasi</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>
            <Link href="/direktur" className="flex items-center gap-2 text-lg font-semibold">
              <Building2 className="h-6 w-6 text-primary" />
              <span>Direktur Panel</span>
            </Link>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Menu navigasi utama untuk panel direktur.
          </SheetDescription>
        </SheetHeader>
        <nav className="grid gap-2 p-4 text-lg font-medium">
          {directorMenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

// Komponen untuk sidebar di desktop
function SidebarNav() {
  return (
    <div className="hidden border-r bg-card md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/direktur" className="flex items-center gap-2 font-semibold">
            <Building2 className="h-6 w-6 text-primary" />
            <span>Direktur Panel</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {directorMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-muted hover:text-primary"
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}

// Komponen layout utama yang menggabungkan semuanya
export default function DirekturLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <SidebarNav />
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
          <MobileNav />
          <div className="w-full flex-1">
            {/* Bisa ditambahkan breadcrumbs atau judul halaman dinamis di sini */}
          </div>
          <UserNav />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
