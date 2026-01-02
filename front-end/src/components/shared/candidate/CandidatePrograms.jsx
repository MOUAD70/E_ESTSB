import { useEffect, useState } from "react";
import { services } from "@/utils/services";
import {
  BadgeCheck,
  AlertCircle,
  Loader2,
  GraduationCap,
  CheckCircle,
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
      try {
        // 1️⃣ check profile
        const profile = await services.candidate.getProfile();

        if (profile.filiere_id) {
          setLocked(true);
          setLockedMsg("Vous avez déjà choisi une filière. Cette action est définitive.");
          return;
        }

        // 2️⃣ load eligible programs
        const data = await services.candidate.eligiblePrograms();
        setPrograms(data);
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
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Erreur");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-sky-700" />
      </div>
    );
  }

  if (locked) {
    return (
      <div className="min-h-screen bg-white px-6 py-6">
        <div className="max-w-2xl mx-auto bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Filière sélectionnée
              </h2>
              <p className="text-sm text-gray-600 mt-1">{lockedMsg}</p>
              <p className="text-sm text-gray-500 mt-3">
                Vous pouvez maintenant déposer vos documents.
              </p>
            </div>
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
            <BadgeCheck className="h-5 w-5 mr-2" />
            <span>{success}</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Programmes éligibles
        </h1>
        <p className="text-sm text-gray-500">
          Sélectionnez une seule filière parmi celles auxquelles vous êtes éligible.
        </p>
      </div>

      {/* Programs list */}
      {programs.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center text-gray-500">
          Aucune filière éligible trouvée pour votre profil.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {programs.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`p-4 rounded-lg border transition-all text-left ${
                selected === p.id
                  ? "border-sky-600 bg-sky-50"
                  : "border-gray-200 hover:border-sky-400 hover:bg-gray-50"
              }`}
              type="button"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    selected === p.id ? "bg-sky-600 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{p.nom_filiere}</p>
                  <p className="text-sm text-gray-500">
                    Filière éligible selon votre diplôme
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Action */}
      {programs.length > 0 && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={submit}
            className="px-4 py-2 rounded-4xl bg-sky-900 hover:bg-sky-950 text-white transition-colors"
            type="button"
          >
            Confirmer le choix
          </button>
        </div>
      )}
    </div>
  );
}
