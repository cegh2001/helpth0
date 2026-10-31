const SKELETON_CARDS = [0, 1, 2, 3];

/**
 * Instant loading state for every module route. `/terapias` reads the database
 * on the server, so without this the click felt dead until the query returned.
 */
export default function DashboardLoading() {
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <span className="sr-only">Cargando módulo…</span>

      <div className="space-y-2">
        <div className="h-5 w-56 animate-pulse rounded-md bg-slate-200" />
        <div className="h-3 w-80 max-w-full animate-pulse rounded bg-slate-100" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SKELETON_CARDS.map((card) => (
          <div
            key={card}
            className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
          >
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            <div className="h-6 w-16 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>

      <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-xs" />
    </div>
  );
}
