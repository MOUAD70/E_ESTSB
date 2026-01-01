// AdminDashboard.jsx
import { useEffect, useState } from "react";
import { BadgeCheck, AlertCircle, X, User, Shield } from "lucide-react";

import { AdminKpiCards } from "@/components/shared/admin/AdminKpiCards";
import { ChartBarLabel } from "@/components/ui/charts/BarChart";
import { BarChartAiFinal } from "@/components/ui/charts/GroupedBarChart";
import { Skeleton } from "@/components/ui/skeleton";
import { services } from "../../../utils/services";

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [filieres, setFilieres] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [ov, fil] = await Promise.all([
          services.admin.getOverview(),
          services.admin.getFilieresStats(),
        ]);
        setOverview(ov);
        setFilieres(fil);
        setSuccess(null);
      } catch (err) {
        setError(err?.response?.data?.msg || err.message || "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

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

      {/* KPI Cards + Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
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
                <div className="p-3 rounded-lg bg-gray-50">
                  {i === 1 ? (
                    <User className="h-5 w-5 text-gray-300" />
                  ) : (
                    <Shield className="h-5 w-5 text-gray-300" />
                  )}
                </div>
              </div>
              <Skeleton className="mt-4 h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : (
        <AdminKpiCards overview={overview} loading={loading} />
      )}

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2 mt-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-5">
          {loading ? (
            <div className="space-y-4">
              <div>
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
              </div>
              <Skeleton className="h-[280px] w-full rounded-lg" />
            </div>
          ) : (
            <ChartBarLabel
              data={filieres}
              title="Candidatures par filière"
              description="Nombre de candidatures soumises"
            />
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-5">
          {loading ? (
            <div className="space-y-4">
              <div>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56 mt-2" />
              </div>
              <Skeleton className="h-[280px] w-full rounded-lg" />
            </div>
          ) : (
            <BarChartAiFinal data={filieres} loading={loading} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
