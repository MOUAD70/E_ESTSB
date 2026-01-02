// CandidateAddDocuments.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { services } from "@/utils/services";

import { Input } from "@/components/ui/input";

import {
  BadgeCheck,
  AlertCircle,
  X,
  Loader2,
  UploadCloud,
  FileText,
  CheckCircle2,
} from "lucide-react";

// adjust these routes if needed
const CANDIDATE_APPLY_ROUTE = "/candidate/apply";
const CANDIDATE_PROGRAMS_ROUTE = "/candidate/programs";

const REQUIRED = [
  { key: "bac", label: "Bac (PDF)" },
  { key: "rn_bac", label: "Relevé notes Bac (PDF)" },
  { key: "diplome", label: "Diplôme (PDF)" },
  { key: "rn_diplome", label: "Relevé notes Diplôme (PDF)" },
  { key: "cin_file", label: "CIN (PDF)" },
];

const CandidateAddDocuments = () => {
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState(null);

  const [files, setFiles] = useState(() =>
    Object.fromEntries(REQUIRED.map((r) => [r.key, null]))
  );

  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const dismissSuccessSoon = () => setTimeout(() => setSuccess(null), 3000);

  // ✅ exact same button vibe as previous pages
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

  const loadProfile = async () => {
    setChecking(true);
    setError(null);
    setSuccess(null);
    try {
      const p = await services.candidate.getProfile();
      setProfile(p);
    } catch (err) {
      if (err?.response?.status === 404) setProfile(null);
      else
        setError(
          err?.response?.data?.msg || err.message || "Erreur de chargement"
        );
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const docsLocked = !!profile?.documents_submitted;
  const hasProfile = !!profile;
  const hasSelectedProgram = !!profile?.filiere_id;

  const missingKeys = useMemo(() => {
    return REQUIRED.filter((r) => !files[r.key]).map((r) => r.key);
  }, [files]);

  const isPdf = (file) =>
    file &&
    (file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf"));

  const onPick = (key) => (e) => {
    const f = e.target.files?.[0] || null;
    setError(null);
    setSuccess(null);

    if (!f) {
      setFiles((p) => ({ ...p, [key]: null }));
      return;
    }

    if (!isPdf(f)) {
      setFiles((p) => ({ ...p, [key]: null }));
      setError("Veuillez sélectionner uniquement des fichiers PDF.");
      return;
    }

    const max = 10 * 1024 * 1024;
    if (f.size > max) {
      setFiles((p) => ({ ...p, [key]: null }));
      setError("Le fichier est trop grand (max 10 MB).");
      return;
    }

    setFiles((p) => ({ ...p, [key]: f }));
  };

  const resetFiles = () => {
    setFiles(Object.fromEntries(REQUIRED.map((r) => [r.key, null])));
  };

  const openConfirm = () => {
    setError(null);
    setSuccess(null);

    if (docsLocked) return setError("Documents déjà soumis. Modification non autorisée.");
    if (!hasProfile) return setError("Profil manquant. Complétez d’abord Mon dossier.");
    if (!hasSelectedProgram) return setError("Veuillez d’abord choisir une filière.");
    if (missingKeys.length > 0) return setError("Veuillez joindre tous les documents requis (PDF).");

    setConfirm(true);
  };

  const closeConfirm = () => {
    if (saving) return;
    setConfirm(false);
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const fd = new FormData();
      for (const r of REQUIRED) fd.append(r.key, files[r.key]);

      const res = await services.candidate.uploadDocs(fd);

      setSuccess(res?.msg || "Documents envoyés avec succès");
      setConfirm(false);
      resetFiles();
      await loadProfile();
      dismissSuccessSoon();
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Erreur lors de l'envoi");
    } finally {
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-sky-700" />
      </div>
    );
  }

  // profile missing
  if (!hasProfile) {
    return (
      <div className="min-h-screen bg-white px-6 py-6">
        <div className="max-w-2xl mx-auto bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-lg bg-sky-50 group-hover:bg-sky-100 transition-colors flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-sky-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-gray-900">Profil manquant</h2>
              <p className="text-sm text-gray-600 mt-1">
                Vous devez compléter <span className="font-medium text-gray-900">Mon dossier</span> avant de déposer vos documents.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => navigate(CANDIDATE_APPLY_ROUTE)}
                  className={btnPrimary(false)}
                  type="button"
                >
                  Aller à Mon dossier
                </button>
                <button
                  onClick={loadProfile}
                  className={btnSecondary(false)}
                  type="button"
                >
                  Réessayer
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-sky-500 rounded-full" style={{ width: "40%" }} />
          </div>
        </div>
      </div>
    );
  }

  // program not selected yet
  if (!hasSelectedProgram) {
    return (
      <div className="min-h-screen bg-white px-6 py-6">
        <div className="max-w-2xl mx-auto bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-lg bg-amber-50 group-hover:bg-amber-100 transition-colors flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-gray-900">Filière non choisie</h2>
              <p className="text-sm text-gray-600 mt-1">
                Vous devez d’abord choisir une filière (Programmes éligibles) avant de déposer vos documents.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => navigate(CANDIDATE_PROGRAMS_ROUTE)}
                  className={btnPrimary(false)}
                  type="button"
                >
                  Aller aux Programmes
                </button>
                <button
                  onClick={loadProfile}
                  className={btnSecondary(false)}
                  type="button"
                >
                  Actualiser
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: "70%" }} />
          </div>
        </div>
      </div>
    );
  }

  // docs locked
  if (docsLocked) {
    return (
      <div className="min-h-screen bg-white px-6 py-6">
        <div className="max-w-2xl mx-auto bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 transition-colors flex items-center justify-center">
              <BadgeCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-gray-900">Documents déjà soumis</h2>
              <p className="text-sm text-gray-600 mt-1">
                Vos documents ont déjà été envoyés. La modification n’est pas autorisée.
              </p>
              <div className="mt-4">
                <button
                  onClick={loadProfile}
                  className={btnSecondary(false)}
                  type="button"
                >
                  Actualiser
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: "100%" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-6 py-6">
      {/* Success */}
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2" />
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

      {/* Error */}
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

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Documents
          </h1>
          <p className="text-sm text-gray-500">
            Téléversez tous les documents requis au format PDF. (Soumission unique)
          </p>
        </div>
        <div className="text-sm text-gray-500">{REQUIRED.length} document(s) requis</div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Pièces justificatives</h2>
            <p className="text-xs text-gray-500">Tous les fichiers doivent être en PDF.</p>
          </div>

          <button
            onClick={resetFiles}
            type="button"
            className={btnSecondary(false)}
          >
            Réinitialiser
          </button>
        </div>

        <div className="p-6 space-y-4">
          {REQUIRED.map((r) => {
            const f = files[r.key];
            const ok = !!f;

            return (
              <div
                key={r.key}
                className={`flex flex-col md:flex-row md:items-center gap-3 rounded-xl border p-4 shadow-sm transition-all duration-200 ${
                  ok
                    ? "border-emerald-100 hover:border-emerald-200 hover:shadow-md"
                    : "border-gray-100 hover:border-sky-200 hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`h-11 w-11 rounded-lg flex items-center justify-center transition-colors ${
                      ok ? "bg-emerald-50" : "bg-sky-50"
                    }`}
                  >
                    <FileText className={`h-5 w-5 ${ok ? "text-emerald-600" : "text-sky-600"}`} />
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-900">{r.label}</div>
                    <div className="text-xs text-gray-500">
                      {f ? (
                        <>
                          <span className="font-medium text-gray-900">{f.name}</span>{" "}
                          <span className="text-gray-500">
                            • {(f.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </>
                      ) : (
                        "Aucun fichier sélectionné"
                      )}
                    </div>
                  </div>
                </div>

                <div className="md:w-[340px]">
                  <Input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={onPick(r.key)}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={loadProfile}
              type="button"
              className={btnSecondary(false)}
            >
              Actualiser
            </button>

            <button
              onClick={openConfirm}
              type="button"
              className={btnPrimary(missingKeys.length > 0)}
              disabled={missingKeys.length > 0}
            >
              <UploadCloud className="h-4 w-4 mr-2" />
              Envoyer
            </button>
          </div>

          {missingKeys.length > 0 && (
            <p className="text-xs text-gray-500 text-right">
              {missingKeys.length} fichier(s) manquant(s) — veuillez tout joindre avant l’envoi.
            </p>
          )}
        </div>
      </div>

      {/* Confirm modal */}
      {confirm && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50"
          onClick={closeConfirm}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 mx-4 animate-in fade-in-0 zoom-in-95 duration-300 border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-sky-100 mb-4">
                <UploadCloud className="h-6 w-6 text-sky-700" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Confirmer l’envoi</h3>
              <p className="text-sm text-gray-600 mb-6">
                Voulez-vous envoyer vos documents ? <br />
                <span className="text-red-600">(Cette action est définitive.)</span>
              </p>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={closeConfirm}
                disabled={saving}
                type="button"
                className={btnSecondary(saving)}
              >
                Annuler
              </button>

              <button
                onClick={submit}
                disabled={saving}
                type="button"
                className={btnPrimary(saving)}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  "Confirmer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateAddDocuments;
