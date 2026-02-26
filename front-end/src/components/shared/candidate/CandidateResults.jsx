// CandidateResults.jsx — visual polish only, ALL logic 100% unchanged
import { useEffect, useState } from "react";
import { services } from "@/utils/services";
import {
  AlertCircle, Loader2, Sparkles, Calculator, Award, RefreshCw, CalendarDays,
} from "lucide-react";
import { AlertBanner } from "@/components/shared/global/AlertBanner";
import { useAlert } from "@/hooks/useAlert";

/* ─────────────────────────────────────────────
   Design tokens — unchanged from admin pages
───────────────────────────────────────────── */
const SCORE_CARDS = [
  {
    key: "note_ai",
    label: "Score IA",
    hint: "Évaluation automatique",
    icon: Sparkles,
    gradient: "from-sky-500 to-sky-600",
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
    barColor: "bg-gradient-to-r from-sky-400 to-sky-600",
    dotColor: "bg-sky-500",
  },
  {
    key: "note_jury",
    label: "Score Jury",
    hint: "Évaluation du jury",
    icon: Calculator,
    gradient: "from-emerald-500 to-emerald-600",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    barColor: "bg-gradient-to-r from-emerald-400 to-emerald-600",
    dotColor: "bg-emerald-500",
  },
  {
    key: "note_final",
    label: "Score Final",
    hint: "Score consolidé",
    icon: Award,
    gradient: "from-violet-500 to-violet-600",
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    barColor: "bg-gradient-to-r from-violet-400 to-violet-600",
    dotColor: "bg-violet-500",
  },
];

/* ─── Shimmer infrastructure ─── */
const shimmerCSS = `
  @keyframes cr-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
`;
function Shimmer({ className = "" }) {
  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      <style>{shimmerCSS}</style>
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent"
        style={{ animation: "cr-shimmer 1.6s ease-in-out infinite" }}
      />
    </div>
  );
}

/* ─── Score card skeleton ─── */
function ScoreCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <Shimmer className="h-[3px] w-full rounded-t-2xl" />
      <div className="p-5">
        <div className="flex items-start justify-between mb-5">
          <Shimmer className="h-11 w-11 rounded-xl" />
          <Shimmer className="h-5 w-16 rounded-full" />
        </div>
        <Shimmer className="h-9 w-20 rounded-lg mb-2" />
        <Shimmer className="h-3.5 w-28 rounded-md mb-1.5" />
        <Shimmer className="h-3 w-36 rounded mb-5" />
        <Shimmer className="h-[3px] w-full rounded-full" />
      </div>
    </div>
  );
}

/* ─── Score card ─── */
function ScoreCard({ label, hint, value, icon: Icon, gradient, iconBg, iconColor, barColor, dotColor }) {
  const displayVal = typeof value === "number" ? value.toFixed(2) : "—";
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-300">
      <div className={`h-[3px] w-full bg-gradient-to-r ${gradient} rounded-t-2xl`} />
      <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${gradient} opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-[0.07]`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-5">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg} ${iconColor} ring-1 ring-white group-hover:scale-105 transition-transform duration-300`}>
            <Icon className="h-[18px] w-[18px]" />
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-100 px-2 py-1">
            <span className={`h-1.5 w-1.5 rounded-full ${dotColor} flex-shrink-0`} />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 leading-none">Score</span>
          </div>
        </div>
        <p className="text-[28px] font-bold tracking-tight text-gray-900 tabular-nums leading-none mb-2">{displayVal}</p>
        <p className="text-sm font-semibold text-gray-700 leading-snug mb-1">{label}</p>
        <p className="text-xs text-gray-400 mb-5">{hint}</p>
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-gray-100">
          <div className={`h-full rounded-full ${barColor} transition-all duration-700`} style={{ width: displayVal !== "—" ? "100%" : "0%" }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Full-page loading ─── */
function PageLoader() {
  return (
    <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-sky-600" />
        <p className="text-sm text-gray-400 font-medium">Chargement…</p>
      </div>
    </div>
  );
}

/* ─── Info card (error / no result) ─── */
function InfoCard({ icon: Icon, gradient, iconBg, iconColor, title, description, action }) {
  return (
    <div className="min-h-screen bg-[#f7f8fa] px-6 py-7 flex items-start justify-center">
      <div className="w-full max-w-lg mt-8">
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className={`h-[3px] w-full rounded-t-2xl bg-gradient-to-r ${gradient}`} />
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</p>
                {action && <div className="mt-5">{action}</div>}
              </div>
            </div>
            <div className="mt-5 h-[3px] w-full overflow-hidden rounded-full bg-gray-100">
              <div className={`h-full rounded-full bg-gradient-to-r ${gradient}`} style={{ width: "60%" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Unchanged button ─── */
const btnSecondary =
  "px-4 py-2 rounded-4xl transition-colors cursor-pointer inline-flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium";

/* ─────────────────────────────────────────────
   Main component — ALL LOGIC UNCHANGED
───────────────────────────────────────────── */
const CandidateResults = () => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const { success, error, setSuccess, setError } = useAlert();

  const loadResult = async () => {
    setLoading(true);
    setSuccess(null);
    setError(null);
    try {
      const data = await services.candidate.result();
      setResult(data);
      setSuccess("Résultat chargé.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      if (err?.response?.status === 404) setResult(null);
      else setError(err?.response?.data?.msg || err.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadResult(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Loading state */
  if (loading) return <PageLoader />;

  /* Error state */
  if (error) {
    return (
      <InfoCard
        icon={AlertCircle}
        gradient="from-red-400 to-red-600"
        iconBg="bg-red-50"
        iconColor="text-red-600"
        title="Erreur de chargement"
        description={error}
        action={
          <button onClick={loadResult} className={btnSecondary} type="button">
            <RefreshCw className="h-4 w-4" />Réessayer
          </button>
        }
      />
    );
  }

  /* No result yet */
  if (!result) {
    return (
      <InfoCard
        icon={AlertCircle}
        gradient="from-sky-400 to-sky-600"
        iconBg="bg-sky-50"
        iconColor="text-sky-600"
        title="Résultat non disponible"
        description="Votre candidature est en cours d'évaluation. Les résultats seront affichés ici dès leur publication."
        action={
          <button onClick={loadResult} className={btnSecondary} type="button">
            <RefreshCw className="h-4 w-4" />Actualiser
          </button>
        }
      />
    );
  }

  /* Result available */
  return (
    <div className="min-h-screen bg-[#f7f8fa] px-6 py-7">
      <AlertBanner message={success} type="success" onDismiss={() => setSuccess(null)} />

      <div className="max-w-5xl mx-auto space-y-7">

        {/* ── Page header ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Résultats de candidature
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Scores IA, jury et score final consolidé.
            </p>
          </div>
          <button onClick={loadResult} className={btnSecondary} type="button">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </button>
        </div>

        {/* ── Score KPI cards — unified with admin design ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SCORE_CARDS.map((card) => (
            <ScoreCard key={card.key} {...card} value={result[card.key]} />
          ))}
        </div>

        {/* ── Publication date card ── */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="h-[3px] w-full rounded-t-2xl bg-gradient-to-r from-sky-400 via-violet-400 to-violet-500" />
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Date de publication
                </p>
                <p className="text-base font-bold text-gray-900">
                  {result?.created_at
                    ? new Date(result.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "long", year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50 ring-1 ring-gray-100">
                <CalendarDays className="h-[18px] w-[18px] text-gray-400" />
              </div>
            </div>
            <div className="mt-4 h-[3px] w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-sky-400 via-violet-400 to-violet-500" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CandidateResults;
