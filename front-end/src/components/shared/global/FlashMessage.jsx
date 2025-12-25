export default function FlashMessage({ message }) {
  if (!message) return null;

  const base =
    "fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl transition-all animate-in fade-in slide-in-from-top-5";

  const colors = {
    success: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
    warning: "bg-yellow-100 text-yellow-800",
    info: "bg-blue-100 text-blue-800",
  };

  return <div className={`${base} ${colors[message.type]}`}>{message.msg}</div>;
}