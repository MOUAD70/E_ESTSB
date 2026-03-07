import { useEffect, useState } from "react";
import { BadgeCheck, AlertCircle, X } from "lucide-react";

import { AdminKpiCards } from "@/components/shared/admin/AdminKpiCards";
import { ChartBarLabel } from "@/components/ui/charts/BarChart";
import { BarChartAiFinal } from "@/components/ui/charts/GroupedBarChart";
import { services } from "@/utils/services";

/* ─── Shared shimmer keyframes ─── */
const shimmerStyle = `
  @keyframes dash-shimmer {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
`;

/* ─── Shimmer block ─── */
function ShimmerBlock({ className = "", style = {} }) {
  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`} style={style}>
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent"
        style={{ animation: "dash-shimmer 1.6s ease-in-out infinite" }}
      />
    </div>
  );
}

/* ─── Chart skeleton ─── */
function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <style>{shimmerStyle}</style>
      {/* title area */}
      <div className="space-y-2">
        <ShimmerBlock className="h-4 w-44 rounded-md" />
        <ShimmerBlock className="h-3 w-60 rounded" />
      </div>
      {/* bar columns — responsive aspect ratio via padding trick */}
      <div className="w-full" style={{ aspectRatio: "16/7", minHeight: 160 }}>
        <div className="flex h-full items-end gap-2 pt-4">
          {[55, 80, 45, 70, 60, 88, 40, 65].map((h, i) => (
            <div
              key={i}
              className="flex-1 relative overflow-hidden rounded-t-md bg-gray-100"
              style={{
                height: `${h}%`,
                animation: `dash-shimmer 1.6s ease-in-out infinite ${i * 0.07}s`,
              }}
            >
              <div
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent"
                style={{ animation: `dash-shimmer 1.6s ease-in-out infinite ${i * 0.07}s` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── KPI skeleton (mirrors exact AdminKpiCards card structure) ─── */
function KpiSkeletonRow() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-7">
      <style>{shimmerStyle}</style>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
        >
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
      ))}
    </div>
  );
}

/* ─── Alert banner ─── */
function AlertBanner({ message, type, onDismiss }) {
  if (!message) return null;
  const ok = type === "success";
  return (
    <div
      className={`mb-5 flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium border shadow-sm ${
        ok
          ? "bg-emerald-50 text-emerald-800 border-emerald-100"
          : "bg-red-50 text-red-800 border-red-100"
      }`}
    >
      <div className="flex items-center gap-2">
        {ok
          ? <BadgeCheck className="h-4 w-4 flex-shrink-0" />
          : <AlertCircle className="h-4 w-4 flex-shrink-0" />
        }
        <span>{message}</span>
      </div>
      <button
        onClick={onDismiss}
        type="button"
        className="ml-4 opacity-50 hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ─── Main component — ALL logic unchanged ─── */
const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [filieres, setFilieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [ov, fil] = await Promise.all([
          services.admin.getOverview(),
          services.admin.getFilieresStats(),
        ]);
        setOverview(ov);
        setFilieres(fil);
        setSuccess(null);
      } catch (err) {
        setError(err?.response?.data?.msg || err.message || "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f8fa] px-6 py-7">
      <AlertBanner message={success} type="success" onDismiss={() => setSuccess(null)} />
      <AlertBanner message={error}   type="error"   onDismiss={() => setError(null)}   />

      {/* Page header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tableau de bord</h1>
        <p className="mt-0.5 text-sm text-gray-500">Vue d'ensemble des candidatures et évaluations.</p>
      </div>

      {/* KPI Cards */}
      {loading ? <KpiSkeletonRow /> : (
        <div className="mb-7">
          <AdminKpiCards overview={overview} loading={loading} />
        </div>
      )}

      {/* Charts row — fully responsive */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Chart 1 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
          {loading ? <ChartSkeleton /> : (
            /* Responsive wrapper: constrains chart height and prevents overflow */
            <div className="w-full min-w-0">
              <ChartBarLabel
                data={filieres}
                title="Candidatures par filière"
                description="Nombre de candidatures soumises"
              />
            </div>
          )}
        </div>

        {/* Chart 2 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
          {loading ? <ChartSkeleton /> : (
            <div className="w-full min-w-0">
              <BarChartAiFinal data={filieres} loading={loading} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
