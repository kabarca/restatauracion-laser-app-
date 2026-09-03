import { BloqueCarga } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="tarjeta">
            <div className="h-3 w-24 animate-pulse rounded bg-zinc-200" />
            <div className="mt-2 h-7 w-12 animate-pulse rounded bg-zinc-200" />
          </div>
        ))}
      </div>
      <BloqueCarga />
    </div>
  );
}
