/**
 * Simple pagination bar. All logic is caller-owned; this is purely
 * a display + interaction component.
 */
export function Pagination({ page, totalPages, totalItems, pageSize, onPrev, onNext }) {
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return (
    <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
      <div>
        {totalItems === 0
          ? "Aucun élément"
          : `Affichage ${startIndex + 1} – ${endIndex} sur ${totalItems}`}
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onPrev}
          disabled={safePage === 1}
          className={`px-3 py-1 rounded ${
            safePage === 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer"
          }`}
          type="button"
        >
          Précédent
        </button>

        <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded font-medium">
          {safePage} / {totalPages}
        </span>

        <button
          onClick={onNext}
          disabled={safePage === totalPages}
          className={`px-3 py-1 rounded ${
            safePage === totalPages
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer"
          }`}
          type="button"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
