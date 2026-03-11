import { 
  FileText, 
  CheckCircle2, 
  Eye, 
  BarChart3, 
  Award,
  Clock,
  AlertCircle
} from "lucide-react";

/**
 * CandidateStatusTimeline Component
 * 
 * Displays the candidate's progress through the application process
 * with visual step indicators and status tracking.
 * 
 * Steps: Application Submitted → Documents Verified → Under Review → Scored → Final Decision
 */
export function CandidateStatusTimeline({ result }) {
  // Determine completion status for each step
  const steps = [
    {
      id: 1,
      label: "Candidature soumise",
      description: "Application reçue et enregistrée",
      icon: FileText,
      complete: !!result,
      timestamp: result?.created_at,
    },
    {
      id: 2,
      label: "Documents vérifiés",
      description: "Dossiers examinés et validés",
      icon: CheckCircle2,
      complete: !!result?.documents_verified || (result?.note_jury || result?.note_jury === 0),
      timestamp: result?.documents_verified_at,
    },
    {
      id: 3,
      label: "En révision",
      description: "Évaluation en cours",
      icon: Eye,
      complete: !!result?.note_ai || result?.note_ai === 0,
      timestamp: result?.review_started_at,
    },
    {
      id: 4,
      label: "Score attribué",
      description: "Évaluations complétées",
      icon: BarChart3,
      complete: (result?.note_ai || result?.note_ai === 0) && (result?.note_jury || result?.note_jury === 0),
      timestamp: result?.scored_at,
    },
    {
      id: 5,
      label: "Décision finale",
      description: "Résultat disponible",
      icon: Award,
      complete: !!result?.note_final || result?.note_final === 0,
      timestamp: result?.created_at,
    },
  ];

  // Find current active step (last incomplete step, or last completed if all done)
  const currentStepIndex = steps.findIndex(s => !s.complete);
  const activeStep = currentStepIndex === -1 ? steps.length : currentStepIndex + 1;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 mb-7">
      {/* Top gradient border */}
      <div className="h-[3px] w-full rounded-t-2xl bg-linear-to-r from-sky-500 via-sky-400 to-emerald-500" />
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 ring-1 ring-sky-100">
            <Clock className="h-[18px] w-[18px] text-sky-600" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Progression
            </p>
            <h2 className="text-base font-bold text-gray-900 leading-snug">
              Progression de votre dossier
            </h2>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">
              Étape {activeStep} sur {steps.length}
            </span>
            <span className="text-xs font-semibold text-gray-400">
              {Math.round((activeStep / steps.length) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-sky-500 to-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${(activeStep / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Timeline steps */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === steps.length - 1;
            const isActive = activeStep === step.id;
            const isPending = !step.complete && !isActive;

            return (
              <div key={step.id} className="relative">
                {/* Connecting line (except last) */}
                {!isLast && (
                  <div
                    className={`absolute left-6 top-12 w-[2px] h-8 transition-colors duration-300 ${
                      step.complete
                        ? "bg-emerald-400"
                        : isActive
                        ? "bg-sky-300"
                        : "bg-gray-200"
                    }`}
                  />
                )}

                {/* Step item */}
                <div className="relative flex gap-4">
                  {/* Step indicator circle */}
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className={`
                        flex h-12 w-12 items-center justify-center rounded-full 
                        border-4 border-white font-semibold text-sm
                        transition-all duration-300 shadow-sm
                        ${
                          step.complete
                            ? "bg-emerald-500 text-white ring-2 ring-emerald-200"
                            : isActive
                            ? "bg-sky-500 text-white ring-2 ring-sky-200 shadow-md"
                            : "bg-gray-100 text-gray-400 ring-1 ring-gray-200"
                        }
                      `}
                    >
                      {step.complete ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : isActive ? (
                        <Icon className="h-5 w-5" />
                      ) : (
                        <span className="text-xs">{step.id}</span>
                      )}
                    </div>
                  </div>

                  {/* Step content */}
                  <div className="flex-1 pt-1.5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p
                          className={`
                            text-sm font-semibold leading-snug transition-colors duration-300
                            ${
                              step.complete
                                ? "text-emerald-700"
                                : isActive
                                ? "text-sky-700"
                                : "text-gray-600"
                            }
                          `}
                        >
                          {step.label}
                        </p>
                        <p
                          className={`
                            text-xs leading-relaxed mt-0.5 transition-colors duration-300
                            ${
                              step.complete || isActive
                                ? "text-gray-500"
                                : "text-gray-400"
                            }
                          `}
                        >
                          {step.description}
                        </p>
                      </div>

                      {/* Status badge */}
                      {step.complete && (
                        <div className="flex-shrink-0 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                          <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-widest">
                            Complété
                          </span>
                        </div>
                      )}
                      {isActive && !step.complete && (
                        <div className="flex-shrink-0 px-2 py-1 rounded-full bg-sky-50 border border-sky-200">
                          <span className="text-[10px] font-semibold text-sky-700 uppercase tracking-widest">
                            En cours
                          </span>
                        </div>
                      )}
                      {isPending && (
                        <div className="flex-shrink-0 px-2 py-1 rounded-full bg-gray-50 border border-gray-200">
                          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                            À venir
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom info bar */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-gray-400" />
            <p>
              {activeStep === steps.length
                ? "Tous les résultats sont disponibles. Consultez les scores ci-dessous."
                : isActiveStep(activeStep) && activeStep < steps.length
                ? `Étape en cours : ${steps[activeStep - 1].label.toLowerCase()}`
                : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to show active step message
function isActiveStep(step) {
  return step > 0;
}

export default CandidateStatusTimeline;
