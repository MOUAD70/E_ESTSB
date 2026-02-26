import { useState, useCallback } from "react";

/**
 * Centralises the success / error banner state that is copy-pasted across
 * every page component.  Returns { success, error, setSuccess, setError,
 * flash, clearAll }.
 *
 * `flash(msg, type, ms)` sets the message and auto-clears it after `ms`
 * milliseconds (default 3 000).
 */
export function useAlert() {
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const clearAll = useCallback(() => {
    setSuccess(null);
    setError(null);
  }, []);

  const flash = useCallback((msg, type = "success", ms = 3000) => {
    if (type === "success") {
      setSuccess(msg);
      setError(null);
    } else {
      setError(msg);
      setSuccess(null);
    }
    if (ms > 0) {
      setTimeout(() => {
        if (type === "success") setSuccess(null);
        else setError(null);
      }, ms);
    }
  }, []);

  return { success, error, setSuccess, setError, flash, clearAll };
}
