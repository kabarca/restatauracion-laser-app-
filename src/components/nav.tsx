"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function Nav({ esAdmin }: { esAdmin: boolean }) {
  const pathname = usePathname();
  const links = [
    { href: "/panel", label: "Citas", exact: true },
    { href: "/panel/citas/nueva", label: "Nueva cita" },
    ...(esAdmin
      ? [
          { href: "/panel/usuarios", label: "Equipo" },
          { href: "/panel/ajustes", label: "Ajustes" },
        ]
      : []),
  ];

  return (
    <nav className="flex gap-1">
      {links.map((l) => {
        const activo = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              activo ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
