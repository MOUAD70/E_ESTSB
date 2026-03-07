import { useEffect, useMemo, useState, useRef } from "react";
import { services } from "@/utils/services";
import {
  Sparkles,
  Calculator,
  Award,
  Loader2,
  User,
  Search,
  ChevronDown,
  Check,
} from "lucide-react";
import { AlertBanner } from "@/components/shared/global/AlertBanner";
import { useFlash } from "@/context/FlashContext";
import { Pagination } from "@/components/shared/global/Pagination";
import { useAlert } from "@/hooks/useAlert";

const PAGE_SIZE = 10;

/* ─── Sort options ─── */
const SORT_OPTIONS = [
  { value: "default", label: "Par défaut" },
  { value: "newest", label: "Plus récents" },
  { value: "oldest", label: "Plus anciens" },
  { value: "ai_desc", label: "Score IA ↓" },
  { value: "ai_asc", label: "Score IA ↑" },
  { value: "jury_desc", label: "Score Jury ↓" },
  { value: "jury_asc", label: "Score Jury ↑" },
  { value: "final_desc", label: "Score Final ↓" },
  { value: "final_asc", label: "Score Final ↑" },
];

/* ─── StyledSelect ─── */
function StyledSelect({
  value,
  onChange,
  options = [],
  placeholder = "Sélectionner…",
  className = "",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`
          w-full flex items-center justify-between gap-2
          rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-left
          outline-none transition-all duration-150 hover:border-gray-300
          ${open ? "border-sky-400 ring-2 ring-sky-100" : ""}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <span className={selected ? "text-gray-900" : "text-gray-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[8rem] rounded-lg border border-gray-100 bg-white shadow-lg shadow-gray-200/60 py-1 animate-in fade-in-0 zoom-in-95 duration-100">
          {options.map((opt) => {
            const isSel = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left cursor-pointer transition-colors duration-100 ${isSel ? "bg-sky-50 text-sky-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
              >
                <span>{opt.label}</span>
                {isSel && (
                  <Check className="h-3.5 w-3.5 flex-shrink-0 text-sky-600" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Shared shimmer style ─── */
const shimmerStyle = `
  @keyframes ar-shimmer {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
`;

function ShimmerBlock({ className = "" }) {
  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent"
        style={{ animation: "ar-shimmer 1.6s ease-in-out infinite" }}
      />
    </div>
  );
}

/* ─── Unified score KPI card (matches AdminKpiCards aesthetic exactly) ─── */
function ScoreCard({
  label,
  value,
  icon: Icon,
  gradient,
  iconBg,
  iconColor,
  barColor,
  dotColor,
  loading,
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-300">
      <style>{shimmerStyle}</style>
      <div
        className={`h-[3px] w-full bg-gradient-to-r ${gradient} rounded-t-2xl`}
      />
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${gradient} opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-[0.07]`}
      />
      <div className="p-5">
        <div className="flex items-start justify-between mb-5">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg} ${iconColor} ring-1 ring-white group-hover:scale-105 transition-transform duration-300`}
          >
            <Icon className="h-[18px] w-[18px]" />
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-100 px-2 py-1">
            <span
              className={`h-1.5 w-1.5 rounded-full ${dotColor} animate-pulse flex-shrink-0`}
            />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 leading-none">
              Moy.
            </span>
          </div>
        </div>
        {loading ? (
          <ShimmerBlock className="h-9 w-20 rounded-lg mb-2" />
        ) : (
          <p className="text-[28px] font-bold tracking-tight text-gray-900 tabular-nums leading-none mb-2">
            {value}
          </p>
        )}
        <p className="text-sm font-semibold text-gray-700 leading-snug mb-5">
          {label}
        </p>
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full ${barColor} transition-all duration-700`}
            style={{ width: loading ? "0%" : "100%" }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Score card skeleton ─── */
function ScoreCardSkeleton() {
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
        <ShimmerBlock className="h-3.5 w-28 rounded-md mb-5" />
        <ShimmerBlock className="h-[3px] w-full rounded-full" />
      </div>
    </div>
  );
}

