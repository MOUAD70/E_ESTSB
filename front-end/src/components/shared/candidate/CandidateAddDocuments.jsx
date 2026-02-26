// CandidateAddDocuments.jsx — visual polish only, ALL logic 100% unchanged
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { services } from "@/utils/services";
import { Input } from "@/components/ui/input";
import { AlertBanner } from "@/components/shared/global/AlertBanner";
import { useAlert } from "@/hooks/useAlert";
import {
  BadgeCheck,
  AlertCircle,
  Loader2,
  UploadCloud,
  FileText,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Logic constants — 100% UNCHANGED
───────────────────────────────────────────── */
const CANDIDATE_APPLY_ROUTE = "/candidate/apply";
const CANDIDATE_PROGRAMS_ROUTE = "/candidate/programs";

const REQUIRED = [
  { key: "bac", label: "Bac", hint: "Certificat de baccalauréat" },
  {
    key: "rn_bac",
    label: "Relevé de notes Bac",
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

const MAX_FILE_SIZE = 10 * 1024 * 1024;

/* ─── Unchanged button helpers ─── */
const btnPrimary = (disabled = false) =>
  `items-center py-2.5 px-5 text-sm font-semibold rounded-4xl border-0 outline-0 inline-flex justify-center gap-2 transition-colors duration-150 cursor-pointer ${
    disabled
      ? "bg-sky-900/70 text-white cursor-not-allowed"
      : "bg-sky-900 hover:bg-sky-950 text-white"
  }`;

const btnSecondary = (disabled = false) =>
  `px-4 py-2 rounded-4xl transition-colors cursor-pointer inline-flex items-center justify-center gap-2 text-sm font-medium ${
    disabled
      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
      : "bg-gray-200 hover:bg-gray-300 text-gray-800"
  }`;

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

/* ─── Info/state card (locked, missing profile, etc.) ─── */
function StateCard({
  icon: Icon,
  gradient,
  iconBg,
  iconColor,
  title,
  description,
  actions,
}) {
  return (
    <div className="min-h-screen bg-[#f7f8fa] px-6 py-7 flex items-start justify-center">
      <div className="w-full max-w-lg mt-8">
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
          <div
            className={`h-[3px] w-full rounded-t-2xl bg-gradient-to-r ${gradient}`}
          />
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${iconBg}`}
              >
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  {description}
                </p>
                {actions && (
                  <div className="mt-5 flex flex-wrap gap-2">{actions}</div>
                )}
              </div>
            </div>
            <div className="mt-5 h-[3px] w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main component — ALL LOGIC UNCHANGED
───────────────────────────────────────────── */
const CandidateAddDocuments = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState(null);
  const [files, setFiles] = useState(() =>
    Object.fromEntries(REQUIRED.map((r) => [r.key, null])),
  );
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const { success, error, setSuccess, setError, clearAll } = useAlert();

  const loadProfile = async () => {
    setChecking(true);
    clearAll();
    try {
      setProfile(await services.candidate.getProfile());
    } catch (err) {
      if (err?.response?.status === 404) setProfile(null);
      else
        setError(
          err?.response?.data?.msg || err.message || "Erreur de chargement",
        );
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const docsLocked = !!profile?.documents_submitted;
  const hasProfile = !!profile;
  const hasSelectedProgram = !!profile?.filiere_id;

  const missingKeys = useMemo(
    () => REQUIRED.filter((r) => !files[r.key]).map((r) => r.key),
    [files],
  );

  const onPick = (key) => (e) => {
    const f = e.target.files?.[0] || null;
    setError(null);
    setSuccess(null);
    if (!f) {
      setFiles((p) => ({ ...p, [key]: null }));
      return;
    }
    if (
      !(f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))
    ) {
      setFiles((p) => ({ ...p, [key]: null }));
      setError("Veuillez sélectionner uniquement des fichiers PDF.");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setFiles((p) => ({ ...p, [key]: null }));
      setError("Le fichier est trop grand (max 10 MB).");
      return;
    }
    setFiles((p) => ({ ...p, [key]: f }));
  };

  const resetFiles = () =>
    setFiles(Object.fromEntries(REQUIRED.map((r) => [r.key, null])));

  const openConfirm = () => {
    clearAll();
    if (docsLocked) {
      setError("Documents déjà soumis. Modification non autorisée.");
      return;
    }
    if (!hasProfile) {
      setError("Profil manquant. Complétez d'abord Mon dossier.");
      return;
    }
    if (!hasSelectedProgram) {
      setError("Veuillez d'abord choisir une filière.");
      return;
    }
    if (missingKeys.length > 0) {
      setError("Veuillez joindre tous les documents requis (PDF).");
      return;
    }
    setConfirm(true);
  };

  const submit = async () => {
    setSaving(true);
    clearAll();
    try {
      const fd = new FormData();
      for (const r of REQUIRED) fd.append(r.key, files[r.key]);
      const res = await services.candidate.uploadDocs(fd);
      setSuccess(res?.msg || "Documents envoyés avec succès");
      setConfirm(false);
      resetFiles();
      await loadProfile();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(
        err?.response?.data?.msg || err.message || "Erreur lors de l'envoi",
      );
    } finally {
      setSaving(false);
    }
  };

  /* ── Conditional states ── */
  if (checking) return <PageLoader />;

  if (!hasProfile) {
    return (
      <StateCard
        icon={AlertCircle}
        gradient="from-sky-400 to-sky-600"
        iconBg="bg-sky-50"
        iconColor="text-sky-600"
        title="Profil manquant"
        description={
          <>
            Vous devez compléter{" "}
            <span className="font-semibold text-gray-900">Mon dossier</span>{" "}
            avant de déposer vos documents.
          </>
        }
        actions={
          <>
            <button
              onClick={() => navigate(CANDIDATE_APPLY_ROUTE)}
              className={btnPrimary(false)}
              type="button"
            >
              <ArrowRight className="h-4 w-4" />
              Aller à Mon dossier
            </button>
            <button
              onClick={loadProfile}
              className={btnSecondary(false)}
              type="button"
            >
              Réessayer
            </button>
          </>
        }
      />
    );
  }

  if (!hasSelectedProgram) {
    return (
      <StateCard
        icon={ShieldAlert}
        gradient="from-amber-400 to-amber-600"
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
        title="Filière non choisie"
        description="Vous devez d'abord choisir une filière (Programmes éligibles) avant de déposer vos documents."
        actions={
          <>
            <button
              onClick={() => navigate(CANDIDATE_PROGRAMS_ROUTE)}
              className={btnPrimary(false)}
              type="button"
            >
              <ArrowRight className="h-4 w-4" />
              Aller aux Programmes
            </button>
            <button
              onClick={loadProfile}
              className={btnSecondary(false)}
              type="button"
            >
              Actualiser
            </button>
          </>
        }
      />
    );
  }

  if (docsLocked) {
    return (
      <StateCard
        icon={BadgeCheck}
        gradient="from-emerald-400 to-emerald-600"
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
        title="Documents déjà soumis"
        description="Vos documents ont déjà été envoyés avec succès. La modification n'est pas autorisée."
        actions={
          <button
            onClick={loadProfile}
            className={btnSecondary(false)}
            type="button"
          >
            Actualiser
          </button>
        }
      />
    );
  }

  /* ── Count progress values ── */
  const doneCount = REQUIRED.length - missingKeys.length;
  const progressPct = (doneCount / REQUIRED.length) * 100;

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

      {/* ── Page header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Documents
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Téléversez tous les documents requis au format PDF. Soumission
            unique et définitive.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-white shadow-sm px-3 py-1.5">
          <FileText className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs font-semibold text-gray-500">
            {REQUIRED.length} document{REQUIRED.length > 1 ? "s" : ""} requis
          </span>
        </div>
      </div>

      {/* ── Progress KPI card ── */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm mb-5">
        <div
          className={`h-[3px] w-full rounded-t-2xl bg-gradient-to-r transition-all duration-500 ${
            doneCount === REQUIRED.length
              ? "from-emerald-400 to-emerald-600"
              : "from-sky-400 to-sky-600"
          }`}
        />
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Progression du dossier
              </p>
              <p className="text-[28px] font-bold tracking-tight text-gray-900 tabular-nums leading-none">
                {doneCount}{" "}
                <span className="text-lg font-semibold text-gray-400">
                  / {REQUIRED.length}
                </span>
              </p>
            </div>
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-white transition-colors duration-300 ${
                doneCount === REQUIRED.length ? "bg-emerald-50" : "bg-sky-50"
              }`}
            >
              {doneCount === REQUIRED.length ? (
                <CheckCircle2 className="h-[18px] w-[18px] text-emerald-600" />
              ) : (
                <UploadCloud className="h-[18px] w-[18px] text-sky-600" />
              )}
            </div>
          </div>
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                doneCount === REQUIRED.length
                  ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                  : "bg-gradient-to-r from-sky-400 to-sky-600"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {missingKeys.length > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              {missingKeys.length} fichier{missingKeys.length > 1 ? "s" : ""}{" "}
              manquant{missingKeys.length > 1 ? "s" : ""} — joignez-les pour
              activer l'envoi.
            </p>
          )}
        </div>
      </div>

      {/* ── Documents card ── */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
        {/* Card header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Pièces justificatives
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Tous les fichiers doivent être au format PDF (max 10 Mo chacun).
            </p>
          </div>
          <button
            onClick={resetFiles}
            type="button"
            className={btnSecondary(false)}
          >
            Réinitialiser
          </button>
        </div>

        <div className="p-6 space-y-3">
          {REQUIRED.map((r) => {
            const f = files[r.key];
            const ok = !!f;
            return (
              <div
                key={r.key}
                className={`
                  group flex flex-col md:flex-row md:items-center gap-4 rounded-xl border p-4
                  transition-all duration-200
                  ${
                    ok
                      ? "border-emerald-100 bg-emerald-50/20 hover:border-emerald-200"
                      : "border-gray-100 bg-white hover:border-sky-200 hover:bg-sky-50/10"
                  }
                `}
              >
                {/* Icon + labels */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`h-11 w-11 flex-shrink-0 flex items-center justify-center rounded-xl transition-colors duration-200 ${
                      ok ? "bg-emerald-50" : "bg-sky-50 group-hover:bg-sky-100"
                    }`}
                  >
                    {ok ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <FileText className="h-5 w-5 text-sky-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {r.label}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {f ? (
                        <span className="text-emerald-700 font-medium">
                          {f.name} · {(f.size / 1024 / 1024).toFixed(2)} Mo
                        </span>
                      ) : (
                        r.hint
                      )}
                    </p>
                  </div>
                </div>

                {/* File input — unchanged component */}
                <div className="md:w-[320px] flex-shrink-0">
                  <Input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={onPick(r.key)}
                    className="cursor-pointer text-sm"
                  />
                </div>
              </div>
            );
          })}

          {/* ── Bottom actions ── */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
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
              <UploadCloud className="h-4 w-4" />
              Envoyer les documents
            </button>
          </div>
        </div>
      </div>

      {/* ── Confirm modal ── */}
      {confirm && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50"
          onClick={() => !saving && setConfirm(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full p-6 mx-4 animate-in fade-in-0 zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* top accent */}
            <div className="h-[3px] w-full rounded-t-2xl bg-gradient-to-r from-sky-400 to-sky-600 -mt-6 mx-0 mb-6 rounded-none" />

            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-2xl bg-sky-50 mb-4">
                <UploadCloud className="h-6 w-6 text-sky-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">
                Confirmer l'envoi
              </h3>
              <p className="text-sm text-gray-500 mb-2">
                Voulez-vous envoyer vos documents ?
              </p>
              <p className="text-xs font-semibold text-red-500 mb-6">
                Cette action est définitive et irréversible.
              </p>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setConfirm(false)}
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
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi en cours…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Confirmer l'envoi
                  </>
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
