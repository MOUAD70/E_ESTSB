import { useEffect, useState } from "react";
import { services } from "@/utils/services";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { AlertBanner } from "@/components/shared/global/AlertBanner";
import { useAlert } from "@/hooks/useAlert";
import { CandidateStatusTimeline } from "@/components/shared/candidate/CandidateStatusTimeline";

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
          <div className={`h-[3px] w-full rounded-t-2xl bg-linear-to-r ${gradient}`} />
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</p>
                {action && <div className="mt-5">{action}</div>}
              </div>
            </div>
            <div className="mt-5 h-[3px] w-full overflow-hidden rounded-full bg-gray-100">
              <div className={`h-full rounded-full bg-linear-to-r ${gradient}`} style={{ width: "60%" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Button ─── */
const btnSecondary =
  "px-4 py-2 rounded-4xl transition-colors cursor-pointer inline-flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium";

/**
 * CandidateStatus Page
 * 
 * Dedicated page showing the candidate's application status timeline.
 * Displayed in the candidate dashboard sidebar under "Mon statut" or similar.
 */
const CandidateStatus = () => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const { success, error, setSuccess, setError } = useAlert();

  const loadStatus = async () => {
    setLoading(true);
    setSuccess(null);
    setError(null);
    try {
      const data = await services.candidate.result();
      setResult(data);
      setSuccess("Statut chargé.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      if (err?.response?.status === 404) {
        setResult({});
      } else {
        setError(err?.response?.data?.msg || err.message || "Erreur de chargement");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStatus(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
          <button onClick={loadStatus} className={btnSecondary} type="button">
            <RefreshCw className="h-4 w-4" />Réessayer
          </button>
        }
      />
    );
  }

  /* Status available (empty or with data) */
  return (
    <div className="min-h-screen bg-[#f7f8fa] px-6 py-7">
      <AlertBanner message={success} type="success" onDismiss={() => setSuccess(null)} />

      <div className="max-w-5xl mx-auto space-y-7">

        {/* ── Page header ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Statut de candidature
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Suivi de la progression de votre dossier dans le processus de sélection.
            </p>
          </div>
          <button onClick={loadStatus} className={btnSecondary} type="button">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </button>
        </div>

        {/* ── Timeline ── */}
        <CandidateStatusTimeline result={result} />

        {/* ── Info section ── */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="h-[3px] w-full rounded-t-2xl bg-linear-to-r from-sky-500 to-emerald-500" />
          <div className="p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4">
              À propos du processus de sélection
            </h3>
            <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
              <p>
                <strong className="text-gray-900">Candidature soumise:</strong> Votre dossier de candidature a été reçu et enregistré dans notre système.
              </p>
              <p>
                <strong className="text-gray-900">Documents vérifiés:</strong> Vos documents ont été examinés pour assurer leur complétude et leur validité.
              </p>
              <p>
                <strong className="text-gray-900">En révision:</strong> Votre profil est actuellement évalué par notre système d'intelligence artificielle et par le jury d'évaluation.
              </p>
              <p>
                <strong className="text-gray-900">Score attribué:</strong> Les évaluations (automatique et jurée) ont été complétées et vos scores sont disponibles.
              </p>
              <p>
                <strong className="text-gray-900">Décision finale:</strong> Le résultat final a été calculé et communiqué. Consultez la section Résultats pour plus de détails.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CandidateStatus;
