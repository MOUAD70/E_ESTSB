// CandidateAddDocuments.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { services } from "@/utils/services";

import { Button } from "@/components/ui/button";
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

  const loadProfile = async () => {
    setChecking(true);
    setError(null);
    setSuccess(null);
    try {
      const p = await services.candidate.getProfile();
      setProfile(p);
    } catch (err) {
      // 404 means profile doesn't exist
      if (err?.response?.status === 404) {
        setProfile(null);
      } else {
        setError(err?.response?.data?.msg || err.message || "Erreur de chargement");
      }
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const docsLocked = !!profile?.documents_submitted; // depends on your profile shape
  const hasProfile = !!profile;
  const hasSelectedProgram = !!profile?.filiere_id;

  const missingKeys = useMemo(() => {
    return REQUIRED.filter((r) => !files[r.key]).map((r) => r.key);
  }, [files]);

  const isPdf = (file) =>
    file && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));

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

    // optional: limit size (10MB)
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

    if (docsLocked) {
      setError("Documents déjà soumis. Modification non autorisée.");
      return;
    }

    if (!hasProfile) {
      setError("Profil manquant. Complétez d’abord Mon dossier.");
      return;
    }

    if (!hasSelectedProgram) {
      setError("Veuillez d’abord choisir une filière.");
      return;
    }

    if (missingKeys.length > 0) {
      setError("Veuillez joindre tous les documents requis (PDF).");
      return;
    }

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
      for (const r of REQUIRED) {
        fd.append(r.key, files[r.key]);
      }

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

  // ----------------- UI STATES -----------------

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-sky-700" />
      </div>
    );
  }

  // profile missing
  if (!hasProfile) {
    return (
      <div className="min-h-screen bg-background px-6 py-6">
        <div className="max-w-2xl mx-auto rounded-xl border bg-card shadow-sm p-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-sky-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-foreground">Profil manquant</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Vous devez compléter <span className="font-medium">Mon dossier</span> avant de déposer vos documents.
              </p>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => navigate(CANDIDATE_APPLY_ROUTE)}>Aller à Mon dossier</Button>
                <Button variant="outline" onClick={loadProfile}>Réessayer</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // program not selected yet
  if (!hasSelectedProgram) {
    return (
      <div className="min-h-screen bg-background px-6 py-6">
        <div className="max-w-2xl mx-auto rounded-xl border bg-card shadow-sm p-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-amber-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-foreground">Filière non choisie</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Vous devez d’abord choisir une filière (Programmes éligibles) avant de déposer vos documents.
              </p>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => navigate(CANDIDATE_PROGRAMS_ROUTE)}>Aller aux Programmes</Button>
                <Button variant="outline" onClick={loadProfile}>Actualiser</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // docs locked
  if (docsLocked) {
    return (
      <div className="min-h-screen bg-background px-6 py-6">
        <div className="max-w-2xl mx-auto rounded-xl border bg-card shadow-sm p-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <BadgeCheck className="h-5 w-5 text-emerald-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-foreground">Documents déjà soumis</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Vos documents ont déjà été envoyés. La modification n’est pas autorisée.
              </p>
              <div className="mt-4">
                <Button variant="outline" onClick={loadProfile}>Actualiser</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------- NORMAL FORM -----------------

  return (
    <div className="min-h-screen bg-background px-6 py-6">
      {/* Success */}
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-800 hover:text-green-900" type="button">
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
          <button onClick={() => setError(null)} className="text-red-800 hover:text-red-900" type="button">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Documents</h1>
        <p className="text-sm text-muted-foreground">
          Téléversez tous les documents requis au format PDF. (Soumission unique)
        </p>
      </div>

      {/* Card */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Pièces justificatives</h2>
            <p className="text-xs text-muted-foreground">Tous les fichiers doivent être en PDF.</p>
          </div>
          <Button variant="outline" onClick={resetFiles} type="button">
            Réinitialiser
          </Button>
        </div>

        <div className="p-6 space-y-4">
          {REQUIRED.map((r) => {
            const f = files[r.key];
            return (
              <div key={r.key} className="flex flex-col md:flex-row md:items-center gap-3 rounded-lg border p-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-10 w-10 rounded-lg bg-sky-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-sky-700" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{r.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {f ? (
                        <>
                          <span className="font-medium text-foreground">{f.name}</span>{" "}
                          <span className="text-muted-foreground">
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
                  <Input type="file" accept="application/pdf,.pdf" onChange={onPick(r.key)} />
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={loadProfile} type="button">
              Actualiser
            </Button>
            <Button onClick={openConfirm} type="button" className="inline-flex items-center">
              <UploadCloud className="h-4 w-4 mr-2" />
              Envoyer
            </Button>
          </div>
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
            className="bg-background rounded-lg shadow-lg max-w-md w-full p-6 mx-4 animate-in fade-in-0 zoom-in-95 duration-300 border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-sky-100 mb-4">
                <UploadCloud className="h-6 w-6 text-sky-700" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Confirmer l’envoi
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Voulez-vous envoyer vos documents ? <br />
                <span className="text-destructive">(Cette action est définitive.)</span>
              </p>
            </div>

            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={closeConfirm} disabled={saving}>
                Annuler
              </Button>
              <Button onClick={submit} disabled={saving}>
                {saving ? (
                  <span className="inline-flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi...
                  </span>
                ) : (
                  "Confirmer"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateAddDocuments;
