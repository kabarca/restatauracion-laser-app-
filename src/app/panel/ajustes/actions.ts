"use server";

import { revalidatePath } from "next/cache";
import { requireRol } from "@/lib/auth";
import { setAjuste, AJUSTES_DEFAULT } from "@/lib/ajustes";

export async function guardarAjustes(_prev: { ok: boolean }, formData: FormData) {
  await requireRol("ADMIN");

  const dias = parseInt(String(formData.get("diasRecordatorioDefault") ?? ""), 10);
  if (Number.isFinite(dias) && dias >= 0 && dias <= 30) {
    await setAjuste("diasRecordatorioDefault", String(dias));
  }

  await setAjuste(
    "recordatorioMismoDiaDefault",
    formData.get("recordatorioMismoDiaDefault") === "on" ? "true" : "false",
  );

  await setAjuste(
    "encuestaHabilitada",
    formData.get("encuestaHabilitada") === "on" ? "true" : "false",
  );
  const encDias = parseInt(String(formData.get("encuestaDiasDespues") ?? ""), 10);
  if (Number.isFinite(encDias) && encDias >= 0 && encDias <= 30) {
    await setAjuste("encuestaDiasDespues", String(encDias));
  }

  const MAX_LARGO = 2000;
  const asunto = String(formData.get("emailRecordatorioAsunto") ?? "").trim();
  await setAjuste(
    "emailRecordatorioAsunto",
    asunto ? asunto.slice(0, MAX_LARGO) : AJUSTES_DEFAULT.emailRecordatorioAsunto,
  );

  const cuerpo = String(formData.get("emailRecordatorioCuerpo") ?? "").trim();
  await setAjuste(
    "emailRecordatorioCuerpo",
    cuerpo ? cuerpo.slice(0, MAX_LARGO) : AJUSTES_DEFAULT.emailRecordatorioCuerpo,
  );

  const whatsappTexto = String(formData.get("whatsappRecordatorioTexto") ?? "").trim();
  await setAjuste(
    "whatsappRecordatorioTexto",
    whatsappTexto ? whatsappTexto.slice(0, MAX_LARGO) : AJUSTES_DEFAULT.whatsappRecordatorioTexto,
  );

  revalidatePath("/panel/ajustes");
  revalidatePath("/panel/citas/nueva");
  return { ok: true };
}
