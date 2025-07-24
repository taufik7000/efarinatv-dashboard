
// app/redaksi/page.tsx - Dashboard utama redaksi

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Eye, 
  TrendingUp, 
  Clock,
  Plus,
  Calendar,
  Users,
  BarChart3
} from "lucide-react";
import Link from "next/link";

// Fungsi untuk mengambil statistik redaksi
async function getRedaksiStats() {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        totalPosts: 0,
        publishedPosts: 0,
        draftPosts: 0,
        totalViews: 0,
        recentPosts: [],
        myPosts: 0
      };
    }

    // Get total posts count
    const { count: totalPosts } = await supabase
      .from('Posts')
      .select('*', { count: 'exact', head: true });

    // Get published posts count
    const { count: publishedPosts } = await supabase
      .from('Posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    // Get draft posts count
    const { count: draftPosts } = await supabase
      .from('Posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft');

    // Get my posts count
    const { count: myPosts } = await supabase
      .from('Posts')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', user.id);

    // Get total views (sum of all view_count)
    const { data: viewsData } = await supabase
      .from('Posts')
      .select('view_count')
      .eq('status', 'published');

    const totalViews = viewsData?.reduce((sum, post) => sum + (post.view_count || 0), 0) || 0;

    // Get recent posts with author info
    const { data: recentPosts } = await supabase
      .from('Posts')
      .select(`
        id,
        title,
        status,
        created_at,
        published_at,
        view_count,
        author:Profile(full_name),
        category:PostCategories(name, color)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      totalPosts: totalPosts || 0,
      publishedPosts: publishedPosts || 0,
      draftPosts: draftPosts || 0,
      totalViews,
      recentPosts: recentPosts || [],
      myPosts: myPosts || 0
    };
  } catch (error) {
    console.error('Error fetching redaksi stats:', error);
    return {
      totalPosts: 0,
      publishedPosts: 0,
      draftPosts: 0,
      totalViews: 0,
      recentPosts: [],
      myPosts: 0
    };
  }
}

// Fungsi untuk mengambil data user
async function getUserData() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { fullName: 'Redaksi' };
  }

  const { data: profile } = await supabase
    .from('Profile')
    .select('full_name')
    .eq('id', user.id)
    .single();
  
  return {
    fullName: profile?.full_name || user.email?.split('@')[0] || 'Redaksi'
  };
}

// Format tanggal
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
    return dateString;
  }
};

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const variants = {
    published: "border-green-200 text-green-700 bg-green-50",
    draft: "border-yellow-200 text-yellow-700 bg-yellow-50",
    archived: "border-gray-200 text-gray-700 bg-gray-50"
  };

  return (
    <Badge variant="outline" className={variants[status as keyof typeof variants]}>
      {status === 'published' ? 'Diterbitkan' : 
       status === 'draft' ? 'Draft' : 'Diarsipkan'}
    </Badge>
  );
}

export default async function RedaksiDashboard() {
  const { fullName } = await getUserData();
  const stats = await getRedaksiStats();

  const statCards = [
    {
      title: "Total Artikel",
      value: stats.totalPosts.toString(),
      description: "Semua artikel di sistem",
      icon: FileText,
      color: "text-blue-600"
    },
    {
      title: "Artikel Saya",
      value: stats.myPosts.toString(),
      description: "Artikel yang saya tulis",
      icon: Users,
      color: "text-purple-600"
    },
    {
      title: "Diterbitkan",
      value: stats.publishedPosts.toString(),
      description: "Artikel yang sudah live",
      icon: Eye,
      color: "text-green-600"
    },
    {
      title: "Draft",
      value: stats.draftPosts.toString(),
      description: "Artikel dalam proses",
      icon: Clock,
      color: "text-yellow-600"
    },
    {
      title: "Total Views",
      value: stats.totalViews.toLocaleString(),
      description: "Pembaca keseluruhan",
      icon: TrendingUp,
      color: "text-orange-600"
    },
    {
      title: "Rata-rata",
      value: stats.publishedPosts > 0 ? Math.round(stats.totalViews / stats.publishedPosts).toString() : "0",
      description: "Views per artikel",
      icon: BarChart3,
      color: "text-indigo-600"
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Selamat Datang, {fullName}
          </h1>
          <p className="text-muted-foreground">
            Kelola konten dan artikel berita dengan mudah dari dashboard redaksi.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/redaksi/posts/create">
              <Plus className="mr-2 h-4 w-4" />
              Tulis Artikel Baru
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Posts and Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Recent Posts */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Artikel Terbaru</CardTitle>
                <CardDescription>5 artikel terakhir yang dibuat</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/redaksi/posts">
                  Lihat Semua
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentPosts.length > 0 ? (
              <div className="space-y-4">
                {stats.recentPosts.map((post: any) => (
                  <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium line-clamp-1">{post.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span>oleh {post.author?.full_name || 'Unknown'}</span>
                        <span>•</span>
                        <span>{formatDate(post.created_at)}</span>
                        {post.category && (
                          <>
                            <span>•</span>
                            <Badge 
                              variant="outline" 
                              style={{ backgroundColor: post.category.color + '20', borderColor: post.category.color }}
                              className="text-xs"
                            >
                              {post.category.name}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={post.status} />
                      {post.status === 'published' && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          {post.view_count || 0}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada artikel. Mulai menulis sekarang!</p>
                <Button className="mt-4" asChild>
                  <Link href="/redaksi/posts/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Tulis Artikel Pertama
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips & Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Tips & Panduan Cepat
          </CardTitle>
          <CardDescription>
            Panduan untuk memaksimalkan penggunaan dashboard redaksi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">📝 Menulis Artikel</h4>
              <p className="text-sm text-muted-foreground">
                Gunakan editor rich text untuk format yang menarik. Jangan lupa tambahkan thumbnail dan kategori.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">🏷️ Menggunakan Tags</h4>
              <p className="text-sm text-muted-foreground">
                Tag membantu pembaca menemukan artikel terkait. Gunakan maksimal 5 tag per artikel.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">📊 Pantau Performa</h4>
              <p className="text-sm text-muted-foreground">
                Cek analytics untuk melihat artikel mana yang paling banyak dibaca pembaca.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}