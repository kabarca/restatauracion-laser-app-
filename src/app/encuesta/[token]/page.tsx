import { prisma } from "@/lib/prisma";
import { formatFechaLarga } from "@/lib/timezone";
import { EncuestaForm } from "@/components/encuesta-form";

export const dynamic = "force-dynamic";

export default async function EncuestaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const encuesta = await prisma.encuesta.findUnique({
    where: { token },
    include: { cita: { include: { cliente: true } } },
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 p-4">
      {!encuesta ? (
        <div className="tarjeta w-full max-w-md text-center">
          <h1 className="text-lg font-semibold text-zinc-900">Enlace no válido</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Esta encuesta no existe o el enlace está incompleto.
          </p>
        </div>
      ) : encuesta.respondidaEn ? (
        <div className="tarjeta w-full max-w-md text-center">
          <p className="text-2xl">🙌</p>
          <h1 className="mt-2 text-lg font-semibold text-zinc-900">Ya recibimos tu respuesta</h1>
          <p className="mt-1 text-sm text-zinc-500">¡Gracias, {encuesta.cita.cliente.nombre}!</p>
        </div>
      ) : (
        <div className="w-full max-w-md space-y-3">
          <p className="text-center text-sm text-zinc-500">
            Sobre tu cita del {formatFechaLarga(encuesta.cita.fechaHora)}
          </p>
          <EncuestaForm token={token} />
        </div>
      )}
    </main>
  );
}
