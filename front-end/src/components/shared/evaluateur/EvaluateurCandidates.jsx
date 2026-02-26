import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { services } from "@/utils/services";
import { Loader2, User } from "lucide-react";
import { AlertBanner } from "@/components/shared/global/AlertBanner";
import { Pagination } from "@/components/shared/global/Pagination";
import { useAlert } from "@/hooks/useAlert";

const PAGE_SIZE = 10;

const inputBase =
  "w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-sky-500 focus:border-sky-500";

const EvaluateurCandidates = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const { error, setError } = useAlert();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const fetchRows = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await services.evaluateur.getCandidates());
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRows(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      `${r.nom} ${r.prenom} ${r.email} ${r.cin} ${r.cne} ${r.filiere || ""}`.toLowerCase().includes(s)
    );
  }, [rows, q]);

  useEffect(() => { setPage(1); }, [q, rows.length]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-white px-6 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Candidats</h1>
          <p className="text-sm text-gray-500">Liste des candidats à évaluer</p>
        </div>
        <button
          onClick={fetchRows}
          disabled={loading}
          className={`px-4 py-2 rounded-4xl transition-colors cursor-pointer inline-flex items-center justify-center ${
            loading ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
          }`}
          type="button"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualiser"}
        </button>
      </div>

      <AlertBanner message={error} type="error" onDismiss={() => setError(null)} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="relative w-full sm:max-w-md">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher (nom, email, CIN, CNE, filière...)"
            className={inputBase}
          />
        </div>
        <div className="text-sm text-gray-500">
          {loading ? "Chargement..." : `${filtered.length} candidat(s)`}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-sky-100 to-sky-50">
              <tr>
                {["Candidat", "Filière", "Identité", "Action"].map((h, i) => (
                  <th key={h} className={`px-6 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider ${i === 3 ? "text-center" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-10"><div className="h-28 rounded-xl bg-gray-100 animate-pulse" /></td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">Aucun candidat.</td></tr>
              ) : (
                paged.map((r) => (
                  <tr key={r.candidat_id || r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{r.nom} {r.prenom}</div>
                          <div className="text-xs text-gray-500">{r.email || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.filiere || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      CIN: {r.cin || "—"} • CNE: {r.cne || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => navigate(`/evaluateur/candidates/${r.candidat_id || r.id}`)}
                        className="items-center py-2 px-4 text-sm rounded-4xl border-0 outline-0 inline-flex justify-center transition-colors duration-150 cursor-pointer bg-sky-900 hover:bg-sky-950 text-white"
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

      <Pagination
        page={safePage}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      />
    </div>
  );
};

export default EvaluateurCandidates;
