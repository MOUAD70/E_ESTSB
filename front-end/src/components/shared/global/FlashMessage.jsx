import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useEffect, useState } from "react";

export default function FlashMessage({ message, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onDismiss) {
          setTimeout(onDismiss, 300);
        }
      }, message.duration ?? 4000);
      return () => clearTimeout(timer);
    }
  }, [message, onDismiss]);

  const handleClose = () => {
    setIsVisible(false);
    if (onDismiss) {
      setTimeout(onDismiss, 300);
    }
  };

  const colors = {
    success: {
      bg: "bg-green-50 border-green-200",
      text: "text-green-900",
      icon: "text-green-600",
      closeHover: "hover:bg-green-100",
    },
    error: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-900",
      icon: "text-red-600",
      closeHover: "hover:bg-red-100",
    },
    warning: {
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-900",
      icon: "text-amber-600",
      closeHover: "hover:bg-amber-100",
    },
    info: {
      bg: "bg-blue-50 border-blue-200",
      text: "text-blue-900",
      icon: "text-blue-600",
      closeHover: "hover:bg-blue-100",
    },
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const style = colors[message?.type] || colors.info;
  const Icon = icons[message?.type] || Info;

  return (
    <AnimatePresence>
      {message && isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: 0 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`fixed top-5 right-5 z-50 flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg ${style.bg} ${style.text}`}
        >
          <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${style.icon}`} />
          <div className="flex-1 text-sm font-medium">{message.msg}</div>
          <button
            onClick={handleClose}
            className={`shrink-0 rounded p-1 transition-colors ${style.closeHover}`}
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}