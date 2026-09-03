export function BloqueCarga({ filas = 5 }: { filas?: number }) {
  return (
    <div className="space-y-3">
      <div className="h-8 w-40 animate-pulse rounded bg-zinc-200" />
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        {Array.from({ length: filas }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b border-zinc-100 py-3 last:border-0">
            <div className="h-4 w-24 animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-16 animate-pulse rounded bg-zinc-100" />
            <div className="h-4 flex-1 animate-pulse rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
