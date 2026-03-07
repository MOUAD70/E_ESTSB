import { useEffect, useState } from "react";
import { services } from "@/utils/services";
import {
  Loader2,
  GraduationCap,
  CheckCircle,
  CheckCircle2,
} from "lucide-react";
import { AlertBanner } from "@/components/shared/global/AlertBanner";
import { useAlert } from "@/hooks/useAlert";
import { useFlash } from "@/context/FlashContext";

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

/* ─── Info card (locked / empty / error) ─── */
function InfoCard({
  icon: Icon,
  gradient,
  iconBg,
  iconColor,
  title,
  description,
  sub,
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
                {sub && (
                  <p className="text-sm font-medium text-gray-600 mt-3 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    {sub}
                  </p>
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

/* ─── Unchanged button ─── */
const btnPrimary = (disabled = false) =>
  `px-5 py-2.5 rounded-4xl transition-colors flex items-center gap-2 cursor-pointer text-sm font-semibold ${
    !disabled
      ? "bg-sky-900 hover:bg-sky-950 text-white"
      : "bg-gray-100 text-gray-400 cursor-not-allowed"
  }`;

/* ─────────────────────────────────────────────
   Main component — ALL LOGIC UNCHANGED
───────────────────────────────────────────── */
export default function CandidatePrograms() {
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const [lockedMsg, setLockedMsg] = useState("");
  const { success, error, setSuccess, setError } = useAlert();
  const { flash } = useFlash();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const profile = await services.candidate.getProfile();
        if (profile?.filiere_id) {
          setLocked(true);
          setLockedMsg(
            "Vous avez déjà choisi une filière. Cette action est définitive.",
          );
          return;
        }
        const data = await services.candidate.eligiblePrograms();
        setPrograms(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err?.response?.data?.msg ||
            err.message ||
            "Erreur lors du chargement des filières",
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    if (!selected) {
      setError("Veuillez sélectionner une filière.");
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      const res = await services.candidate.selectFiliere(selected);
      const successMsg = res?.msg || "Filière sélectionnée avec succès.";
      setSuccess(successMsg);
      flash(successMsg, "success");
      setLocked(true);
      setLockedMsg("Votre choix de filière a été enregistré.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMsg = err?.response?.data?.msg || err.message || "Erreur";
      setError(errorMsg);
      flash(errorMsg, "error");
    }
  };

  if (loading) return <PageLoader />;

  if (locked) {
    return (
      <InfoCard
        icon={CheckCircle}
        gradient="from-emerald-400 to-emerald-600"
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
        title="Filière sélectionnée"
        description={lockedMsg}
        sub="Vous pouvez maintenant déposer vos documents."
      />
    );
  }

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
            Programmes éligibles
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Sélectionnez une seule filière parmi celles auxquelles vous êtes
            éligible.
          </p>
        </div>
        {/* Program count badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-white shadow-sm px-3 py-1.5">
          <GraduationCap className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs font-semibold text-gray-500">
            {programs.length} filière{programs.length !== 1 ? "s" : ""}{" "}
            disponible{programs.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {programs.length === 0 ? (
        /* ── Empty state ── */
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 mb-4">
            <GraduationCap className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm font-bold text-gray-700">
            Aucune filière éligible
          </p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
            Aucune filière ne correspond à votre profil académique actuel.
          </p>
        </div>
      ) : (
        <>
          {/* ── Program grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-7">
            {programs.map((p, idx) => {
              const isSelected = selected === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  type="button"
                  style={{ animationDelay: `${idx * 50}ms` }}
                  className={`
                    group relative overflow-hidden text-left rounded-2xl border shadow-sm
                    transition-all duration-200 cursor-pointer p-5
                    ${
                      isSelected
                        ? "border-sky-200 bg-white shadow-md"
                        : "border-gray-100 bg-white hover:border-sky-200 hover:shadow-md"
                    }
                  `}
                >
                  {/* top accent */}
                  <div
                    className={`absolute inset-x-0 top-0 h-[3px] rounded-t-2xl bg-gradient-to-r from-sky-400 to-sky-600 transition-opacity duration-300 ${
                      isSelected
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-40"
                    }`}
                  />

                  {/* hover glow */}
                  <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-sky-500 opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-[0.05]" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* icon */}
                      <div
                        className={`h-11 w-11 flex-shrink-0 flex items-center justify-center rounded-xl transition-all duration-200 ${
                          isSelected
                            ? "bg-sky-600 text-white shadow-sm"
                            : "bg-gray-100 text-gray-500 group-hover:bg-sky-50 group-hover:text-sky-600"
                        }`}
                      >
                        <GraduationCap className="h-[18px] w-[18px]" />
                      </div>
                      {/* label */}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {p.nom_filiere}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Filière éligible selon votre diplôme
                        </p>
                      </div>
                    </div>

                    {/* check indicator */}
                    <div
                      className={`flex-shrink-0 ml-3 transition-all duration-200 ${isSelected ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
                    >
                      <CheckCircle2 className="h-5 w-5 text-sky-600" />
                    </div>
                  </div>

                  {/* progress bar */}
                  <div className="mt-4 h-[3px] w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600 transition-all duration-500"
                      style={{ width: isSelected ? "100%" : "0%" }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Submit row ── */}
          <div className="flex items-center justify-between">
            {/* selection hint */}
            <p className="text-sm text-gray-400">
              {selected ? (
                <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Filière sélectionnée
                </span>
              ) : (
                "Aucune filière sélectionnée"
              )}
            </p>
            <button
              onClick={submit}
              className={btnPrimary(!selected)}
              disabled={!selected}
              type="button"
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirmer le choix
            </button>
          </div>
        </>
      )}
    </div>
  );
}
