import { BadgeCheck, AlertCircle, X } from "lucide-react";

/**
 * Reusable inline alert banner.
 * type: "success" | "error"
 */
export function AlertBanner({ message, type = "success", onDismiss }) {
  if (!message) return null;

  const isSuccess = type === "success";

  return (
    <div
      className={`mb-4 p-3 rounded-lg flex items-center justify-between ${
        isSuccess
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800"
      }`}
    >
      <div className="flex items-center">
        {isSuccess ? (
          <BadgeCheck className="h-5 w-5 mr-2 shrink-0" />
        ) : (
          <AlertCircle className="h-5 w-5 mr-2 shrink-0" />
        )}
        <span className="text-sm">{message}</span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={`ml-3 ${isSuccess ? "text-green-800 hover:text-green-900" : "text-red-800 hover:text-red-900"}`}
          type="button"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
