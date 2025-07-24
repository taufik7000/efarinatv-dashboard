// app/redaksi/layout.tsx - Layout modern untuk dashboard redaksi

import Link from "next/link";
import { UserNav } from "@/components/auth/user-nav";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard,
  PenTool,
  FileText,
  Tags,
  FolderOpen,
  Settings,
  Menu,
  Newspaper,
  Plus,
  Eye,
  BarChart3
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";

// Menu items untuk redaksi
const redaksiMenuItems = [
  {
    title: "Dashboard",
    href: "/redaksi",
    icon: LayoutDashboard,
    description: "Overview dan statistik"
  },
  {
    title: "Tulis Berita",
    href: "/redaksi/posts/create",
    icon: PenTool,
    description: "Buat artikel baru"
  },
  {
    title: "Semua Berita",
    href: "/redaksi/posts",
    icon: FileText,
    description: "Kelola semua artikel"
  },
  {
    title: "Kategori",
    href: "/redaksi/categories",
    icon: FolderOpen,
    description: "Kelola kategori berita"
  },
  {
    title: "Tags",
    href: "/redaksi/tags",
    icon: Tags,
    description: "Kelola tags artikel"
  },
  {
    title: "Analytics",
    href: "/redaksi/analytics",
    icon: BarChart3,
    description: "Statistik dan performa"
  },
  {
    title: "Pengaturan",
    href: "/redaksi/settings",
    icon: Settings,
    description: "Pengaturan redaksi"
  },
];

// Quick actions untuk header
const quickActions = [
  {
    title: "Tulis Berita",
    href: "/redaksi/posts/create",
    icon: Plus,
    variant: "default" as const
  },
  {
    title: "Preview Situs",
    href: "/news",
    icon: Eye,
    variant: "outline" as const
  }
];

// Mobile Navigation Component
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
        <SheetHeader className="p-4 border-b bg-muted/40">
          <SheetTitle>
            <Link href="/redaksi" className="flex items-center gap-2 text-lg font-semibold">
              <Newspaper className="h-6 w-6 text-blue-600" />
              <span className="text-foreground">Redaksi EfarinaTV</span>
            </Link>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Menu navigasi utama untuk panel redaksi.
          </SheetDescription>
        </SheetHeader>
        
        <nav className="flex-1 p-4">
          <div className="grid gap-1 text-sm font-medium">
            {redaksiMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                <item.icon className="h-4 w-4" />
                <div className="flex flex-col">
                  <span>{item.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </nav>

        {/* Quick Actions di Mobile */}
        <div className="border-t p-4">
          <div className="grid gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.href}
                variant={action.variant}
                size="sm"
                className="justify-start"
                asChild
              >
                <Link href={action.href}>
                  <action.icon className="mr-2 h-4 w-4" />
                  {action.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Desktop Sidebar Component
function SidebarNav() {
  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        {/* Header */}
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/redaksi" className="flex items-center gap-2 font-semibold">
            <Newspaper className="h-6 w-6 text-blue-600" />
            <span className="text-foreground">Redaksi EfarinaTV</span>
          </Link>
        </div>
        
        {/* Quick Actions */}
        <div className="px-3 py-2">
          <div className="grid gap-1">
            {quickActions.map((action) => (
              <Button
                key={action.href}
                variant={action.variant}
                size="sm"
                className="justify-start h-8"
                asChild
              >
                <Link href={action.href}>
                  <action.icon className="mr-2 h-4 w-4" />
                  {action.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {redaksiMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                <item.icon className="h-4 w-4" />
                <div className="flex flex-col">
                  <span>{item.title}</span>
                  <span className="text-xs text-muted-foreground hidden lg:block">
                    {item.description}
                  </span>
                </div>
              </Link>
            ))}
          </nav>
        </div>

        {/* Footer info */}
        <div className="mt-auto border-t p-4">
          <div className="text-xs text-muted-foreground">
            <div className="font-medium">EfarinaTV News</div>
            <div>Content Management System</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Header Component
function HeaderNav() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:h-[60px] lg:px-6">
      <MobileNav />
      
      {/* Breadcrumb atau Title bisa ditambahkan di sini */}
      <div className="flex-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Newspaper className="h-4 w-4" />
          <span className="hidden sm:inline">Redaksi</span>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Desktop Quick Actions */}
        <div className="hidden md:flex items-center gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.href}
              variant={action.variant}
              size="sm"
              asChild
            >
              <Link href={action.href}>
                <action.icon className="mr-2 h-4 w-4" />
                {action.title}
              </Link>
            </Button>
          ))}
        </div>
        
        <UserNav />
      </div>
    </header>
  );
}

// Main Layout Component
export default function RedaksiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <SidebarNav />
      <div className="flex flex-col">
        <HeaderNav />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}