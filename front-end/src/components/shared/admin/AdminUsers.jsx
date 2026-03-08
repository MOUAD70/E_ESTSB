import { useState, useRef, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  Pencil,
  Trash2,
  UserPlus,
  Loader2,
  AlertCircle,
  Search,
  ChevronDown,
  Check,
} from "lucide-react";
import { Pagination } from "@/components/shared/global/Pagination";
import { useUsers, PAGE_SIZE } from "@/hooks/useUsers";
import { useFlash } from "@/context/FlashContext";

const ROLES = ["ADMIN", "EVALUATEUR", "CANDIDAT"];

const emptyForm = {
  nom: "",
  prenom: "",
  email: "",
  password: "",
  cin: "",
  phone_num: "",
  role: "CANDIDAT",
};

/* ── Unchanged ── */
const inputBase =
  "w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-sky-500 focus:border-sky-500";

function roleBadgeClass(role) {
  const r = (role || "").toUpperCase();
  if (r === "ADMIN") return "bg-purple-50 text-purple-700 border-purple-200";
  if (r === "EVALUATEUR") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-gray-50 text-gray-700 border-gray-200";
}

/* ─── Sort options ─── */
const SORT_OPTIONS = [
  { value: "default", label: "Par défaut" },
  { value: "newest", label: "Plus récents" },
  { value: "oldest", label: "Plus anciens" },
];

