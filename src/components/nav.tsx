"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function Nav({ esAdmin }: { esAdmin: boolean }) {
  const pathname = usePathname();
  const links = [
    { href: "/panel", label: "Inicio", match: (p: string) => p === "/panel" },
    {
      href: "/panel/citas",
      label: "Citas",
      match: (p: string) =>
        p === "/panel/citas" ||
        (p.startsWith("/panel/citas/") && !p.startsWith("/panel/citas/nueva")),
    },
    {
      href: "/panel/citas/nueva",
      label: "Nueva cita",
      match: (p: string) => p.startsWith("/panel/citas/nueva"),
    },
    ...(esAdmin
      ? [
          {
            href: "/panel/usuarios",
            label: "Equipo",
            match: (p: string) => p.startsWith("/panel/usuarios"),
          },
          {
            href: "/panel/ajustes",
            label: "Ajustes",
            match: (p: string) => p.startsWith("/panel/ajustes"),
          },
        ]
      : []),
  ];

  return (
    <nav className="flex gap-1">
      {links.map((l) => {
        const activo = l.match(pathname);
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