/* ─── Main component — ALL logic unchanged ─── */
const AdminResults = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const { success, error, setSuccess, setError } = useAlert();
  const { flash } = useFlash();

  const [q, setQ] = useState("");
  const [filiereFilter, setFiliereFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("default");
  const [page, setPage] = useState(1);

  const [aiRunning, setAiRunning] = useState(false);
  const [finalRunning, setFinalRunning] = useState(false);

  const loadResults = async () => {
    setLoading(true);
    try {
      setRows(await services.admin.getFinalScores());
    } catch (err) {
      setError(
        err?.response?.data?.msg || err.message || "Erreur de chargement",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, []);

  const filieres = useMemo(() => {
    const uniq = [
      ...new Set(rows.map((r) => r.filiere).filter(Boolean)),
    ].sort();
    return uniq;
  }, [rows]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = rows.filter((r) => {
      const matchFiliere =
        filiereFilter === "ALL" || r.filiere === filiereFilter;
      if (!matchFiliere) return false;
      if (!s) return true;
      return `${r.nom} ${r.prenom} ${r.email} ${r.cin} ${r.cne} ${r.filiere || ""}`
        .toLowerCase()
        .includes(s);
    });

    // Sort
    if (sortBy === "newest") list = [...list].reverse();
    // "oldest" = natural API order
    if (sortBy === "ai_desc")
      list = [...list].sort((a, b) => (b.note_ai ?? -1) - (a.note_ai ?? -1));
    if (sortBy === "ai_asc")
      list = [...list].sort(
        (a, b) => (a.note_ai ?? 9999) - (b.note_ai ?? 9999),
      );
    if (sortBy === "jury_desc")
      list = [...list].sort(
        (a, b) => (b.note_jury ?? -1) - (a.note_jury ?? -1),
      );
    if (sortBy === "jury_asc")
      list = [...list].sort(
        (a, b) => (a.note_jury ?? 9999) - (b.note_jury ?? 9999),
      );
    if (sortBy === "final_desc")
      list = [...list].sort(
        (a, b) => (b.note_final ?? -1) - (a.note_final ?? -1),
      );
    if (sortBy === "final_asc")
      list = [...list].sort(
        (a, b) => (a.note_final ?? 9999) - (b.note_final ?? 9999),
      );

    return list;
  }, [rows, q, filiereFilter, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [q, filiereFilter, sortBy, rows.length]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const stats = useMemo(() => {
    if (!rows.length) return { avgAI: null, avgJury: null, avgFinal: null };
    const avg = (key) => {
      const vals = rows.map((r) => r[key]).filter((v) => v != null);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    return {
      avgAI: avg("note_ai"),
      avgJury: avg("note_jury"),
      avgFinal: avg("note_final"),
    };
  }, [rows]);

  /* buttons unchanged */
  const btnPrimary = (disabled = false) =>
    `items-center py-2 px-4 text-sm rounded-4xl border-0 outline-0 inline-flex justify-center gap-2 transition-colors duration-150 cursor-pointer ${
      disabled
        ? "bg-sky-900/70 text-white cursor-not-allowed"
        : "bg-sky-900 hover:bg-sky-950 text-white"
    }`;

  const btnSecondary = (disabled = false) =>
    `px-4 py-2 rounded-4xl transition-colors cursor-pointer inline-flex items-center justify-center ${
      disabled
        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
        : "bg-gray-200 hover:bg-gray-300 text-gray-800"
    }`;

  const runAiScore = async () => {
    setAiRunning(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await services.admin.runAiScoring();
      const successMsg = res?.msg || "Scoring IA terminé.";
      setSuccess(successMsg);
      flash(successMsg, "success");
      await loadResults();
    } catch (err) {
      const errorMsg = err?.response?.data?.msg || err.message || "Erreur scoring IA";
      setError(errorMsg);
      flash(errorMsg, "error");
    } finally {
      setAiRunning(false);
    }
  };

  const runFinalScore = async () => {
    setFinalRunning(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await services.admin.computeFinalScores();
      const successMsg = res?.msg || "Scores finaux calculés.";
      setSuccess(successMsg);
      flash(successMsg, "success");
      await loadResults();
    } catch (err) {
      const errorMsg = err?.response?.data?.msg || err.message || "Erreur scores finaux";
      setError(errorMsg);
      flash(errorMsg, "error");
    } finally {
      setFinalRunning(false);
    }
  };

  const fmt = (v) => (v != null ? Number(v).toFixed(2) : "—");

  const scoreCards = [
    {
      label: "Score IA moyen",
      value: fmt(stats.avgAI),
      icon: Sparkles,
      gradient: "from-sky-500 to-sky-600",
      iconBg: "bg-sky-50",
      iconColor: "text-sky-600",
      barColor: "bg-gradient-to-r from-sky-400 to-sky-600",
      dotColor: "bg-sky-500",
    },
    {
      label: "Score Jury moyen",
      value: fmt(stats.avgJury),
      icon: Calculator,
      gradient: "from-emerald-500 to-emerald-600",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      barColor: "bg-gradient-to-r from-emerald-400 to-emerald-600",
      dotColor: "bg-emerald-500",
    },
    {
      label: "Score Final moyen",
      value: fmt(stats.avgFinal),
      icon: Award,
      gradient: "from-violet-500 to-violet-600",
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
      barColor: "bg-gradient-to-r from-violet-400 to-violet-600",
      dotColor: "bg-violet-500",
    },
  ];

  const filiereOptions = [
    { value: "ALL", label: "Toutes les filières" },
    ...filieres.map((f) => ({ value: f, label: f })),
  ];

  return (
    <div className="min-h-screen bg-[#f7f8fa] px-6 py-7">
      <AlertBanner
        message={success}
        type="success"
        onDismiss={() => setSuccess(null)}
      />
      <AlertBanner
        message={error}
        type="error"
        onDismiss={() => setError(null)}
      />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Résultats
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Scoring IA, jury et scores finaux.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            onClick={loadResults}
            disabled={loading}
            className={btnSecondary(loading)}
            type="button"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Actualiser"
            )}
          </button>
          <button
            onClick={runAiScore}
            disabled={aiRunning || finalRunning}
            className={btnPrimary(aiRunning || finalRunning)}
            type="button"
          >
            {aiRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Calcul IA...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Scoring IA
              </>
            )}
          </button>
          <button
            onClick={runFinalScore}
            disabled={finalRunning || aiRunning}
            className={btnPrimary(finalRunning || aiRunning)}
            type="button"
          >
            {finalRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Calcul...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4" />
                Scores finaux
              </>
            )}
          </button>
        </div>
      </div>

      {/* Score KPI cards — unified with AdminKpiCards design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
        {loading
          ? [1, 2, 3].map((i) => <ScoreCardSkeleton key={i} />)
          : scoreCards.map((card) => (
              <ScoreCard key={card.label} {...card} loading={loading} />
            ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex flex-wrap gap-2 w-full sm:max-w-2xl">
          {/* Search */}
          <div className="relative flex-1 min-w-[160px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher (nom, email, CIN, CNE...)"
              className="w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-sky-100 focus:border-sky-400 placeholder:text-gray-400"
            />
          </div>

          {/* Filière filter */}
          <StyledSelect
            value={filiereFilter}
            onChange={setFiliereFilter}
            options={filiereOptions}
            className="w-48"
          />

          {/* Sort */}
          <StyledSelect
            value={sortBy}
            onChange={setSortBy}
            options={SORT_OPTIONS}
            className="w-44"
          />
        </div>
        <div className="text-sm text-gray-500 flex-shrink-0">
          {loading ? "Chargement..." : `${filtered.length} candidat(s)`}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/80">
              <tr>
                {[
                  "Candidat",
                  "Identité",
                  "Filière",
                  "Score IA",
                  "Score Jury",
                  "Score Final",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10">
                    <div className="h-32 rounded-xl bg-gray-100 animate-pulse" />
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                        <Award className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">
                        Aucun résultat trouvé.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((r) => (
                  <tr
                    key={r.candidat_id}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-9 w-9 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center ring-1 ring-gray-200">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-semibold text-gray-900">
                            {r.nom} {r.prenom}
                          </div>
                          <div className="text-xs text-gray-400">
                            {r.email || "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      CIN: {r.cin || "—"} • CNE: {r.cne || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {r.filiere ? (
                        <span className="inline-flex items-center rounded-lg bg-sky-50 border border-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                          {r.filiere}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-sky-700 tabular-nums">
                      {fmt(r.note_ai)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-700 tabular-nums">
                      {fmt(r.note_jury)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-violet-700 tabular-nums">
                      {fmt(r.note_final)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={safePage}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      />
    </div>
  );
};

export default AdminResults;
