"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  candidatures: {
    label: "Candidatures",
    color: "var(--chart-1)",
  },
};

export function ChartBarLabel({
  data = [],
  title = "Candidatures par filière",
  description = "Nombre de candidatures soumises par filière",
}) {
  // backend -> recharts dataset
  const chartData = data.map((f) => ({
    filiere: f.filiere,
    candidatures: f.candidatures,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 24, left: 8, right: 8 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="filiere"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              // keep filiere names readable
              interval={0}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent />}
            />

            <Bar dataKey="candidatures" fill="var(--color-candidatures)" radius={8}>
              <LabelList
                position="top"
                offset={10}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
