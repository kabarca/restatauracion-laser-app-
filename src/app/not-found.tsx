import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-lg font-semibold text-zinc-900">Página no encontrada</h1>
      <Link href="/panel" className="btn-primario">
        Ir al panel
      </Link>
    </main>
  );
}
