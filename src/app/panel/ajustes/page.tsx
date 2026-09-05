import { requireRol } from "@/lib/auth";
import { env, whatsappConfigurado, emailConfigurado } from "@/lib/env";
import { getAjustes } from "@/lib/ajustes";
import { AjustesForm } from "@/components/ajustes-form";

export const dynamic = "force-dynamic";

function Estado({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="text-emerald-600">conectado</span>
  ) : (
    <span className="text-amber-600">modo prueba (sin credenciales)</span>
  );
}

export default async function AjustesPage() {
  await requireRol("ADMIN");
  const a = await getAjustes();
  const dias = Number(a.diasRecordatorioDefault) || env.RECORDATORIO_DIAS_DEFAULT;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-zinc-900">Ajustes</h1>

      <AjustesForm
        diasRecordatorioDefault={dias}
        recordatorioMismoDiaDefault={a.recordatorioMismoDiaDefault === "true"}
        encuestaHabilitada={a.encuestaHabilitada === "true"}
        encuestaDiasDespues={Number(a.encuestaDiasDespues) || 1}
        emailRecordatorioAsunto={a.emailRecordatorioAsunto}
        emailRecordatorioCuerpo={a.emailRecordatorioCuerpo}
        whatsappRecordatorioTexto={a.whatsappRecordatorioTexto}
        contactoPublico={env.WHATSAPP_CONTACTO_PUBLICO}
      />

      <div className="tarjeta space-y-2 text-sm">
        <h2 className="font-semibold text-zinc-900">Estado de las integraciones</h2>
        <p>
          <span className="text-zinc-500">WhatsApp Cloud API:</span> <Estado ok={whatsappConfigurado} />
          {whatsappConfigurado && (
            <span className="text-zinc-400"> · phone_number_id {env.WHATSAPP_PHONE_NUMBER_ID}</span>
          )}
        </p>
        <p>
          <span className="text-zinc-500">Email (Resend):</span> <Estado ok={emailConfigurado} />
        </p>
        <p>
          <span className="text-zinc-500">Remitente:</span> {env.EMAIL_FROM}
        </p>
        <p>
          <span className="text-zinc-500">Contacto público en mensajes:</span>{" "}
          {env.WHATSAPP_CONTACTO_PUBLICO}
        </p>
        <p>
          <span className="text-zinc-500">Cron protegido:</span>{" "}
          {env.CRON_SECRET ? "sí (CRON_SECRET configurado)" : "no — configurá CRON_SECRET antes de producción"}
        </p>
        <p className="text-xs text-zinc-400">
          Estos valores se cambian en las variables de entorno del proyecto (no acá).
        </p>
      </div>
    </div>
  );
}
