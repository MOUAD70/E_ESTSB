// EvaluateurCandidateDetails.jsx — visual polish only, ALL logic 100% unchanged
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { services } from "@/utils/services";
import { Input } from "@/components/ui/input";
import { AlertBanner } from "@/components/shared/global/AlertBanner";
import { useAlert } from "@/hooks/useAlert";
import {
  Loader2,
  ArrowLeft,
  FileText,
  Save,
  AlertCircle,
  CheckCircle2,
  User,
  GraduationCap,
  BookOpen,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Logic constants — 100% UNCHANGED
───────────────────────────────────────────── */
const BACKEND = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

const DOCS = [
  { key: "bac", label: "Bac", hint: "Certificat de baccalauréat" },
  {
    key: "rn_bac",
    label: "Relevé notes Bac",
    hint: "Relevé officiel des notes du Bac",
  },
  { key: "diplome", label: "Diplôme", hint: "Diplôme obtenu (DTS, DUT, BTS…)" },
  {
    key: "rn_diplome",
    label: "Relevé notes Diplôme",
    hint: "Relevé officiel du diplôme",
  },
  { key: "cin_file", label: "CIN", hint: "Carte nationale d'identité" },
];

/* ─── Unchanged helpers ─── */
function fmtGrade(v) {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.00$/, "");
}

function buildDocUrl(raw) {
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const clean = String(raw).replace(/^\/+/, "");
  if (!BACKEND)
    return clean.startsWith("uploads/") ? `/${clean}` : `/uploads/${clean}`;
  return clean.startsWith("uploads/")
    ? `${BACKEND}/${clean}`
    : `${BACKEND}/uploads/${clean}`;
}

