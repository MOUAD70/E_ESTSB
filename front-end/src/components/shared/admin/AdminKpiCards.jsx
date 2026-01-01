import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  GraduationCap,
  FileCheck2,
  UploadCloud,
  BadgeCheck,
} from "lucide-react";

const kpis = [
  {
    key: "total_users",
    label: "Total utilisateurs",
    icon: Users,
    hint: "Comptes enregistrés",
    accent: "bg-sky-600/10 text-sky-700",
    ring: "ring-sky-600/20",
  },
  {
    key: "total_candidates",
    label: "Total candidats",
    icon: GraduationCap,
    hint: "Candidats créés",
    accent: "bg-indigo-600/10 text-indigo-700",
    ring: "ring-indigo-600/20",
  },
  {
    key: "applications_submitted",
    label: "Candidatures soumises",
    icon: FileCheck2,
    hint: "Filière sélectionnée",
    accent: "bg-emerald-600/10 text-emerald-700",
    ring: "ring-emerald-600/20",
  },
  {
    key: "documents_uploaded",
    label: "Documents déposés",
    icon: UploadCloud,
    hint: "Dossiers complets",
    accent: "bg-amber-600/10 text-amber-700",
    ring: "ring-amber-600/20",
  },
  {
    key: "evaluated_candidates",
    label: "Candidats évalués",
    icon: BadgeCheck,
    hint: "Scores finaux calculés",
    accent: "bg-violet-600/10 text-violet-700",
    ring: "ring-violet-600/20",
  },
];

export function AdminKpiCards({ overview, loading }) {
  const items = kpis.map((k) => ({
    ...k,
    value: overview?.[k.key],
  }));

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-[120px] rounded-xl border bg-card/60 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((it) => {
        const Icon = it.icon;

        return (
          <Card
            key={it.key}
            className={[
              "group relative overflow-hidden",
              "border bg-card",
              "transition-all duration-200",
              "ring-1",
              it.ring,
            ].join(" ")}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-transparent via-primary/60 to-transparent opacity-60" />

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {it.label}
              </CardTitle>

              <div
                className={[
                  "inline-flex h-10 w-10 items-center justify-center rounded-xl",
                  "ring-1 ring-black/5",
                  it.accent,
                ].join(" ")}
              >
                <Icon className="h-5 w-5" />
              </div>
            </CardHeader>

            <CardContent className="space-y-1">
              <div className="text-3xl font-semibold tracking-tight">
                {it.value ?? "—"}
              </div>
              <div className="text-xs text-muted-foreground">{it.hint}</div>
            </CardContent>

            <div className="pointer-events-none absolute right-0 -top-30 h-40 w-40 rounded-full bg-primary/10 blur-2xl opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          </Card>
        );
      })}
    </div>
  );
}
