// app/direktur/budgeting/components/budget-actuals-chart.tsx

"use client";

import * as React from "react"; // Pastikan React diimpor
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"; // Tambahkan YAxis
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // Diperlukan untuk struktur Card
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"; // Diperlukan untuk komponen Chart
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Diperlukan untuk Select

// Sesuaikan tipe data untuk input chart Anda
type ChartDataPoint = {
    date: string; // "YYYY-MM"
    'Anggaran Dialokasikan': number;
    'Realisasi Pengeluaran': number;
    [key: string]: number | string; // Untuk properti dinamis lainnya
};

interface BudgetActualsChartProps {
    chartData: ChartDataPoint[];
    chartConfig: ChartConfig;
}

export function BudgetActualsChart({ chartData, chartConfig }: BudgetActualsChartProps) {
  // Logika timeRange dan filter tidak diperlukan di sini karena data sudah diagregasi bulanan di server.
  // Komponen ini akan menerima data yang sudah siap divisualisasikan.

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Realisasi Anggaran per Bulan</CardTitle>
          <CardDescription>
            Perbandingan anggaran yang dialokasikan dengan pengeluaran aktual setiap bulan.
          </CardDescription>
        </div>
        {/* Select untuk rentang waktu dihapus karena data sudah diagregasi bulanan */}
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={chartData}> {/* Menggunakan chartData yang diterima sebagai prop */}
            <defs>
              {/* Definisikan linearGradient untuk 'Anggaran Dialokasikan' */}
              <linearGradient id="fillAnggaranDialokasikan" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-Anggaran-Dialokasikan)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-Anggaran-Dialokasikan)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              {/* Definisikan linearGradient untuk 'Realisasi Pengeluaran' */}
              <linearGradient id="fillRealisasiPengeluaran" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-Realisasi-Pengeluaran)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-Realisasi-Pengeluaran)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value + '-01'); // Tambahkan '-01' untuk parse sebagai awal bulan
                return date.toLocaleDateString("id-ID", {
                  month: "short",
                  year: "numeric", // Tampilkan tahun juga
                });
              }}
            />
            {/* Tambahkan YAxis untuk menampilkan nilai jumlah */}
            <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `Rp ${value.toLocaleString('id-ID', { minimumFractionDigits: 0 })}`}
                domain={[0, 'auto']} // Pastikan Y-axis dimulai dari 0
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value + '-01').toLocaleDateString("id-ID", {
                      month: "long",
                      year: "numeric",
                    });
                  }}
                  formatter={(value: number, name: string) => {
                    return [
                      `Rp ${value.toLocaleString('id-ID', { minimumFractionDigits: 0 })}`,
                      chartConfig[name]?.label || name,
                    ];
                  }}
                  indicator="dot"
                />
              }
            />
            {/* Area untuk Anggaran Dialokasikan */}
            <Area
              dataKey="Anggaran Dialokasikan"
              type="natural"
              fill="url(#fillAnggaranDialokasikan)"
              stroke="var(--color-Anggaran-Dialokasikan)"
              stackId="a" // Gunakan stackId yang sama untuk menumpuk area jika ada lebih dari satu
            />
            {/* Area untuk Realisasi Pengeluaran */}
            <Area
              dataKey="Realisasi Pengeluaran"
              type="natural"
              fill="url(#fillRealisasiPengeluaran)"
              stroke="var(--color-Realisasi-Pengeluaran)"
              stackId="a" // Pastikan stackId sama untuk menumpuk
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}