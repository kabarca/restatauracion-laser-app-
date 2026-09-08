import Image from "next/image";
import Link from "next/link";
import { requireUsuario } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { CerrarSesion } from "@/components/cerrar-sesion";
import { ModoEnvioBanner } from "@/components/modo-envio-banner";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const usuario = await requireUsuario();

  return (
    <div className="min-h-screen animate-[rl-fade-in_350ms_ease-out] motion-reduce:animate-none">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <Link href="/panel" aria-label="Restauración Láser — Inicio">
              <Image
                src="/logo-full.png"
                alt="Restauración Láser"
                width={190}
                height={104}
                className="h-10 w-auto sm:h-12"
                priority
              />
            </Link>
            <div className="flex items-center gap-2 whitespace-nowrap text-sm text-zinc-500">
              <span className="max-w-[9rem] truncate sm:max-w-none">{usuario.nombre}</span>
              <span className="text-zinc-300">·</span>
              <CerrarSesion />
            </div>
          </div>

          <div className="mt-2.5">
            <Nav esAdmin={usuario.rol === "ADMIN"} />
          </div>
        </div>
      </header>

      <ModoEnvioBanner />

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