/* ─── StyledSelect ─── */
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

  const selected = options.find((o) => o.value === value);

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
          className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[8rem] rounded-lg border border-gray-100 bg-white shadow-lg shadow-gray-200/60 py-1 animate-in fade-in-0 zoom-in-95 duration-100">
          {options.map((opt) => {
            const isSel = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left cursor-pointer transition-colors duration-100 ${isSel ? "bg-sky-50 text-sky-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
              >
                <span>{opt.label}</span>
                {isSel && (
                  <Check className="h-3.5 w-3.5 flex-shrink-0 text-sky-600" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const ROLE_OPTIONS = [
  { value: "ALL", label: "Tous les rôles" },
  ...ROLES.map((r) => ({ value: r, label: r })),
];
const ROLE_FORM_OPTIONS = ROLES.map((r) => ({ value: r, label: r }));

/* ─── Shared shimmer style ─── */
const shimmerStyle = `
  @keyframes su-shimmer {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
`;

function ShimmerBlock({ className = "" }) {
  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent"
        style={{ animation: "su-shimmer 1.6s ease-in-out infinite" }}
      />
    </div>
  );
}

/* ─── Unified KPI card (matches AdminKpiCards aesthetic) ─── */
function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  gradient,
  barColor,
  pct = 100,
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-300">
      <div
        className={`h-[3px] w-full bg-gradient-to-r ${gradient} rounded-t-2xl`}
      />
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${gradient} opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-[0.07]`}
      />
      <div className="p-5">
        <div className="flex items-start justify-between mb-5">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg} ${iconColor} ring-1 ring-white group-hover:scale-105 transition-transform duration-300`}
          >
            <Icon className="h-[18px] w-[18px]" />
          </div>
        </div>
        <p className="text-[28px] font-bold tracking-tight text-gray-900 tabular-nums leading-none mb-2">
          {value}
        </p>
        <p className="text-sm font-semibold text-gray-700 leading-snug mb-5">
          {label}
        </p>
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full ${barColor} transition-all duration-500`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Stat card skeleton (mirrors StatCard) ─── */
function StatCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <style>{shimmerStyle}</style>
      <div className="h-[3px] w-full rounded-t-2xl bg-gray-100" />
      <div className="p-5">
        <div className="flex items-start justify-between mb-5">
          <ShimmerBlock className="h-11 w-11 rounded-xl" />
        </div>
        <ShimmerBlock className="h-9 w-20 rounded-lg mb-2" />
        <ShimmerBlock className="h-3.5 w-28 rounded-md mb-5" />
        <ShimmerBlock className="h-[3px] w-full rounded-full" />
      </div>
    </div>
  );
}

/* ─── Sub-component: UserTable ─── */
function UserTable({ users, loading, onEdit, onDelete }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/80">
            <tr>
              {["Utilisateur", "Contact", "Identité", "Rôle", "Actions"].map(
                (h, i) => (
                  <th
                    key={h}
                    className={`px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 ${i === 4 ? "text-center" : ""}`}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-10">
                  <div className="h-32 rounded-xl bg-gray-100 animate-pulse" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-14 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                      <User className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">
                      Aucun utilisateur trouvé.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-gray-100 flex items-center justify-center ring-1 ring-gray-200">
                        <User className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-semibold text-gray-900">{u.nom} {u.prenom}</div>
                        <div className="text-xs text-gray-400">ID: {u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />{u.email}
                    </div>
                    <div className="text-sm text-gray-400 flex items-center gap-1.5 mt-1">
                      <Phone className="h-3.5 w-3.5 shrink-0" />{u.phone_num}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <span className="text-gray-400">CIN: </span>
                    <span className="font-medium">{u.cin}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${roleBadgeClass(u.role)}`}>
                      {(u.role || "CANDIDAT").toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => onEdit(u)} className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer" title="Modifier" type="button">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => onDelete(u)} className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer" title="Supprimer" type="button">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Sub-component: UserFormModal ─── */
function UserFormModal({ open, mode, form, setForm, formError, setFormError, saving, onClose, onSave }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {mode === "create" ? "Ajouter un utilisateur" : "Modifier l'utilisateur"}
            </h3>
            <p className="text-sm text-gray-400 mt-0.5">
              {mode === "create" ? "Créer un nouveau compte." : "Mettre à jour les informations."}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer" type="button" disabled={saving}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {formError && (
            <div className="flex items-center justify-between rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
              <button onClick={() => setFormError(null)} type="button">
                <X className="h-4 w-4 opacity-60 hover:opacity-100" />
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[["nom", "Nom"], ["prenom", "Prénom"]].map(([k, label]) => (
              <div key={k}>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">{label}</label>
                <input value={form[k]} onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))} className={`${inputBase} mt-0`} />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className={inputBase} />
          </div>
          {mode === "create" && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Mot de passe</label>
              <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} className={inputBase} />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[["cin", "CIN"], ["phone_num", "Téléphone"]].map(([k, label]) => (
              <div key={k}>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">{label}</label>
                <input value={form[k]} onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))} className={`${inputBase} mt-0`} />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Rôle</label>
            <StyledSelect value={form.role} onChange={(val) => setForm((p) => ({ ...p, role: val }))} options={ROLE_FORM_OPTIONS} />
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-4xl transition-colors cursor-pointer" type="button">Annuler</button>
          <button onClick={onSave} disabled={saving} className="px-4 py-2 bg-sky-900 hover:bg-sky-950 text-white rounded-4xl transition-colors flex items-center gap-2 cursor-pointer" type="button">
            {saving ? (<><Loader2 className="animate-spin h-4 w-4" />Enregistrement...</>) : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-component: DeleteConfirmModal ─── */
function DeleteConfirmModal({ user, isDeleting, onCancel, onConfirm }) {
  if (!user) return null;
  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50" onClick={() => !isDeleting && onCancel()} role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 mx-4 animate-in fade-in-0 zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-2xl bg-red-50 mb-4">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-2">Confirmer la suppression</h3>
          <p className="text-sm text-gray-500 mb-6">
            Voulez-vous vraiment supprimer{" "}
            <span className="font-semibold text-gray-900">{user.nom} {user.prenom}</span>{" "}
            ? Cette action est irréversible.
          </p>
        </div>
        <div className="flex justify-center space-x-4">
          <button onClick={onCancel} disabled={isDeleting} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-4xl transition-colors cursor-pointer" type="button">Annuler</button>
          <button onClick={onConfirm} disabled={isDeleting} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-4xl transition-colors flex items-center gap-2 cursor-pointer" type="button">
            {isDeleting ? (<><Loader2 className="animate-spin h-4 w-4" />Suppression...</>) : (<><Trash2 className="h-4 w-4" />Supprimer</>)}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main component — orchestrator ─── */
const AdminUsers = () => {
  const {
    users, total, globalTotal, totalAdmins, totalEvals, totalPages,
    loading,
    q, setQ, roleFilter, setRoleFilter, sortBy, setSortBy,
    page, setPage, fetchUsers, createUser, updateUser, deleteUser,
  } = useUsers();
  const { flash } = useFlash();

  // ── Modal state (UI-only, stays local) ──────────────────────────────────
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openCreate = () => { setMode("create"); setSelected(null); setForm({ ...emptyForm }); setFormError(null); setOpen(true); };
  const openEdit = (u) => {
    setMode("edit"); setSelected(u);
    setForm({ nom: u.nom || "", prenom: u.prenom || "", email: u.email || "", password: "", cin: u.cin || "", phone_num: u.phone_num || "", role: (u.role || "CANDIDAT").toUpperCase() });
    setFormError(null); setOpen(true);
  };
  const closeModal = () => { if (!saving) setOpen(false); };

  const validate = () => {
    if (!form.nom.trim()) return "Nom requis.";
    if (!form.prenom.trim()) return "Prénom requis.";
    if (!form.email.trim()) return "Email requis.";
    if (!form.cin.trim()) return "CIN requis.";
    if (!form.phone_num.trim()) return "Téléphone requis.";
    if (!form.role) return "Rôle requis.";
    if (mode === "create" && !form.password.trim()) return "Mot de passe requis.";
    return null;
  };

  const save = async () => {
    const msg = validate();
    if (msg) { setFormError(msg); return; }
    setSaving(true); setFormError(null);
    try {
      if (mode === "create") {
        await createUser(form);
      } else {
        const payload = {};
        if (form.nom !== selected.nom) payload.nom = form.nom;
        if (form.prenom !== selected.prenom) payload.prenom = form.prenom;
        if (form.email !== selected.email) payload.email = form.email;
        if (form.cin !== selected.cin) payload.cin = form.cin;
        if (form.phone_num !== selected.phone_num) payload.phone_num = form.phone_num;
        const prevRole = (selected.role || "CANDIDAT").toUpperCase();
        if (form.role !== prevRole) payload.role = form.role;
        await updateUser(selected.id, payload);
      }
      setOpen(false);
    } catch (err) {
      setFormError(err?.response?.data?.msg || err.message || "Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      flash(err?.response?.data?.msg || err.message || "Suppression impossible", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const statCards = [
    { label: "Total utilisateurs", value: globalTotal, icon: User, iconBg: "bg-sky-50", iconColor: "text-sky-600", gradient: "from-sky-500 to-sky-600", barColor: "bg-linear-to-r from-sky-400 to-sky-600", pct: 100 },
    { label: "Administrateurs", value: totalAdmins, icon: User, iconBg: "bg-purple-50", iconColor: "text-purple-600", gradient: "from-purple-500 to-purple-600", barColor: "bg-linear-to-r from-purple-400 to-purple-600", pct: globalTotal > 0 ? (totalAdmins / globalTotal) * 100 : 0 },
    { label: "Évaluateurs", value: totalEvals, icon: User, iconBg: "bg-blue-50", iconColor: "text-green-600", gradient: "from-green-500 to-green-600", barColor: "bg-linear-to-r from-green-400 to-green-600", pct: globalTotal > 0 ? (totalEvals / globalTotal) * 100 : 0 },
  ];

  return (
    <div className="min-h-screen bg-[#f7f8fa] px-6 py-7">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Utilisateurs</h1>
          <p className="mt-0.5 text-sm text-gray-500">Gestion des comptes (ADMIN / ÉVALUATEUR / CANDIDAT)</p>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => fetchUsers()}
            disabled={loading}
            className={`px-4 py-2 rounded-4xl transition-colors cursor-pointer inline-flex items-center justify-center ${loading ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-200 hover:bg-gray-300 text-gray-800"}`}
            type="button"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualiser"}
          </button>
          <button onClick={openCreate} className="items-center bg-sky-900 text-white hover:bg-sky-950 transition-colors duration-150 py-2.5 px-4 text-sm rounded-4xl cursor-pointer inline-flex gap-2" type="button">
            <UserPlus className="h-4 w-4" />Ajouter
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
        {loading ? [1, 2, 3].map((i) => <StatCardSkeleton key={i} />) : statCards.map((card) => <StatCard key={card.label} {...card} />)}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex flex-wrap gap-2 w-full sm:max-w-2xl">
          <div className="relative flex-1 min-w-40">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher (nom, email, CIN, téléphone...)"
              className="w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-sky-100 focus:border-sky-400 placeholder:text-gray-400"
            />
          </div>
          <StyledSelect value={roleFilter} onChange={setRoleFilter} options={ROLE_OPTIONS} className="w-40" />
          <div className="relative">
            <StyledSelect value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} className="w-40" />
          </div>
        </div>
        <div className="text-sm text-gray-500 shrink-0">
          {loading ? "Chargement..." : `${total} utilisateur(s)`}
        </div>
      </div>

      <UserTable users={users} loading={loading} onEdit={openEdit} onDelete={setDeleteTarget} />

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={PAGE_SIZE}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      />

      <UserFormModal
        open={open}
        mode={mode}
        form={form}
        setForm={setForm}
        formError={formError}
        setFormError={setFormError}
        saving={saving}
        onClose={closeModal}
        onSave={save}
      />

      <DeleteConfirmModal
        user={deleteTarget}
        isDeleting={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default AdminUsers;
