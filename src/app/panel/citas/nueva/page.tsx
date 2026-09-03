import { requireUsuario } from "@/lib/auth";
import { env } from "@/lib/env";
import { getAjustes } from "@/lib/ajustes";
import { CitaForm } from "@/components/cita-form";

export const dynamic = "force-dynamic";

export default async function NuevaCitaPage() {
  await requireUsuario();
  const a = await getAjustes();
  const dias = Number(a.diasRecordatorioDefault) || env.RECORDATORIO_DIAS_DEFAULT;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-xl font-semibold text-zinc-900">Nueva cita</h1>
      <CitaForm
        diasRecordatorioDefault={dias}
        recordatorioMismoDiaDefault={a.recordatorioMismoDiaDefault === "true"}
      />
    </div>
  );
}
