import { useEffect, useRef, useState } from "react";
import { services } from "@/utils/services";
import { BadgeCheck, Loader2, User, ChevronDown, Check } from "lucide-react";
import { AlertBanner } from "@/components/shared/global/AlertBanner";
import { useAlert } from "@/hooks/useAlert";

/* ─────────────────────────────────────────────
   Logic constants — 100% UNCHANGED
───────────────────────────────────────────── */
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

const DIPLOME_TYPES = ["DTS", "DUT", "BTS", "DEUST", "DEUG"];

const BRANCHE_GROUPS = [
  {
    label: "Informatique / Réseaux",
    options: [
      "INFRASTRUCTURE DIGITAL",
      "DEVELOPPEMENT DIGITAL",
      "GENIE INFORMATIQUE",
      "SMI",
      "RÉSEAUX ET TÉLÉCOMS",
    ],
  },
  {
    label: "Gestion / Économie",
    options: [
      "GESTION DES ENTREPRISES",
      "TECHNIQUES DE MANAGEMENT",
      "ECONOMIE",
      "COMPTABILITÉ",
    ],
  },
  {
    label: "Agro / Environnement",
    options: [
      "AGRONOMIE",
      "AGRO-ALIMENTAIRE",
      "SCIENCES DE LA VIE",
      "ENVIRONNEMENT",
    ],
  },
];

