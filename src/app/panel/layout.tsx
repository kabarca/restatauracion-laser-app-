import { requireUsuario } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { CerrarSesion } from "@/components/cerrar-sesion";
import { ModoEnvioBanner } from "@/components/modo-envio-banner";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const usuario = await requireUsuario();

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-zinc-900">Restauración Láser</span>
            <Nav esAdmin={usuario.rol === "ADMIN"} />
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <span>{usuario.nombre}</span>
            <span className="text-zinc-300">·</span>
            <CerrarSesion />
          </div>
        </div>
      </header>

      <ModoEnvioBanner />

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
