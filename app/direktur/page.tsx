// app/direktur/page.tsx - Halaman utama dashboard direktur

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Wallet, TrendingUp, Users } from "lucide-react";

// Fungsi untuk mengambil data pengguna untuk personalisasi
async function getUserData() {
    // PERBAIKAN: Tambahkan 'await' karena createClient() adalah async
    const supabase = await createClient();
    
    const { data: authData, error: authError } = await supabase.auth.getUser();

    // Jika tidak ada pengguna atau terjadi error, kembalikan nama default
    if (authError || !authData?.user) {
        console.error("Sesi pengguna tidak ditemukan:", authError);
        return { fullName: 'Direktur' };
    }

    const user = authData.user;

    // Lanjutkan untuk mengambil profil jika pengguna ditemukan
    const { data: profile } = await supabase
        .from('Profile')
        .select('full_name')
        .eq('id', user.id)
        .single();
    
    return {
        fullName: profile?.full_name || user.email?.split('@[0]')[0] || 'Direktur'
    };
}

export default async function DirekturDashboardPage() {
  const { fullName } = await getUserData();

  // Data placeholder untuk kartu statistik
  const stats = [
    {
      title: "Anggaran Bulan Ini",
      value: "Rp 150.000.000",
      description: "+5% dari bulan lalu",
      icon: Wallet
    },
    {
      title: "Total Pengeluaran",
      value: "Rp 85.750.000",
      description: "57% dari total anggaran",
      icon: TrendingUp
    },
    {
      title: "Aktivitas Tim",
      value: "1,204 Transaksi",
      description: "30 hari terakhir",
      icon: Activity
    },
    {
      title: "Karyawan Aktif",
      value: "78",
      description: "Total di semua departemen",
      icon: Users
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Selamat Datang, {fullName}</h1>
        <p className="text-muted-foreground">
          Berikut adalah ringkasan performa dan keuangan perusahaan Anda.
        </p>
      </div>

      {/* Grid untuk kartu statistik yang responsif */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 rounded-2xl">
        {stats.map((stat, index) => (
        <Card key={index} className="rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
    <stat.icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
    <div className="text-2xl font-bold">{stat.value}</div>
    <p className="text-xs text-muted-foreground">{stat.description}</p>
         </CardContent>
    </Card>
        ))}
      </div>

      {/* Placeholder untuk grafik atau tabel lainnya */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4 ">
            <CardHeader>
                <CardTitle>Performa Anggaran vs Realisasi</CardTitle>
                <CardDescription>Visualisasi penggunaan anggaran per kategori.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">[Grafik akan ditampilkan di sini]</p>
            </CardContent>
        </Card>
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>Transaksi Terbaru</CardTitle>
                <CardDescription>5 transaksi terakhir yang disetujui.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">[Daftar transaksi akan ditampilkan di sini]</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
