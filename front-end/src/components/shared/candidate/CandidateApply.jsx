// CandidateApply.jsx
import { useEffect, useState } from "react";
import { services } from "@/utils/services";
import { BadgeCheck, AlertCircle, X, Loader2 } from "lucide-react";

const emptyForm = {
  cne: "",
  t_diplome: "",
  branche_diplome: "",
  bac_type: "",
  moy_bac: "",
  m_s1: "",
  m_s2: "",
  m_s3: "",
  m_s4: "",
};

export default function CandidateApply() {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const [locked, setLocked] = useState(false);
  const [lockedMsg, setLockedMsg] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      setChecking(true);
      setError(null);

      try {
        const profile = await services.candidate.getProfile();

        // if backend returns the profile => lock
        if (profile) {
          setLocked(true);
          setLockedMsg(
            "Votre profil académique est déjà enregistré. Vous ne pouvez plus le modifier."
          );
        }
      } catch (err) {
        // 404 = no profile => show form
        if (err?.response?.status !== 404) {
          setError(
            err?.response?.data?.msg || "Erreur lors du chargement du profil"
          );
        }
      } finally {
        setChecking(false);
      }
    };

    checkProfile();
  }, []);

  const inputBase =
    "w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-sky-500 focus:border-sky-500";

  const onChange = (k) => (e) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    setError(null);
    setSuccess(null);

    const required = [
      "cne",
      "t_diplome",
      "branche_diplome",
      "bac_type",
      "moy_bac",
      "m_s1",
      "m_s2",
      "m_s3",
      "m_s4",
    ];

    for (const f of required) {
      if (!String(form[f] ?? "").trim()) {
        // nicer labels
        const labels = {
          cne: "CNE",
          t_diplome: "Type diplôme",
          branche_diplome: "Branche diplôme",
          bac_type: "Type Bac",
          moy_bac: "Moyenne Bac",
          m_s1: "Note S1",
          m_s2: "Note S2",
          m_s3: "Note S3",
          m_s4: "Note S4",
        };
        setError(`${labels[f]} est requis`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        cne: form.cne.trim(),
        t_diplome: form.t_diplome.trim(),
        branche_diplome: form.branche_diplome.trim(),
        bac_type: form.bac_type.trim(),
        moy_bac: Number(form.moy_bac),
        m_s1: Number(form.m_s1),
        m_s2: Number(form.m_s2),
        m_s3: Number(form.m_s3),
        m_s4: Number(form.m_s4),
      };

      const res = await services.candidate.apply(payload);
      setSuccess(res?.msg || "Profil académique enregistré");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const msg = err?.response?.data?.msg || err.message || "Erreur";

      // ✅ if already submitted (locked), show simple message instead of form
      if (
        msg.toLowerCase().includes("profil déjà") ||
        msg.toLowerCase().includes("modification non autorisée")
      ) {
        setLocked(true);
        setLockedMsg(msg);
        setError(null);
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  // If you later add an endpoint like GET /candidate/profile,
  // you can detect "locked" on mount and setLocked(true) directly.
  // For now, we lock only after backend reply.

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-sky-700" />
      </div>
    );
  }

  // ✅ Locked view
  if (locked) {
    return (
      <div className="min-h-screen bg-white px-6 py-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 max-w-2xl mx-auto">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center">
              <BadgeCheck className="h-5 w-5 text-sky-700" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Profil déjà soumis
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {lockedMsg ||
                  "Votre profil académique est déjà enregistré. Vous ne pouvez plus le modifier."}
              </p>

              <p className="text-sm text-gray-500 mt-3">
                Vous pouvez maintenant :
              </p>
              <ul className="text-sm text-gray-600 list-disc ml-5 mt-1">
                <li>Choisir une filière</li>
                <li>Déposer vos documents</li>
                <li>Consulter vos résultats ultérieurement</li>
              </ul>
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
          <button
            onClick={() => setSuccess(null)}
            className="text-green-800 hover:text-green-900"
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
            className="text-red-800 hover:text-red-900"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Mon dossier
        </h1>
        <p className="text-sm text-gray-500">
          Remplissez votre profil académique pour pouvoir choisir une filière et
          déposer vos documents.
        </p>
      </div>

      {/* 🔒 Locked state */}
      {locked ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center">
              <BadgeCheck className="h-5 w-5 text-sky-700" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Profil déjà soumis
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {lockedMsg ||
                  "Votre profil académique est déjà enregistré. Vous ne pouvez plus le modifier."}
              </p>
              <p className="text-sm text-gray-500 mt-3">
                Vous pouvez maintenant passer à l’étape suivante : choisir une
                filière et déposer vos documents.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Form */
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">
              Informations académiques
            </h2>
            <p className="text-xs text-gray-500">
              Les champs marqués * sont obligatoires.
            </p>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  CNE *
                </label>
                <input
                  value={form.cne}
                  onChange={onChange("cne")}
                  className={`${inputBase} mt-1`}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Type diplôme *
                </label>
                <input
                  value={form.t_diplome}
                  onChange={onChange("t_diplome")}
                  className={`${inputBase} mt-1`}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Branche diplôme *
                </label>
                <input
                  value={form.branche_diplome}
                  onChange={onChange("branche_diplome")}
                  className={`${inputBase} mt-1`}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Type Bac *
                </label>
                <input
                  value={form.bac_type}
                  onChange={onChange("bac_type")}
                  className={`${inputBase} mt-1`}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Moyenne Bac *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.moy_bac}
                  onChange={onChange("moy_bac")}
                  className={`${inputBase} mt-1`}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Notes Semestres (obligatoires) *
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    S1 *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.m_s1}
                    onChange={onChange("m_s1")}
                    className={`${inputBase} mt-1`}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    S2 *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.m_s2}
                    onChange={onChange("m_s2")}
                    className={`${inputBase} mt-1`}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    S3 *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.m_s3}
                    onChange={onChange("m_s3")}
                    className={`${inputBase} mt-1`}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    S4 *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.m_s4}
                    onChange={onChange("m_s4")}
                    className={`${inputBase} mt-1`}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={submit}
                disabled={saving}
                className={`px-4 py-2 rounded-4xl transition-colors flex items-center cursor-pointer ${
                  saving
                    ? "bg-sky-900/70 text-white cursor-not-allowed"
                    : "bg-sky-900 hover:bg-sky-950 text-white"
                }`}
                type="button"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
