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
    // Nueva cita / Encuestas / Equipo / Ajustes son acciones de administración
    // — Staff solo puede ver las citas agendadas.
    ...(esAdmin
      ? [
          {
            href: "/panel/citas/nueva",
            label: "Nueva cita",
            match: (p: string) => p.startsWith("/panel/citas/nueva"),
          },
          {
            href: "/panel/encuestas",
            label: "Encuestas",
            match: (p: string) => p.startsWith("/panel/encuestas"),
          },
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
    {
      href: "/panel/cambiar-password",
      label: "Cambiar contraseña",
      match: (p: string) => p.startsWith("/panel/cambiar-password"),
    },
  ];

  return (
    <nav className="-mx-1 flex flex-wrap gap-1">
      {links.map((l) => {
        const activo = l.match(pathname);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition sm:px-3 sm:text-sm",
              activo ? "bg-marca text-white" : "text-zinc-600 hover:bg-zinc-100",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
