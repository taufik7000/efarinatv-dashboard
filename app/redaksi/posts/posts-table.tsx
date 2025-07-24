// app/redaksi/posts/posts-table.tsx

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Eye, 
  Trash2,
  Filter,
  Star,
  Clock,
  CheckCircle,
  Archive
} from "lucide-react";
import Link from "next/link";

// Types
type Post = {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  view_count: number;
  created_at: string;
  published_at: string | null;
  updated_at: string;
  author: { full_name: string } | null;
  category: { name: string; color: string } | null;
};

type Category = {
  id: string;
  name: string;
  color: string;
};

type CurrentUser = {
  id: string;
  role: string;
  fullName: string;
} | null;

interface PostsTableProps {
  posts: Post[];
  categories: Category[];
  currentUser: CurrentUser;
}

// Helper functions
const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '-';
  }
};

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const variants = {
    published: "border-green-200 text-green-700 bg-green-50",
    draft: "border-yellow-200 text-yellow-700 bg-yellow-50",
    archived: "border-gray-200 text-gray-700 bg-gray-50"
  };

  const icons = {
    published: CheckCircle,
    draft: Clock,
    archived: Archive
  };

  const Icon = icons[status as keyof typeof icons];

  return (
    <Badge variant="outline" className={variants[status as keyof typeof variants]}>
      <Icon className="w-3 h-3 mr-1" />
      {status === 'published' ? 'Diterbitkan' : 
       status === 'draft' ? 'Draft' : 'Diarsipkan'}
    </Badge>
  );
}

export function PostsTable({ posts, categories, currentUser }: PostsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [authorFilter, setAuthorFilter] = useState<string>("all");
  const router = useRouter();

  // Get unique authors for filter
  const authors = useMemo(() => {
    const uniqueAuthors = posts
      .map(post => post.author?.full_name)
      .filter((name, index, arr) => name && arr.indexOf(name) === index)
      .sort();
    return uniqueAuthors;
  }, [posts]);

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.author?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || post.status === statusFilter;
      
      const matchesCategory = categoryFilter === "all" || post.category?.name === categoryFilter;
      
      const matchesAuthor = authorFilter === "all" || post.author?.full_name === authorFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesAuthor;
    });
  }, [posts, searchTerm, statusFilter, categoryFilter, authorFilter]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: posts.length,
      published: posts.filter(p => p.status === 'published').length,
      draft: posts.filter(p => p.status === 'draft').length,
      featured: posts.filter(p => p.featured).length,
    };
  }, [posts]);

  // Check permissions
  const canEditPost = (post: Post) => {
    if (!currentUser) return false;
    const userRole = currentUser.role.toLowerCase();
    return ['admin', 'direktur', 'redaksi'].includes(userRole) || post.author?.full_name === currentUser.fullName;
  };

  const canDeletePost = (post: Post) => {
    if (!currentUser) return false;
    const userRole = currentUser.role.toLowerCase();
    return ['admin', 'direktur'].includes(userRole) || post.author?.full_name === currentUser.fullName;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Artikel</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Semua artikel</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diterbitkan</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
            <p className="text-xs text-muted-foreground">Artikel live</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">Belum dipublikasi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
            <Star className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.featured}</div>
            <p className="text-xs text-muted-foreground">Artikel unggulan</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Daftar Artikel</CardTitle>
              <CardDescription>
                {filteredPosts.length} dari {posts.length} artikel
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/redaksi/posts/create">
                <Plus className="mr-2 h-4 w-4" />
                Tulis Artikel Baru
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari artikel atau penulis..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="published">Diterbitkan</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Diarsipkan</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Author Filter */}
            <Select value={authorFilter} onValueChange={setAuthorFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Penulis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Penulis</SelectItem>
                {authors.map((author) => (
                  <SelectItem key={author} value={author!}>
                    {author}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artikel</TableHead>
                  <TableHead>Penulis</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Views</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium line-clamp-2 max-w-[300px]">
                              {post.title}
                            </h4>
                            {post.featured && (
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            /{post.slug}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {post.author?.full_name || 'Unknown'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {post.category ? (
                          <Badge 
                            variant="outline" 
                            style={{ 
                              backgroundColor: post.category.color + '20', 
                              borderColor: post.category.color 
                            }}
                            className="text-xs"
                          >
                            {post.category.name}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={post.status} />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Eye className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {formatNumber(post.view_count)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(post.created_at)}</div>
                          {post.published_at && (
                            <div className="text-xs text-muted-foreground">
                              Pub: {formatDate(post.published_at)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            
                            <DropdownMenuItem 
                              onClick={() => window.open(`/news/${post.slug}`, '_blank')}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Lihat Artikel
                            </DropdownMenuItem>
                            
                            {canEditPost(post) && (
                              <DropdownMenuItem 
                                onClick={() => router.push(`/redaksi/posts/${post.id}/edit`)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            
                            {canDeletePost(post) && (
                              <DropdownMenuItem 
                                className="text-red-600 focus:text-red-600"
                                onClick={() => {
                                  if (confirm(`Yakin ingin menghapus artikel "${post.title}"?`)) {
                                    // TODO: Implement delete functionality
                                    console.log('Delete post:', post.id);
                                  }
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-muted-foreground/50" />
                        <p>
                          {searchTerm || statusFilter !== "all" || categoryFilter !== "all" || authorFilter !== "all"
                            ? 'Tidak ada artikel yang sesuai dengan filter.'
                            : 'Belum ada artikel. Mulai menulis sekarang!'}
                        </p>
                        {(!posts.length) && (
                          <Button asChild>
                            <Link href="/redaksi/posts/create">
                              <Plus className="mr-2 h-4 w-4" />
                              Tulis Artikel Pertama
                            </Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}