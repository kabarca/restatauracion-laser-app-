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

  revalidatePath("/panel/ajustes");
  revalidatePath("/panel/citas/nueva");
  return { ok: true };
}
