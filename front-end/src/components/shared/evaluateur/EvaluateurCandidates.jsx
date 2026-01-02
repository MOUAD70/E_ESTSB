// EvaluateurCandidates.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { services } from "@/utils/services";

import { Loader2, Search, User, AlertCircle } from "lucide-react";

const PAGE_SIZE = 10;

const EvaluateurCandidates = () => {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);

  // ✅ same style helpers as your other pages
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

  const inputBase =
    "w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-sky-500 focus:border-sky-500";

  const fetchRows = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await services.evaluateur.getCandidates();
      setRows(data || []);
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => {
      const hay = `${r.nom} ${r.prenom} ${r.email} ${r.cin} ${r.cne} ${r.filiere}`.toLowerCase();
      return hay.includes(s);
    });
  }, [rows, q]);

  useEffect(() => setPage(1), [q, rows.length]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);
  const paged = filtered.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-white px-6 py-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Candidats
          </h1>
          <p className="text-sm text-gray-500">Liste des candidats à évaluer</p>
        </div>

        <button
          onClick={fetchRows}
          disabled={loading}
          className={btnSecondary(loading)}
          type="button"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualiser"}
        </button>
      </div>

      {/* Error */}
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
            ✕
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher (nom, email, CIN, CNE, filière...)"
            className={`${inputBase} pl-9`}
          />
        </div>

        <div className="text-sm text-gray-500">
          {loading ? "Chargement..." : `${filtered.length} candidat(s)`}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-sky-100 to-sky-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Candidat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Filière
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Identité
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10">
                    <div className="h-28 rounded-xl bg-gray-100 animate-pulse" />
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                    Aucun candidat.
                  </td>
                </tr>
              ) : (
                paged.map((r) => (
                  <tr
                    key={r.candidat_id || r.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {r.nom} {r.prenom}
                          </div>
                          <div className="text-xs text-gray-500">
                            {r.email || "—"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {r.filiere || "—"}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      CIN: {r.cin || "—"} • CNE: {r.cne || "—"}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() =>
                          navigate(`/evaluateur/candidates/${r.candidat_id || r.id}`)
                        }
                        className={btnPrimary(false)}
                        type="button"
                      >
                        Ouvrir
                      </button>
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
          {totalItems}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className={btnSecondary(safePage === 1)}
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
            className={btnSecondary(safePage === totalPages)}
            type="button"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluateurCandidates;