/* ─── Shimmer ─── */
const shimmerCSS = `
  @keyframes ecd-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
`;
function Shimmer({ className = "" }) {
  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      <style>{shimmerCSS}</style>
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent"
        style={{ animation: "ecd-shimmer 1.6s ease-in-out infinite" }}
      />
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

/* ─── Section card wrapper ─── */
function SectionCard({
  accentGradient = "from-sky-400 to-sky-600",
  headerTitle,
  headerSub,
  children,
  className = "",
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}
    >
      <div className={`h-[3px] w-full bg-gradient-to-r ${accentGradient}`} />
      {(headerTitle || headerSub) && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
          {headerTitle && (
            <p className="text-sm font-bold text-gray-900">{headerTitle}</p>
          )}
          {headerSub && (
            <p className="text-xs text-gray-400 mt-0.5">{headerSub}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

/* ─── Semestre grade chip ─── */
function GradeChip({ label, value }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 min-w-[60px]">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
        {label}
      </span>
      <span className="text-base font-bold text-gray-900 tabular-nums">
        {value}
      </span>
    </div>
  );
}

/* ─── Unchanged button helpers ─── */
const btnSecondary = (disabled = false) =>
  `px-4 py-2 rounded-4xl transition-colors cursor-pointer inline-flex items-center justify-center gap-2 text-sm font-medium ${
    disabled
      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
      : "bg-gray-200 hover:bg-gray-300 text-gray-800"
  }`;

const btnPrimary = (disabled = false) =>
  `items-center py-2.5 px-5 text-sm font-semibold rounded-4xl border-0 outline-0 inline-flex justify-center gap-2 transition-colors duration-150 cursor-pointer ${
    disabled
      ? "bg-sky-900/70 text-white cursor-not-allowed"
      : "bg-sky-900 hover:bg-sky-950 text-white"
  }`;

/* ─────────────────────────────────────────────
   Main component — ALL LOGIC UNCHANGED
───────────────────────────────────────────── */
export default function EvaluateurCandidateDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const { success, error, setSuccess, setError } = useAlert();

  const fetchRow = async () => {
    setLoading(true);
    setSuccess(null);
    setError(null);
    try {
      const data = await services.evaluateur.getCandidate(id);
      setRow(data);
      setNote(typeof data?.my_note === "number" ? String(data.my_note) : "");
    } catch (err) {
      setError(
        err?.response?.data?.msg || err.message || "Erreur de chargement",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRow();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const canSave = useMemo(() => {
    if (saving || !row || !String(note).trim()) return false;
    const n = Number(note);
    return !Number.isNaN(n) && n >= 0 && n <= 20 && row.status === "SUBMITTED";
  }, [saving, row, note]);

  const saveNote = async () => {
    setError(null);
    setSuccess(null);
    const n = Number(note);
    if (Number.isNaN(n) || n < 0 || n > 20) {
      setError("La note doit être un nombre entre 0 et 20.");
      return;
    }
    setSaving(true);
    try {
      if (row?.my_note == null) {
        await services.evaluateur.submitNote({
          candidat_id: row.candidat_id,
          note_eval: n,
        });
        setSuccess("Note enregistrée.");
      } else {
        await services.evaluateur.updateNote(row.candidat_id, { note_eval: n });
        setSuccess("Note mise à jour.");
      }
      await fetchRow();
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      setError(
        err?.response?.data?.msg || err.message || "Erreur d'enregistrement",
      );
    } finally {
      setSaving(false);
    }
  };

  /* ── Loading state ── */
  if (loading) return <PageLoader />;

  /* ── Error / not found state ── */
  if (!row) {
    return (
      <div className="min-h-screen bg-[#f7f8fa] px-6 py-7 flex items-start justify-center">
        <div className="w-full max-w-lg mt-8">
          <SectionCard accentGradient="from-red-400 to-red-600">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-red-50">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-bold text-gray-900">
                    Candidat introuvable
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {error ||
                      "Ce candidat n'existe pas ou n'est plus disponible."}
                  </p>
                  <div className="mt-5">
                    <button
                      onClick={() => navigate(-1)}
                      className={btnSecondary(false)}
                      type="button"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Retour
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    );
  }

  const isSubmitted = row.status === "SUBMITTED";
  const hasNote = row.my_note != null;

  return (
    <div className="min-h-screen bg-[#f7f8fa] px-6 py-7">
      {/* ── Top nav ── */}
      <div className="flex items-center justify-between mb-7">
        <button
          onClick={() => navigate(-1)}
          className={btnSecondary(false)}
          type="button"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <button
          onClick={fetchRow}
          disabled={loading || saving}
          className={btnSecondary(loading || saving)}
          type="button"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Actualiser"
          )}
        </button>
      </div>

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

      <div className="space-y-5">
        {/* ── 1. Identity card ── */}
        <SectionCard accentGradient="from-sky-400 to-sky-600">
          <div className="p-6">
            <div className="flex items-start gap-4">
              {/* avatar */}
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-sky-50 ring-1 ring-sky-100">
                <User className="h-6 w-6 text-sky-600" />
              </div>

              {/* info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold tracking-tight text-gray-900">
                  {row.nom} {row.prenom}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {row.email || "—"}
                </p>

                {/* badges row */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {/* Filière */}
                  {row.filiere_nom && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-sky-50 border border-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                      <GraduationCap className="h-3.5 w-3.5" />
                      {row.filiere_nom}
                    </span>
                  )}
                  {/* Statut */}
                  <span
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                      isSubmitted
                        ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                        : "bg-gray-50 border-gray-200 text-gray-600"
                    }`}
                  >
                    {isSubmitted ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5" />
                    )}
                    {row.status || "—"}
                  </span>
                  {/* CIN */}
                  <span className="inline-flex items-center rounded-lg bg-gray-50 border border-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                    CIN:{" "}
                    <span className="font-semibold text-gray-900 ml-1">
                      {row.cin || "—"}
                    </span>
                  </span>
                  {/* CNE */}
                  <span className="inline-flex items-center rounded-lg bg-gray-50 border border-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                    CNE:{" "}
                    <span className="font-semibold text-gray-900 ml-1">
                      {row.cne || "—"}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Semestre grades */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Notes par semestre
              </p>
              <div className="flex flex-wrap gap-2">
                {["m_s1", "m_s2", "m_s3", "m_s4"].map((k, i) => (
                  <GradeChip
                    key={k}
                    label={`S${i + 1}`}
                    value={fmtGrade(row[k])}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 h-[3px] w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600" />
            </div>
          </div>
        </SectionCard>

        {/* ── 2. Documents card ── */}
        <SectionCard
          accentGradient="from-indigo-400 to-indigo-600"
          headerTitle="Documents"
          headerSub="Pièces justificatives du candidat"
        >
          <div className="p-6 space-y-3">
            {DOCS.map((d) => {
              const has = !!row?.documents?.[d.key];
              const url = buildDocUrl(row?.documents?.[d.key]);
              return (
                <div
                  key={d.key}
                  className={`
                    flex items-center justify-between rounded-xl border p-4
                    transition-all duration-200
                    ${
                      has
                        ? "border-gray-100 bg-white hover:border-indigo-200 hover:shadow-sm"
                        : "border-gray-100 bg-gray-50/60 opacity-60"
                    }
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-11 w-11 flex-shrink-0 flex items-center justify-center rounded-xl ${has ? "bg-indigo-50" : "bg-gray-100"}`}
                    >
                      {has ? (
                        <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                      ) : (
                        <FileText className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {d.label}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {has ? row.documents[d.key] : d.hint}
                      </p>
                    </div>
                  </div>
                  <button
                    className={btnSecondary(!has)}
                    disabled={!has}
                    type="button"
                    onClick={() =>
                      url && window.open(url, "_blank", "noopener,noreferrer")
                    }
                    title={has ? "Ouvrir le document" : "Document manquant"}
                  >
                    Voir
                  </button>
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* ── 3. Evaluation card ── */}
        <SectionCard
          accentGradient={
            isSubmitted
              ? "from-emerald-400 to-emerald-600"
              : "from-gray-300 to-gray-400"
          }
          headerTitle="Mon évaluation"
          headerSub="Saisissez une note entre 0 et 20."
        >
          <div className="p-6">
            {/* Not-submitted warning */}
            {!isSubmitted && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Ce candidat n'est pas encore prêt pour l'évaluation.{" "}
                  <span className="font-semibold">
                    Statut actuel : {row.status}
                  </span>
                </p>
              </div>
            )}

            {/* Current note badge */}
            {hasNote && (
              <div className="mb-5 inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-800">
                  Note actuelle :{" "}
                  <span className="text-xl font-bold tabular-nums">
                    {row.my_note}
                  </span>
                  <span className="text-emerald-600 font-normal"> / 20</span>
                </span>
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                  Note (0 à 20)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex : 14.5"
                  className="mt-0"
                />
                {!hasNote && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    Aucune note encore enregistrée pour ce candidat.
                  </p>
                )}
              </div>

              <button
                onClick={saveNote}
                disabled={!canSave}
                className={`${btnPrimary(!canSave)} md:w-[220px] flex-shrink-0`}
                type="button"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enregistrement…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {hasNote ? "Mettre à jour" : "Enregistrer"}
                  </>
                )}
              </button>
            </div>

            {/* Grade progress indicator */}
            <div className="mt-5 h-[3px] w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  canSave || hasNote
                    ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                    : "bg-gray-200"
                }`}
                style={{
                  width: (() => {
                    const n = Number(note);
                    if (!Number.isNaN(n) && n >= 0 && n <= 20)
                      return `${(n / 20) * 100}%`;
                    if (hasNote) return `${(row.my_note / 20) * 100}%`;
                    return "0%";
                  })(),
                }}
              />
            </div>
            {(canSave || hasNote) && (
              <p className="text-xs text-gray-400 mt-1.5 text-right tabular-nums">
                {(() => {
                  const n = Number(note);
                  if (!Number.isNaN(n) && n >= 0 && n <= 20)
                    return `${n.toFixed(2)} / 20`;
                  return "";
                })()}
              </p>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
