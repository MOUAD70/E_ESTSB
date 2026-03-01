// EvaluateurCandidates.jsx — added filière filter + sort, ALL original logic unchanged
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { services } from "@/utils/services";
import { Loader2, User, Search, ArrowRight, ChevronDown, Check } from "lucide-react";
import { AlertBanner } from "@/components/shared/global/AlertBanner";
import { Pagination } from "@/components/shared/global/Pagination";
import { useAlert } from "@/hooks/useAlert";

const PAGE_SIZE = 10;

/* ─── Sort options ─── */
const SORT_OPTIONS = [
  { value: "default", label: "Par défaut"   },
  { value: "newest",  label: "Plus anciens" },
  { value: "oldest",  label: "Plus récents" },
  { value: "az",      label: "Nom A → Z"    },
  { value: "za",      label: "Nom Z → A"    },
];

/* ─── StyledSelect — matches AdminUsers/AdminResults ─── */
function StyledSelect({
  value, onChange, options = [],
  placeholder = "Sélectionner…", className = "", disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
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
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`
                  w-full flex items-center justify-between gap-2
                  px-3 py-2 text-sm text-left cursor-pointer transition-colors duration-100
                  ${isSel ? "bg-sky-50 text-sky-700 font-medium" : "text-gray-700 hover:bg-gray-50"}
                `}
              >
                <span>{opt.label}</span>
                {isSel && <Check className="h-3.5 w-3.5 flex-shrink-0 text-sky-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Shimmer ─── */
const shimmerCSS = `
  @keyframes ec-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
`;
function Shimmer({ className = "" }) {
  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      <style>{shimmerCSS}</style>
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent"
        style={{ animation: "ec-shimmer 1.6s ease-in-out infinite" }}
      />
    </div>
  );
}

/* ─── Table row skeleton ─── */
function RowSkeleton() {
  return (
    <tr className="border-b border-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Shimmer className="h-10 w-10 rounded-full flex-shrink-0" />
          <div>
            <Shimmer className="h-3.5 w-32 rounded-md mb-2" />
            <Shimmer className="h-3 w-40 rounded" />
          </div>
        </div>
      </td>
      <td className="px-6 py-4"><Shimmer className="h-5 w-24 rounded-lg" /></td>
      <td className="px-6 py-4"><Shimmer className="h-3.5 w-36 rounded-md" /></td>
      <td className="px-6 py-4 text-center"><Shimmer className="h-8 w-20 rounded-2xl mx-auto" /></td>
    </tr>
  );
}

/* ─────────────────────────────────────────────
   Main component
   UNCHANGED: fetchRows, filtered search logic,
              pagination, navigate, all rendering
   ADDED:     filiereFilter + sortBy state,
              filiereOptions derived from data,
              both applied inside filtered useMemo
───────────────────────────────────────────── */
const EvaluateurCandidates = () => {
  const navigate = useNavigate();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const { error, setError }   = useAlert();

  /* ── Original state ── */
  const [q, setQ]       = useState("");
  const [page, setPage] = useState(1);

  /* ── New: filter + sort state ── */
  const [filiereFilter, setFiliereFilter] = useState("ALL");
  const [sortBy, setSortBy]               = useState("default");

  /* ── Unchanged fetch ── */
  const fetchRows = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await services.evaluateur.getCandidates());
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRows(); }, []);

  /* ── Derive filière options dynamically from loaded data ── */
  const filiereOptions = useMemo(() => {
    const uniq = [...new Set(rows.map((r) => r.filiere).filter(Boolean))].sort();
    return [
      { value: "ALL", label: "Toutes les filières" },
      ...uniq.map((f) => ({ value: f, label: f })),
    ];
  }, [rows]);

  /* ── Original search logic extended with filière filter + sort ── */
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = rows.filter((r) => {
      const matchSearch =
        !s ||
        `${r.nom} ${r.prenom} ${r.email} ${r.cin} ${r.cne} ${r.filiere || ""}`
          .toLowerCase()
          .includes(s);
      const matchFiliere = filiereFilter === "ALL" || r.filiere === filiereFilter;
      return matchSearch && matchFiliere;
    });

    // apply sort
    if (sortBy === "newest") list = [...list].reverse();
    // "oldest" = natural API order — no transform needed
    if (sortBy === "az")
      list = [...list].sort((a, b) =>
        `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, "fr")
      );
    if (sortBy === "za")
      list = [...list].sort((a, b) =>
        `${b.nom} ${b.prenom}`.localeCompare(`${a.nom} ${a.prenom}`, "fr")
      );

    return list;
  }, [rows, q, filiereFilter, sortBy]);

  /* ── Reset to page 1 whenever filters change ── */
  useEffect(() => { setPage(1); }, [q, filiereFilter, sortBy, rows.length]);

  /* ── Unchanged pagination ── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[#f7f8fa] px-6 py-7">

      {/* ── Page header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Candidats</h1>
          <p className="mt-0.5 text-sm text-gray-500">Liste des candidats à évaluer.</p>
        </div>
        <button
          onClick={fetchRows}
          disabled={loading}
          className={`px-4 py-2 rounded-4xl transition-colors cursor-pointer inline-flex items-center justify-center gap-2 text-sm font-medium ${
            loading
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-200 hover:bg-gray-300 text-gray-800"
          }`}
          type="button"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualiser"}
        </button>
      </div>

      <AlertBanner message={error} type="error" onDismiss={() => setError(null)} />

      {/* ── Toolbar: search + filière filter + sort ── */}
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

          {/* Filière filter — options built from live data */}
          <StyledSelect
            value={filiereFilter}
            onChange={setFiliereFilter}
            options={filiereOptions}
            placeholder="Toutes les filières"
            className="w-48"
          />

          {/* Sort */}
          <StyledSelect
            value={sortBy}
            onChange={setSortBy}
            options={SORT_OPTIONS}
            className="w-40"
          />
        </div>

        <div className="text-sm text-gray-500 flex-shrink-0">
          {loading ? "Chargement…" : `${filtered.length} candidat(s)`}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/80">
              <tr>
                {["Candidat", "Filière", "Identité", "Action"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 ${
                      i === 3 ? "text-center" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => <RowSkeleton key={i} />)
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-14 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">Aucun candidat trouvé.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((r) => (
                  <tr
                    key={r.candidat_id || r.id}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    {/* Candidat */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center ring-1 ring-gray-200">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{r.nom} {r.prenom}</p>
                          <p className="text-xs text-gray-400">{r.email || "—"}</p>
                        </div>
                      </div>
                    </td>

                    {/* Filière */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {r.filiere ? (
                        <span className="inline-flex items-center rounded-lg bg-sky-50 border border-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                          {r.filiere}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Identité */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="text-gray-400">CIN:</span>{" "}
                      <span className="font-medium text-gray-700">{r.cin || "—"}</span>
                      {" • "}
                      <span className="text-gray-400">CNE:</span>{" "}
                      <span className="font-medium text-gray-700">{r.cne || "—"}</span>
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => navigate(`/evaluateur/candidates/${r.candidat_id || r.id}`)}
                        className="items-center py-2 px-4 text-sm rounded-4xl border-0 outline-0 inline-flex justify-center gap-1.5 transition-colors duration-150 cursor-pointer bg-sky-900 hover:bg-sky-950 text-white font-medium"
                        type="button"
                      >
                        Ouvrir
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
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

export default EvaluateurCandidates;
