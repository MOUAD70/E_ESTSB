"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const chartConfig = {
  ai: { label: "Moyenne AI", color: "var(--chart-2)" },
  final: { label: "Moyenne finale", color: "var(--chart-3)" },
};

export function BarChartAiFinal({ data = [], loading = false }) {
  const chartData = data.map((f) => ({
    filiere: f.filiere,
    ai: f.avg_ai_score ?? 0,
    final: f.avg_final_score ?? 0,
  }));

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>AI vs Note finale</CardTitle>
        <CardDescription>Moyennes par filière (sur 20)</CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="h-[320px] rounded-xl border bg-card animate-pulse" />
        ) : (
          <ChartContainer config={chartConfig} className="h-[320px] w-full">
            <BarChart data={chartData} margin={{ top: 20, left: 8, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="filiere" tickLine={false} tickMargin={10} axisLine={false} interval={0} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="ai" fill="var(--color-ai)" radius={8} />
              <Bar dataKey="final" fill="var(--color-final)" radius={8} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
