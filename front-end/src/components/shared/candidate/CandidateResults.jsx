// CandidateResults.jsx
import { useEffect, useState } from "react";
import { services } from "@/utils/services";
import { AlertCircle, Loader2, Sparkles, Calculator, Award, X, BadgeCheck } from "lucide-react";

const ScoreCard = ({ label, value, icon: Icon, tone }) => {
  const tones = {
    sky: {
      chip: "bg-sky-50 text-sky-600",
      bar: "bg-sky-500",
    },
    emerald: {
      chip: "bg-emerald-50 text-emerald-600",
      bar: "bg-emerald-500",
    },
    violet: {
      chip: "bg-violet-50 text-violet-600",
      bar: "bg-violet-500",
    },
  };

  const t = tones[tone] || tones.sky;

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-11 w-11 rounded-lg flex items-center justify-center transition-colors ${t.chip}`}>
            <Icon className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-2xl font-semibold text-gray-800 mt-1 group-hover:text-sky-700 transition-colors">
              {typeof value === "number" ? value.toFixed(2) : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${t.bar}`} style={{ width: "100%" }} />
      </div>
    </div>
  );
};

const CandidateResults = () => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const dismissSuccessSoon = () => setTimeout(() => setSuccess(null), 3000);

  // ✅ same buttons as before
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

  const loadResult = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await services.candidate.result();
      setResult(data);
      setSuccess("Résultat chargé.");
      dismissSuccessSoon();
    } catch (err) {
      if (err?.response?.status === 404) {
        setResult(null);
      } else {
        setError(err?.response?.data?.msg || err.message || "Erreur");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-sky-700" />
      </div>
    );
  }

  // No result yet
  if (!result && !error) {
    return (
      <div className="min-h-screen bg-white px-6 py-6">
        {/* banners */}
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

        <div className="max-w-2xl mx-auto bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-lg bg-sky-50 group-hover:bg-sky-100 transition-colors flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-sky-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-gray-900">
                Résultat non disponible
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Votre candidature est en cours d’évaluation. Les résultats seront affichés
                ici dès leur publication.
              </p>

              <div className="mt-4 flex gap-2">
                <button onClick={loadResult} className={btnSecondary(false)} type="button">
                  Actualiser
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-sky-500 rounded-full" style={{ width: "60%" }} />
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-white px-6 py-6">
        <div className="max-w-2xl mx-auto bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-lg bg-red-50 group-hover:bg-red-100 transition-colors flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-red-700">Erreur</h2>
              <p className="text-sm text-gray-600 mt-1">{error}</p>

              <div className="mt-4 flex gap-2">
                <button onClick={loadResult} className={btnSecondary(false)} type="button">
                  Réessayer
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

  // Result available
  return (
    <div className="min-h-screen bg-white px-6 py-6">
      {/* Success banner */}
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

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Résultats de candidature
            </h1>
            <p className="text-sm text-gray-500">Scores AI, jury et score final</p>
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={loadResult} className={btnSecondary(false)} type="button">
              Actualiser
            </button>
          </div>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <ScoreCard label="Score IA" value={result.note_ai} icon={Sparkles} tone="sky" />
          <ScoreCard label="Score Jury" value={result.note_jury} icon={Calculator} tone="emerald" />
          <ScoreCard label="Score Final" value={result.note_final} icon={Award} tone="violet" />
        </div>

        {/* Footer */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-5">
          <p className="text-sm text-gray-500">
            Résultat publié le{" "}
            <span className="font-medium text-gray-900">
              {result?.created_at ? new Date(result.created_at).toLocaleDateString() : "—"}
            </span>
          </p>

          <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-sky-500 rounded-full" style={{ width: "100%" }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateResults;
