import { useEffect, useState } from "react";
import { services } from "@/utils/services";
import {
  BadgeCheck,
  AlertCircle,
  Loader2,
  GraduationCap,
  CheckCircle,
  X,
} from "lucide-react";

export default function CandidatePrograms() {
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState([]);
  const [selected, setSelected] = useState(null);

  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const [locked, setLocked] = useState(false);
  const [lockedMsg, setLockedMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1️⃣ check profile
        const profile = await services.candidate.getProfile();

        if (profile?.filiere_id) {
          setLocked(true);
          setLockedMsg(
            "Vous avez déjà choisi une filière. Cette action est définitive."
          );
          return;
        }

        // 2️⃣ load eligible programs
        const data = await services.candidate.eligiblePrograms();
        setPrograms(Array.isArray(data) ? data : []);
      } catch (err) {
        const msg =
          err?.response?.data?.msg ||
          err.message ||
          "Erreur lors du chargement des filières";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const submit = async () => {
    if (!selected) {
      setError("Veuillez sélectionner une filière.");
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const res = await services.candidate.selectFiliere(selected);
      setSuccess(res?.msg || "Filière sélectionnée avec succès.");
      setLocked(true);
      setLockedMsg("Votre choix de filière a été enregistré.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Erreur");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-sky-700" />
      </div>
    );
  }

  // ✅ Locked (same hover + progress bar vibe like AdminUsers/CandidateApply)
  if (locked) {
    return (
      <div className="min-h-screen bg-white px-6 py-6">
        <div className="max-w-2xl mx-auto bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-lg bg-green-50 group-hover:bg-green-100 transition-colors flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>

            <div className="flex-1">
              <h2 className="text-base font-semibold text-gray-900">
                Filière sélectionnée
              </h2>
              <p className="text-sm text-gray-600 mt-1">{lockedMsg}</p>
              <p className="text-sm text-gray-500 mt-3">
                Vous pouvez maintenant déposer vos documents.
              </p>
            </div>
          </div>

          <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: "100%" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-6 py-6">
      {/* Success (same dismiss style) */}
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

      {/* Error (same dismiss style) */}
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

      {/* Header (same as others) */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Programmes éligibles
          </h1>
          <p className="text-sm text-gray-500">
            Sélectionnez une seule filière parmi celles auxquelles vous êtes éligible.
          </p>
        </div>

        <div className="text-sm text-gray-500">
          {programs.length} filière(s)
        </div>
      </div>

      {/* Empty state */}
      {programs.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-6 text-center text-gray-500">
          Aucune filière éligible trouvée pour votre profil.
        </div>
      ) : (
        <>
          {/* Programs list (card hover like AdminUsers rows/cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {programs.map((p) => {
              const isSelected = selected === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={`p-5 rounded-xl border shadow-sm transition-all duration-200 text-left cursor-pointer ${
                    isSelected
                      ? "border-sky-300 bg-sky-50 hover:shadow-md"
                      : "border-gray-100 bg-white hover:shadow-md hover:border-sky-200"
                  }`}
                  type="button"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-11 w-11 rounded-lg flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-sky-600 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <GraduationCap className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {p.nom_filiere}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Filière éligible selon votre diplôme
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="text-sky-700">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all duration-300"
                      style={{ width: isSelected ? "100%" : "30%" }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action (same button behavior) */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={submit}
              className={`px-4 py-2 rounded-4xl transition-colors flex items-center cursor-pointer ${
                !selected
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-sky-900 hover:bg-sky-950 text-white"
              }`}
              disabled={!selected}
              type="button"
            >
              Confirmer le choix
            </button>
          </div>
        </>
      )}
    </div>
  );
}
