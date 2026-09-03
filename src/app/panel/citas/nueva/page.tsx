import { requireUsuario } from "@/lib/auth";
import { env } from "@/lib/env";
import { getAjuste } from "@/lib/ajustes";
import { CitaForm } from "@/components/cita-form";

export const dynamic = "force-dynamic";

export default async function NuevaCitaPage() {
  await requireUsuario();
  const dias = Number(await getAjuste("diasRecordatorioDefault")) || env.RECORDATORIO_DIAS_DEFAULT;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-xl font-semibold text-zinc-900">Nueva cita</h1>
      <CitaForm diasRecordatorioDefault={dias} />
    </div>
  );
}
