import { useEffect, useMemo, useState } from "react";
import { services } from "@/utils/services";
import {
  Loader2,
  RefreshCw,
  Sparkles,
  Calculator,
  Search,
  User,
  BadgeCheck,
  AlertCircle,
  X,
} from "lucide-react";

const PAGE_SIZE = 10;

const AdminResults = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [page, setPage] = useState(1);
  const [runningAI, setRunningAI] = useState(false);
  const [computing, setComputing] = useState(false);

  const fetchRows = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await services.admin.getFinalScores();
      setRows(data);
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

  const scoreChip = (v, tone = "sky") => {
    const val = typeof v === "number" ? v : null;
    const cls =
      tone === "sky"
        ? "bg-sky-50 text-sky-700 border-sky-200"
        : tone === "emerald"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-violet-50 text-violet-700 border-violet-200";

    return (
      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs ${cls}`}>
        {val === null ? "—" : val.toFixed(2)}
      </span>
    );
  };

  const runAi = async () => {
    setRunningAI(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await services.admin.runAiScoring();
      setSuccess(res?.msg || "AI scoring terminé.");
      await fetchRows();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Erreur AI scoring");
    } finally {
      setRunningAI(false);
    }
  };

  const computeFinal = async () => {
    setComputing(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await services.admin.computeFinalScores();
      setSuccess(res?.msg || "Final scores calculés.");
      await fetchRows();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Erreur calcul final");
    } finally {
      setComputing(false);
    }
  };

  const inputBase =
    "w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-sky-500 focus:border-sky-500";

  return (
    <div className="min-h-screen bg-white px-6 py-6">
      {/* Success banner (EmployeesList style) */}
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

      {/* Error banner (EmployeesList style) */}
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Scores & Résultats
          </h1>
          <p className="text-sm text-gray-500">AI + Jury (moyenne) + Score final</p>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          <button
            onClick={fetchRows}
            disabled={loading}
            className={`px-4 py-2 rounded-4xl transition-colors duration-150 inline-flex items-center justify-center cursor-pointer ${
              loading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            type="button"
            title="Actualiser"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={runAi}
            disabled={runningAI}
            className={`px-4 py-2 rounded-4xl transition-colors duration-150 flex items-center cursor-pointer ${
              runningAI ? "bg-sky-900/70 text-white cursor-not-allowed" : "bg-sky-900 hover:bg-sky-950 text-white"
            }`}
            type="button"
          >
            {runningAI ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            AI scoring
          </button>

          <button
            onClick={computeFinal}
            disabled={computing}
            className={`px-4 py-2 rounded-4xl transition-colors duration-150 flex items-center cursor-pointer ${
              computing ? "bg-gray-900/70 text-white cursor-not-allowed" : "bg-gray-900 hover:bg-gray-950 text-white"
            }`}
            type="button"
          >
            {computing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Calculator className="h-4 w-4 mr-2" />
            )}
            Calcul final
          </button>
        </div>
      </div>

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
          {loading ? "Chargement..." : `${filtered.length} résultat(s)`}
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
                  AI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Jury (avg)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Final
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
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    Aucun résultat.
                  </td>
                </tr>
              ) : (
                paged.map((r) => (
                  <tr key={r.candidat_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {r.nom} {r.prenom}
                          </div>
                          <div className="text-sm text-gray-500">
                            CNE: {r.cne || "—"} • CIN: {r.cin || "—"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {r.filiere || "—"}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">{scoreChip(r.note_ai, "sky")}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{scoreChip(r.note_jury, "emerald")}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{scoreChip(r.note_final, "violet")}</td>
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
          Affichage {totalItems === 0 ? 0 : startIndex + 1} à {endIndex} sur {totalItems}
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
    </div>
  );
};

export default AdminResults;
