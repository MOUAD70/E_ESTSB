// AdminKpiCards.jsx — refined KPI cards, props/data/logic 100% unchanged
import {
  Users,
  GraduationCap,
  FileCheck2,
  UploadCloud,
  BadgeCheck,
} from "lucide-react";

const KPIS = [
  {
    key: "total_users",
    label: "Utilisateurs",
    hint: "Comptes enregistrés",
    icon: Users,
    gradient: "from-sky-500 to-sky-600",
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
    barColor: "bg-gradient-to-r from-sky-400 to-sky-600",
    dotColor: "bg-sky-500",
  },
  {
    key: "total_candidates",
    label: "Candidats",
    hint: "Profils créés",
    icon: GraduationCap,
    gradient: "from-indigo-500 to-indigo-600",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    barColor: "bg-gradient-to-r from-indigo-400 to-indigo-600",
    dotColor: "bg-indigo-500",
  },
  {
    key: "applications_submitted",
    label: "Candidatures",
    hint: "Filière sélectionnée",
    icon: FileCheck2,
    gradient: "from-emerald-500 to-emerald-600",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    barColor: "bg-gradient-to-r from-emerald-400 to-emerald-600",
    dotColor: "bg-emerald-500",
  },
  {
    key: "documents_uploaded",
    label: "Documents",
    hint: "Dossiers déposés",
    icon: UploadCloud,
    gradient: "from-amber-500 to-amber-600",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    barColor: "bg-gradient-to-r from-amber-400 to-amber-600",
    dotColor: "bg-amber-500",
  },
  {
    key: "evaluated_candidates",
    label: "Évalués",
    hint: "Scores finaux calculés",
    icon: BadgeCheck,
    gradient: "from-violet-500 to-violet-600",
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    barColor: "bg-gradient-to-r from-violet-400 to-violet-600",
    dotColor: "bg-violet-500",
  },
];

/* ─── Shared shimmer keyframes (injected once) ─── */
const shimmerStyle = `
  @keyframes kpi-shimmer {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
`;

/* ─── Skeleton placeholder block ─── */
function ShimmerBlock({ className = "" }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-gray-100 ${className}`}>
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent"
        style={{ animation: "kpi-shimmer 1.6s ease-in-out infinite" }}
      />
    </div>
  );
}

/* ─── Shimmer skeleton card ─── */
function KpiSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <style>{shimmerStyle}</style>
      <div className="h-[3px] w-full rounded-t-2xl bg-gray-100" />
      <div className="p-5">
        <div className="flex items-start justify-between mb-5">
          <ShimmerBlock className="h-11 w-11 rounded-xl" />
          <ShimmerBlock className="h-5 w-14 rounded-full" />
        </div>
        <ShimmerBlock className="h-9 w-20 rounded-lg mb-2" />
        <ShimmerBlock className="h-3.5 w-24 rounded-md mb-1.5" />
        <ShimmerBlock className="h-3 w-32 rounded mb-5" />
        <ShimmerBlock className="h-[3px] w-full rounded-full" />
      </div>
    </div>
  );
}

/* ─── Single KPI card ─── */
function KpiCard({ kpi, value, index }) {
  const Icon = kpi.icon;
  const displayVal = value ?? "—";

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-300"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* top accent line */}
      <div className={`h-[3px] w-full bg-gradient-to-r ${kpi.gradient} rounded-t-2xl`} />

      {/* hover glow orb */}
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${kpi.gradient} opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-[0.07]`}
      />

      <div className="p-5">
        {/* icon + live indicator */}
        <div className="flex items-start justify-between mb-5">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${kpi.iconBg} ${kpi.iconColor} ring-1 ring-white group-hover:scale-105 transition-transform duration-300`}
          >
            <Icon className="h-[18px] w-[18px]" />
          </div>
          {/* Dot-only live badge — no text decoration */}
          <div className="flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-100 px-2 py-1">
            <span className={`h-1.5 w-1.5 rounded-full ${kpi.dotColor} animate-pulse flex-shrink-0`} />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 leading-none">
              Live
            </span>
          </div>
        </div>

        {/* value — no underline, clean tabular-nums */}
        <p className="text-[28px] font-bold tracking-tight text-gray-900 tabular-nums leading-none mb-2">
          {displayVal}
        </p>

        {/* label */}
        <p className="text-sm font-semibold text-gray-700 leading-snug mb-1">
          {kpi.label}
        </p>

        {/* hint */}
        <p className="text-xs text-gray-400 leading-snug mb-5">{kpi.hint}</p>

        {/* progress bar */}
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full ${kpi.barColor} transition-all duration-700`}
            style={{ width: displayVal !== "—" ? "100%" : "0%" }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Exported component — props 100% unchanged ─── */
export function AdminKpiCards({ overview, loading }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {KPIS.map((kpi, i) => (
        <KpiCard key={kpi.key} kpi={kpi} value={overview?.[kpi.key]} index={i} />
      ))}
    </div>
  );
}
