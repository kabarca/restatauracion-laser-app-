import Link from "next/link";
import { cn } from "@/lib/cn";

export function VistaToggle({ vista, estado }: { vista: "lista" | "calendario"; estado?: string }) {
  const qs = estado ? `?estado=${encodeURIComponent(estado)}` : "";
  const opciones: { valor: "lista" | "calendario"; label: string; href: string }[] = [
    { valor: "lista", label: "Lista", href: `/panel/citas${qs}` },
    {
      valor: "calendario",
      label: "Calendario",
      href: `/panel/citas?vista=calendario${estado ? `&estado=${encodeURIComponent(estado)}` : ""}`,
    },
  ];

  return (
    <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5">
      {opciones.map((o) => (
        <Link
          key={o.valor}
          href={o.href}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition",
            vista === o.valor ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100",
          )}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}
