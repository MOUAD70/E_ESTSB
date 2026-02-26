import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { services } from "@/utils/services";
import { Input } from "@/components/ui/input";
import { AlertBanner } from "@/components/shared/global/AlertBanner";
import { useAlert } from "@/hooks/useAlert";
import {
  Loader2, ArrowLeft, FileText, BadgeCheck, Save, AlertCircle,
} from "lucide-react";

const BACKEND = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

const DOCS = [
  { key: "bac", label: "Bac" },
  { key: "rn_bac", label: "Relevé notes Bac" },
  { key: "diplome", label: "Diplôme" },
  { key: "rn_diplome", label: "Relevé notes Diplôme" },
  { key: "cin_file", label: "CIN" },
];

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
  if (!BACKEND) return clean.startsWith("uploads/") ? `/${clean}` : `/uploads/${clean}`;
  return clean.startsWith("uploads/") ? `${BACKEND}/${clean}` : `${BACKEND}/uploads/${clean}`;
}

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
      setError(err?.response?.data?.msg || err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRow(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

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
        await services.evaluateur.submitNote({ candidat_id: row.candidat_id, note_eval: n });
        setSuccess("Note enregistrée.");
      } else {
        await services.evaluateur.updateNote(row.candidat_id, { note_eval: n });
        setSuccess("Note mise à jour.");
      }
      await fetchRow();
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const btnSecondary = (disabled = false) =>
    `px-4 py-2 rounded-4xl transition-colors cursor-pointer inline-flex items-center justify-center ${
      disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
    }`;

  const btnPrimary = (disabled = false) =>
    `items-center py-2.5 px-4 text-[16px] rounded-4xl border-0 outline-0 inline-flex justify-center transition-colors duration-150 cursor-pointer ${
      disabled ? "bg-sky-900/70 text-white cursor-not-allowed" : "bg-sky-900 hover:bg-sky-950 text-white"
    }`;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-sky-700" />
      </div>
    );
  }

  if (!row) {
    return (
      <div className="min-h-screen bg-white px-6 py-6">
        <div className="max-w-2xl mx-auto bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-red-700">{error || "Candidat introuvable."}</h2>
              <div className="mt-4">
                <button onClick={() => navigate(-1)} className={btnSecondary(false)} type="button">
                  <ArrowLeft className="h-4 w-4 mr-2" />Retour
                </button>
              </div>
            </div>
          </div>
          <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full" style={{ width: "100%" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className={btnSecondary(false)} type="button">
          <ArrowLeft className="h-4 w-4 mr-2" />Retour
        </button>
        <button onClick={fetchRow} disabled={loading || saving} className={btnSecondary(loading || saving)} type="button">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualiser"}
        </button>
      </div>

      <AlertBanner message={success} type="success" onDismiss={() => setSuccess(null)} />
      <AlertBanner message={error} type="error" onDismiss={() => setError(null)} />

      {/* Identity card */}
      <div className="mb-5 bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex flex-col gap-1">
          <div className="text-xl font-semibold text-gray-900">{row.nom} {row.prenom}</div>
          <div className="text-sm text-gray-600">
            {row.email || "—"} • CIN: {row.cin || "—"} • CNE: {row.cne || "—"}
          </div>
          <div className="text-sm text-gray-600">
            Filière: <span className="text-gray-900 font-medium">{row.filiere_nom || "—"}</span>{" "}
            • Statut: <span className="text-gray-900 font-medium">{row.status || "—"}</span>
          </div>
          <div className="text-sm text-gray-600">
            Notes:{" "}
            {["m_s1", "m_s2", "m_s3", "m_s4"].map((k, i) => (
              <span key={k}>
                {i > 0 && " • "}
                <span className="text-gray-900 font-medium">S{i + 1}: {fmtGrade(row[k])}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-sky-500 rounded-full" style={{ width: "100%" }} />
        </div>
      </div>

      {/* Documents */}
      <div className="mb-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="text-sm font-semibold text-gray-900">Documents</div>
          <div className="text-xs text-gray-500">Pièces justificatives du candidat</div>
        </div>
        <div className="p-6 space-y-4">
          {DOCS.map((d) => {
            const has = !!row?.documents?.[d.key];
            const url = buildDocUrl(row?.documents?.[d.key]);
            return (
              <div
                key={d.key}
                className={`flex items-center justify-between rounded-xl border p-4 shadow-sm transition-all duration-200 ${
                  has ? "border-gray-100 hover:border-sky-200 hover:shadow-md" : "border-gray-100 opacity-70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-lg bg-sky-50 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-sky-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{d.label}</div>
                    <div className="text-xs text-gray-500">{has ? row.documents[d.key] : "Non fourni"}</div>
                  </div>
                </div>
                <button
                  className={btnSecondary(!has)}
                  disabled={!has}
                  type="button"
                  onClick={() => url && window.open(url, "_blank", "noopener,noreferrer")}
                  title={has ? "Ouvrir le document" : "Document manquant"}
                >
                  Voir
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Evaluation */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="text-sm font-semibold text-gray-900">Mon évaluation</div>
          <div className="text-xs text-gray-500">Saisissez une note entre 0 et 20.</div>
        </div>
        <div className="p-6">
          {row.status !== "SUBMITTED" && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 text-sm">
              Ce candidat n'est pas prêt pour évaluation (statut: {row.status}).
            </div>
          )}
          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">Note (0 à 20)</label>
              <Input
                type="number"
                step="0.01"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex: 14.5"
                className="mt-1"
              />
              <div className="text-xs text-gray-500 mt-1">
                {row.my_note == null ? "Aucune note enregistrée." : `Note actuelle: ${row.my_note}`}
              </div>
            </div>
            <button
              onClick={saveNote}
              disabled={!canSave}
              className={`${btnPrimary(!canSave)} md:w-[220px]`}
              type="button"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enregistrement...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" />{row.my_note == null ? "Enregistrer" : "Mettre à jour"}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
