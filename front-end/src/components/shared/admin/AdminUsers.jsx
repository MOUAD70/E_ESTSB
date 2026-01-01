// AdminUsers.jsx
import { useEffect, useMemo, useState } from "react";
import { services } from "@/utils/services";
import {
  BadgeCheck,
  AlertCircle,
  X,
  User,
  Mail,
  Phone,
  Pencil,
  Trash2,
  UserPlus,
  Loader2,
  Shield,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

const PAGE_SIZE = 8;

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [success, setSuccess] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [error, setError] = useState(null);

  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    user: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const [page, setPage] = useState(1);

  const dismissSuccessSoon = () => setTimeout(() => setSuccess(null), 3000);
  const dismissErrorSoon = () => setTimeout(() => setDeleteError(null), 5000);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    setDeleteError(null);
    try {
      const data = await services.admin.getUsers();
      setUsers(data);
    } catch (err) {
      setError(
        err?.response?.data?.msg || err.message || "Erreur de chargement"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) => {
      const hay =
        `${u.nom} ${u.prenom} ${u.email} ${u.cin} ${u.phone_num} ${u.role}`.toLowerCase();
      return hay.includes(s);
    });
  }, [users, q]);

  useEffect(() => {
    setPage(1);
  }, [q, users.length]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);
  const pagedData = filtered.slice(startIndex, endIndex);

  const roleBadgeClass = (role) => {
    const r = (role || "").toUpperCase();
    if (r === "ADMIN") return "bg-purple-50 text-purple-700 border-purple-200";
    if (r === "EVALUATEUR") return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  const openCreate = () => {
    setMode("create");
    setSelected(null);
    setForm({ ...emptyForm, role: "CANDIDAT" });
    setError(null);
    setDeleteError(null);
    setSuccess(null);
    setOpen(true);
  };

  const openEdit = (u) => {
    setMode("edit");
    setSelected(u);
    setForm({
      nom: u.nom || "",
      prenom: u.prenom || "",
      email: u.email || "",
      password: "",
      cin: u.cin || "",
      phone_num: u.phone_num || "",
      role: (u.role || "CANDIDAT").toUpperCase(),
    });
    setError(null);
    setDeleteError(null);
    setSuccess(null);
    setOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setOpen(false);
  };

  const validate = () => {
    if (!form.nom.trim()) return "Nom requis.";
    if (!form.prenom.trim()) return "Prénom requis.";
    if (!form.email.trim()) return "Email requis.";
    if (!form.cin.trim()) return "CIN requis.";
    if (!form.phone_num.trim()) return "Téléphone requis.";
    if (!form.role) return "Rôle requis.";
    if (mode === "create" && !form.password.trim())
      return "Mot de passe requis.";
    return null;
  };

  const save = async () => {
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    setSaving(true);
    setError(null);
    setDeleteError(null);
    setSuccess(null);

    try {
      if (mode === "create") {
        await services.admin.createUser({
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          password: form.password,
          cin: form.cin,
          phone_num: form.phone_num,
          role: form.role,
        });
        setSuccess("Utilisateur créé avec succès.");
      } else {
        const payload = {};

        if ((form.nom || "") !== (selected.nom || "")) payload.nom = form.nom;
        if ((form.prenom || "") !== (selected.prenom || ""))
          payload.prenom = form.prenom;
        if ((form.email || "") !== (selected.email || ""))
          payload.email = form.email;
        if ((form.cin || "") !== (selected.cin || "")) payload.cin = form.cin;
        if ((form.phone_num || "") !== (selected.phone_num || ""))
          payload.phone_num = form.phone_num;

        const prevRole = (selected.role || "CANDIDAT").toUpperCase();
        const nextRole = (form.role || "CANDIDAT").toUpperCase();
        if (nextRole !== prevRole) payload.role = nextRole; // only if changed

        await services.admin.updateUser(selected.id, payload);
        setSuccess("Utilisateur mis à jour avec succès.");
      }

      setOpen(false);
      await fetchUsers();
      dismissSuccessSoon();
    } catch (err) {
      setError(
        err?.response?.data?.msg || err.message || "Une erreur est survenue"
      );
    } finally {
      setSaving(false);
    }
  };

  const askDelete = (u) => {
    setError(null);
    setDeleteError(null);
    setSuccess(null);
    setDeleteConfirm({ show: true, user: u });
  };

  const cancelDelete = () => {
    if (isDeleting) return;
    setDeleteConfirm({ show: false, user: null });
  };

  const confirmDelete = async () => {
    const u = deleteConfirm.user;
    if (!u) return;

    setIsDeleting(true);
    setError(null);
    setSuccess(null);
    setDeleteError(null);

    try {
      await services.admin.deleteUser(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      setSuccess("Utilisateur supprimé avec succès.");
      setDeleteConfirm({ show: false, user: null });
      dismissSuccessSoon();
    } catch (err) {
      const msg =
        err?.response?.data?.msg || err.message || "Suppression impossible";
      setDeleteError(msg);
      dismissErrorSoon();
    } finally {
      setIsDeleting(false);
    }
  };

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter(
      (u) => (u.role || "").toUpperCase() === "ADMIN"
    ).length;
    const evals = users.filter(
      (u) => (u.role || "").toUpperCase() === "EVALUATEUR"
    ).length;
    return { total, admins, evals };
  }, [users]);

  const inputBase =
    "w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-sky-500 focus:border-sky-500";

  return (
    <div className="min-h-screen bg-white px-6 py-6">
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

      {(deleteError || error) && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{deleteError || error}</span>
          </div>
          <button
            onClick={() => {
              setError(null);
              setDeleteError(null);
            }}
            className="text-red-800 hover:text-red-900"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Utilisateurs
          </h1>
          <p className="text-sm text-gray-500">
            Gestion des comptes (ADMIN / EVALUATEUR / CANDIDAT)
          </p>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className={`px-4 py-2 rounded-4xl transition-colors cursor-pointer inline-flex items-center justify-center ${
              loading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
            type="button"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Actualiser"
            )}
          </button>

          <button
            onClick={openCreate}
            className="items-center bg-sky-900 text-white hover:bg-sky-950 transition-colors duration-150 py-2.5 px-4 text-[16px] rounded-4xl cursor-pointer border-0 outline-0 inline-flex justify-center align-center"
            type="button"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Ajouter
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-16 mt-2" />
                  </div>
                  <Skeleton className="h-11 w-11 rounded-lg" />
                </div>
                <Skeleton className="mt-4 h-1 w-full rounded-full" />
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total utilisateurs
                  </p>
                  <p className="text-2xl font-semibold text-gray-800 mt-1 group-hover:text-sky-700 transition-colors">
                    {stats.total}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-sky-50 group-hover:bg-sky-100 transition-colors">
                  <User className="h-5 w-5 text-sky-600" />
                </div>
              </div>
              <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full"
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Administrateurs
                  </p>
                  <p className="text-2xl font-semibold text-gray-800 mt-1 group-hover:text-purple-700 transition-colors">
                    {stats.admins}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50 group-hover:bg-purple-100 transition-colors">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      stats.total > 0
                        ? Math.min(100, (stats.admins / stats.total) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Évaluateurs
                  </p>
                  <p className="text-2xl font-semibold text-gray-800 mt-1 group-hover:text-blue-700 transition-colors">
                    {stats.evals}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      stats.total > 0
                        ? Math.min(100, (stats.evals / stats.total) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="w-full sm:max-w-md">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher (nom, email, CIN, téléphone, rôle...)"
            className={inputBase}
          />
        </div>

        <div className="text-sm text-gray-500">
          {loading ? "Chargement..." : `${filtered.length} utilisateur(s)`}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-sky-100 to-sky-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Identité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10">
                    <div className="h-32 rounded-xl bg-gray-100 animate-pulse" />
                  </td>
                </tr>
              ) : pagedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                pagedData.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {u.nom} {u.prenom}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {u.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {u.email}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {u.phone_num}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <span className="text-gray-500">CIN: </span>
                        <span className="font-medium">{u.cin}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs ${roleBadgeClass(
                          u.role
                        )}`}
                      >
                        {(u.role || "CANDIDAT").toUpperCase()}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(u)}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Modifier"
                          type="button"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => askDelete(u)}
                          className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                          title="Supprimer"
                          type="button"
                        >
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

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <div>
          Affichage {totalItems === 0 ? 0 : startIndex + 1} à {endIndex} sur{" "}
          {totalItems} utilisateur(s)
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className={`px-3 py-1 rounded cursor-pointer ${
              safePage === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            type="button"
          >
            Précédent
          </button>

          <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded cursor-pointer">
            {safePage}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className={`px-3 py-1 rounded cursor-pointer ${
              safePage === totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            type="button"
          >
            Suivant
          </button>
        </div>
      </div>

      {/* Create/Edit Modal (upgraded to match EmployeesList) */}
      {open && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-0 mx-4 animate-in fade-in-0 zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {mode === "create"
                    ? "Ajouter un utilisateur"
                    : "Modifier l'utilisateur"}
                </h3>
                <p className="text-sm text-gray-500">
                  {mode === "create"
                    ? "Créer un nouveau compte."
                    : "Mettre à jour les informations."}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
                type="button"
                disabled={saving}
                title="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* inline modal error (keeps global banner too) */}
              {error && (
                <div className="p-3 bg-red-50 text-red-800 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span className="text-sm">{error}</span>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Nom
                  </label>
                  <input
                    value={form.nom}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, nom: e.target.value }))
                    }
                    className={`${inputBase} mt-1`}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Prénom
                  </label>
                  <input
                    value={form.prenom}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, prenom: e.target.value }))
                    }
                    className={`${inputBase} mt-1`}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                  className={`${inputBase} mt-1`}
                />
              </div>

              {mode === "create" && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, password: e.target.value }))
                    }
                    className={`${inputBase} mt-1`}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    CIN
                  </label>
                  <input
                    value={form.cin}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, cin: e.target.value }))
                    }
                    className={`${inputBase} mt-1`}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Téléphone
                  </label>
                  <input
                    value={form.phone_num}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phone_num: e.target.value }))
                    }
                    className={`${inputBase} mt-1`}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Rôle
                </label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, role: e.target.value }))
                  }
                  className={`${inputBase} mt-1`}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={saving}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-4xl transition-colors cursor-pointer"
                type="button"
              >
                Annuler
              </button>

              <button
                onClick={save}
                disabled={saving}
                className="px-4 py-2 bg-sky-900 hover:bg-sky-950 text-white rounded-4xl transition-colors flex items-center cursor-pointer"
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

      {/* Delete Confirm Modal (matched exactly) */}
      {deleteConfirm.show && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50"
          onClick={cancelDelete}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 mx-4 animate-in fade-in-0 zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Confirmer la suppression
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Voulez-vous vraiment supprimer{" "}
                <span className="font-medium text-gray-900">
                  {deleteConfirm.user?.nom} {deleteConfirm.user?.prenom}
                </span>
                ? Cette action est irréversible.
              </p>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-4xl transition-colors cursor-pointer"
                type="button"
              >
                Annuler
              </button>

              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-4xl transition-colors flex items-center cursor-pointer"
                type="button"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
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

export default AdminUsers;
