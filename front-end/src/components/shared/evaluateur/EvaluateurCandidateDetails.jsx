import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { services } from "@/utils/services";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  FileText,
  BadgeCheck,
  Save,
  X,
} from "lucide-react";

const DOCS = [
  { key: "bac", label: "Bac" },
  { key: "rn_bac", label: "Relevé notes Bac" },
  { key: "diplome", label: "Diplôme" },
  { key: "rn_diplome", label: "Relevé notes Diplôme" },
  { key: "cin_file", label: "CIN" },
];

export default function EvaluateurCandidateDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);

  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const BACKEND = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

  const btnPrimary = (disabled = false) =>
    `items-center py-2.5 px-4 text-[16px] rounded-4xl border-0 outline-0 inline-flex justify-center align-center transition-colors duration-150 cursor-pointer ${
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

  const getDocUrl = (docKey) => {
    const raw = row?.documents?.[docKey];
    if (!raw) return null;

    if (/^https?:\/\//i.test(raw)) return raw;

    const clean = String(raw).replace(/^\/+/, ""); // cand_12/bac.pdf or uploads/cand_12/bac.pdf

    if (!BACKEND) {
      return clean.startsWith("uploads/") ? `/${clean}` : `/uploads/${clean}`;
    }

    if (clean.startsWith("uploads/")) {
      return `${BACKEND}/${clean}`;
    }

    return `${BACKEND}/uploads/${clean}`;
  };

  const openDoc = (docKey) => {
    const url = getDocUrl(docKey);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const fetchRow = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

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

  useEffect(() => {
    fetchRow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const canSave = useMemo(() => {
    if (saving) return false;
    if (!row) return false;
    if (!String(note).trim()) return false;

    const n = Number(note);
    if (Number.isNaN(n)) return false;
    if (n < 0 || n > 20) return false;
    if (row.status !== "SUBMITTED") return false;

    return true;
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
      setError(err?.response?.data?.msg || err.message || "Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  };

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
        <div className="max-w-2xl mx-auto bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-lg bg-red-50 group-hover:bg-red-100 transition-colors flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-red-700">
                {error || "Candidat introuvable."}
              </h2>
              <div className="mt-4">
                <button onClick={() => navigate(-1)} className={btnSecondary(false)} type="button">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
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
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </button>

        <button
          onClick={fetchRow}
          disabled={loading || saving}
          className={btnSecondary(loading || saving)}
          type="button"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualiser"}
        </button>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <BadgeCheck className="h-5 w-5 mr-2" />
            <span>{success}</span>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="text-green-800 hover:text-green-900 cursor-pointer"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-800 hover:text-red-900 cursor-pointer"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mb-5 bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex flex-col gap-1">
          <div className="text-xl font-semibold text-gray-900">
            {row.nom} {row.prenom}
          </div>
          <div className="text-sm text-gray-600">
            {row.email || "—"} • CIN: {row.cin || "—"} • CNE: {row.cne || "—"}
          </div>
          <div className="text-sm text-gray-600">
            Filière:{" "}
            <span className="text-gray-900 font-medium">{row.filiere_nom || "—"}</span>{" "}
            • Statut:{" "}
            <span className="text-gray-900 font-medium">{row.status || "—"}</span>
          </div>
        </div>

        <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-sky-500 rounded-full" style={{ width: "100%" }} />
        </div>
      </div>

      <div className="mb-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="text-sm font-semibold text-gray-900">Documents</div>
          <div className="text-xs text-gray-500">
            Ouverture depuis /uploads/... (Flask)
          </div>
        </div>

        <div className="p-6 space-y-4">
          {DOCS.map((d) => {
            const path = row?.documents?.[d.key];
            const has = !!path;

            return (
              <div
                key={d.key}
                className={`flex items-center justify-between rounded-xl border p-4 shadow-sm transition-all duration-200 ${
                  has
                    ? "border-gray-100 hover:border-sky-200 hover:shadow-md"
                    : "border-gray-100 opacity-80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-lg bg-sky-50 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-sky-600" />
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-900">{d.label}</div>
                    <div className="text-xs text-gray-500">{path ? path : "Non fourni"}</div>
                  </div>
                </div>

                <button
                  className={btnSecondary(!has)}
                  disabled={!has}
                  type="button"
                  onClick={() => openDoc(d.key)}
                  title={has ? "Ouvrir le document" : "Document manquant"}
                >
                  Voir
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="text-sm font-semibold text-gray-900">Mon évaluation</div>
          <div className="text-xs text-gray-500">Saisissez une note entre 0 et 20.</div>
        </div>

        <div className="p-6">
          {row.status !== "SUBMITTED" && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100">
              Ce candidat n’est pas prêt pour évaluation (statut: {row.status}).
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
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {row.my_note == null ? "Enregistrer" : "Mettre à jour"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
