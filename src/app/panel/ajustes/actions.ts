"use server";

import { revalidatePath } from "next/cache";
import { requireRol } from "@/lib/auth";
import { setAjuste } from "@/lib/ajustes";

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

  revalidatePath("/panel/ajustes");
  revalidatePath("/panel/citas/nueva");
  return { ok: true };
}
