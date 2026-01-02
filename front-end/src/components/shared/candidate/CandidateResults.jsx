// CandidateResults.jsx
import { useEffect, useState } from "react";
import { services } from "@/utils/services";
import {
  BadgeCheck,
  AlertCircle,
  Loader2,
  Sparkles,
  Calculator,
  Award,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ScoreCard = ({ label, value, icon: Icon, tone }) => {
  const tones = {
    sky: "bg-sky-100 text-sky-700",
    emerald: "bg-emerald-100 text-emerald-700",
    violet: "bg-violet-100 text-violet-700",
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6 flex items-center gap-4">
        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${tones[tone]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold">
            {typeof value === "number" ? value.toFixed(2) : "—"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const CandidateResults = () => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const loadResult = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await services.candidate.result();
      setResult(data);
    } catch (err) {
      if (err?.response?.status === 404) {
        setResult(null);
      } else {
        setError(err?.response?.data?.msg || err.message || "Erreur");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResult();
  }, []);

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-sky-700" />
      </div>
    );
  }

  // No result yet
  if (!result && !error) {
    return (
      <div className="min-h-screen bg-background px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-6 flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-sky-700" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Résultat non disponible</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Votre candidature est en cours d’évaluation.  
                  Les résultats seront affichés ici dès leur publication.
                </p>
                <div className="mt-4">
                  <Button variant="outline" onClick={loadResult}>
                    Actualiser
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-background px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-6 flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-destructive">Erreur</h2>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                <div className="mt-4">
                  <Button variant="outline" onClick={loadResult}>
                    Réessayer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Result available
  return (
    <div className="min-h-screen bg-background px-6 py-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Résultats de candidature
          </h1>
          <p className="text-sm text-muted-foreground">
            Scores AI, jury et score final
          </p>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScoreCard
            label="Score IA"
            value={result.note_ai}
            icon={Sparkles}
            tone="sky"
          />
          <ScoreCard
            label="Score Jury"
            value={result.note_jury}
            icon={Calculator}
            tone="emerald"
          />
          <ScoreCard
            label="Score Final"
            value={result.note_final}
            icon={Award}
            tone="violet"
          />
        </div>

        {/* Footer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Informations</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Résultat publié le{" "}
            <span className="font-medium text-foreground">
              {new Date(result.created_at).toLocaleDateString()}
            </span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CandidateResults;