const FIELD_LABELS = {
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

/* ─── Unchanged ─── */
const inputBase =
  "w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-sky-500 focus:border-sky-500";

/* ─────────────────────────────────────────────
   StyledSelect — consistent with admin pages
───────────────────────────────────────────── */
function StyledSelect({
  value,
  onChange,
  options = [],
  placeholder = "Sélectionner…",
  className = "",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // flatten to find label for selected value
  const flatOptions = options.filter((o) => !o.isGroup);
  const selected = flatOptions.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`
          w-full flex items-center justify-between gap-2
          rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-left
          outline-none transition-all duration-150 hover:border-gray-300
          ${open ? "border-sky-400 ring-2 ring-sky-100" : ""}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <span className={selected ? "text-gray-900" : "text-gray-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-100 bg-white shadow-lg shadow-gray-200/60 py-1 animate-in fade-in-0 zoom-in-95 duration-100 max-h-64 overflow-y-auto">
          {options.map((opt, i) => {
            if (opt.isGroup) {
              return (
                <div key={`group-${i}`} className="px-3 pt-2.5 pb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {opt.label}
                  </span>
                </div>
              );
            }
            const isSel = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left cursor-pointer transition-colors duration-100 ${
                  isSel
                    ? "bg-sky-50 text-sky-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>{opt.label}</span>
                {isSel && (
                  <Check className="h-3.5 w-3.5 shrink-0 text-sky-600" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Option data for StyledSelect ─── */
const DIPLOME_OPTIONS = DIPLOME_TYPES.map((d) => ({ value: d, label: d }));

const BRANCHE_OPTIONS = BRANCHE_GROUPS.flatMap((g) => [
  { label: g.label, isGroup: true },
  ...g.options.map((b) => ({ value: b, label: b })),
]);

/* ─── Section label ─── */
function FieldLabel({ children }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
      {children}
    </label>
  );
}

/* ─── Shared section divider header ─── */
function SectionHeader({ number, title, description }) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700 mt-0.5">
        {number}
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900">{title}</p>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

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

/* ─── Locked card ─── */
function LockedCard({ lockedMsg }) {
  return (
    <div className="min-h-screen bg-[#f7f8fa] px-6 py-7 flex items-start justify-center">
      <div className="w-full max-w-lg mt-8">
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="h-[3px] w-full rounded-t-2xl bg-linear-to-r from-sky-400 to-sky-600" />
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50">
                <BadgeCheck className="h-5 w-5 text-sky-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-gray-900">
                  Profil déjà soumis
                </h2>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  {lockedMsg ||
                    "Votre profil académique est déjà enregistré. Vous ne pouvez plus le modifier."}
                </p>
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Prochaines étapes
                  </p>
                  {[
                    "Choisir une filière (Programmes éligibles)",
                    "Déposer vos documents justificatifs",
                    "Consulter vos résultats une fois publiés",
                  ].map((step, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${i === 0 ? "bg-sky-500" : i === 1 ? "bg-emerald-500" : "bg-violet-500"}`}
                      />
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-5 h-[3px] w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-full rounded-full bg-linear-to-r from-sky-400 to-sky-600" />
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
export default function CandidateApply() {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(false);
  const [lockedMsg, setLockedMsg] = useState(null);
  const [checking, setChecking] = useState(true);
  const { success, error, setSuccess, setError, clearAll } = useAlert();

  useEffect(() => {
    const checkProfile = async () => {
      setChecking(true);
      clearAll();
      try {
        const profile = await services.candidate.getProfile();
        if (profile) {
          setLocked(true);
          setLockedMsg(
            "Votre profil académique est déjà enregistré. Vous ne pouvez plus le modifier.",
          );
        }
      } catch (err) {
        if (err?.response?.status !== 404) {
          setError(
            err?.response?.data?.msg || "Erreur lors du chargement du profil",
          );
        }
      } finally {
        setChecking(false);
      }
    };
    checkProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = (k) => (e) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));
  const onSelect = (k) => (val) => setForm((p) => ({ ...p, [k]: val }));

  const submit = async () => {
    clearAll();
    const required = Object.keys(FIELD_LABELS);
    for (const f of required) {
      if (!String(form[f] ?? "").trim()) {
        setError(`${FIELD_LABELS[f]} est requis`);
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
      if (
        msg.toLowerCase().includes("profil déjà") ||
        msg.toLowerCase().includes("modification non autorisée")
      ) {
        setLocked(true);
        setLockedMsg(msg);
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  if (checking) return <PageLoader />;
  if (locked) return <LockedCard lockedMsg={lockedMsg} />;

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
            Mon dossier
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Remplissez votre profil académique pour choisir une filière et
            déposer vos documents.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-gray-100 bg-white shadow-sm px-3 py-1.5">
          <User className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs font-semibold text-gray-500">
            Profil académique
          </span>
        </div>
      </div>

      {/* ── Form card ── */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
        {/* Card header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
          <h2 className="text-sm font-bold text-gray-900">
            Informations académiques
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Tous les champs sont obligatoires. Votre profil ne pourra plus être
            modifié après soumission.
          </p>
        </div>

        <div className="p-6 space-y-7">
          {/* ── Section 1: Identifiant + Diplôme ── */}
          <div className="space-y-4">
            <SectionHeader number="1" title="Identification & Diplôme" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <FieldLabel>CNE</FieldLabel>
                <input
                  value={form.cne}
                  onChange={onChange("cne")}
                  className={inputBase}
                  placeholder="Ex : R123456789"
                />
              </div>
              <div>
                <FieldLabel>Type diplôme</FieldLabel>
                <StyledSelect
                  value={form.t_diplome}
                  onChange={onSelect("t_diplome")}
                  options={DIPLOME_OPTIONS}
                  placeholder="— Sélectionner —"
                />
              </div>
              <div>
                <FieldLabel>Branche diplôme</FieldLabel>
                <StyledSelect
                  value={form.branche_diplome}
                  onChange={onSelect("branche_diplome")}
                  options={BRANCHE_OPTIONS}
                  placeholder="— Sélectionner —"
                />
              </div>
              <div>
                <FieldLabel>Type Bac</FieldLabel>
                <input
                  value={form.bac_type}
                  onChange={onChange("bac_type")}
                  className={inputBase}
                  placeholder="Ex : Sciences Maths"
                />
              </div>
            </div>
          </div>

          {/* ── Section 2: Bac + Semestres ── */}
          <div className="space-y-4">
            <SectionHeader
              number="2"
              title="Notes & Moyennes"
              description="Saisissez les notes avec 2 décimales si nécessaire."
            />

            {/* Moyenne bac alone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <FieldLabel>Moyenne Bac</FieldLabel>
                <input
                  type="number"
                  step="0.01"
                  value={form.moy_bac}
                  onChange={onChange("moy_bac")}
                  className={inputBase}
                  placeholder="Ex : 14.50"
                />
              </div>
            </div>

            {/* Semestre notes */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                Notes par semestre
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["m_s1", "m_s2", "m_s3", "m_s4"].map((k, i) => (
                  <div key={k}>
                    <FieldLabel>Semestre {i + 1}</FieldLabel>
                    <input
                      type="number"
                      step="0.01"
                      value={form[k]}
                      onChange={onChange(k)}
                      className={inputBase}
                      placeholder="Ex : 13.00"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={() => {
                setForm(emptyForm);
                clearAll();
              }}
              disabled={saving}
              className={`px-4 py-2 rounded-4xl transition-colors cursor-pointer text-sm font-medium ${
                saving
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              }`}
              type="button"
            >
              Réinitialiser
            </button>
            <button
              onClick={submit}
              disabled={saving}
              className={`px-5 py-2.5 rounded-4xl transition-colors flex items-center gap-2 cursor-pointer text-sm font-semibold ${
                saving
                  ? "bg-sky-900/70 text-white cursor-not-allowed"
                  : "bg-sky-900 hover:bg-sky-950 text-white"
              }`}
              type="button"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  Enregistrement…
                </>
              ) : (
                "Enregistrer le profil"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
