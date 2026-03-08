import { useCallback, useEffect, useState } from "react";
import { services } from "@/utils/services";
import { useFlash } from "@/context/FlashContext";

export const PAGE_SIZE = 8;

/**
 * Encapsulates all data-fetching, filter/pagination state, and CRUD
 * operations for the AdminUsers page.
 */
export function useUsers() {
  // ── Server data ──────────────────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);          // filtered total (for toolbar label + pagination)
  const [globalTotal, setGlobalTotal] = useState(0); // always unfiltered (stat card)
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [totalEvals, setTotalEvals] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const { flash } = useFlash();

  // ── Filter / sort / page state ────────────────────────────────────────────
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("default");
  const [page, setPage] = useState(1);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (overridePage) => {
    const activePage = overridePage ?? page;
    setLoading(true);
    try {
      const result = await services.admin.getUsers({
        page: activePage,
        per_page: PAGE_SIZE,
        ...(q ? { q } : {}),
        ...(roleFilter !== "ALL" ? { role: roleFilter } : {}),
        sort_by: sortBy,
      });
      setUsers(result.users);
      setTotal(result.total);
      setGlobalTotal(result.global_total);
      setTotalAdmins(result.total_admins);
      setTotalEvals(result.total_evals);
      setTotalPages(result.pages || 1);
    } catch (err) {
      flash(err?.response?.data?.msg || err.message || "Erreur de chargement", "error");
    } finally {
      setLoading(false);
    }
  }, [page, q, roleFilter, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [q, roleFilter, sortBy]);

  // Re-fetch whenever page or filters change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const createUser = async (form) => {
    await services.admin.createUser(form);
    flash("Utilisateur créé avec succès.", "success");
    await fetchUsers(1);
    setPage(1);
  };

  const updateUser = async (id, payload) => {
    await services.admin.updateUser(id, payload);
    flash("Utilisateur mis à jour avec succès.", "success");
    await fetchUsers();
  };

  const deleteUser = async (id) => {
    await services.admin.deleteUser(id);
    flash("Utilisateur supprimé avec succès.", "success");
    // Optimistic removal then re-fetch to keep pagination consistent
    setUsers((prev) => prev.filter((x) => x.id !== id));
    await fetchUsers();
  };

  return {
    // Data
    users,
    total,
    globalTotal,
    totalAdmins,
    totalEvals,
    totalPages,
    loading,
    // Filters
    q, setQ,
    roleFilter, setRoleFilter,
    sortBy, setSortBy,
    page, setPage,
    // Actions
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
}

