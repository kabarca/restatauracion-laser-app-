"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  puntaje: z.coerce.number().int().min(1).max(5),
  comentario: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type EncuestaState = { ok: boolean; error?: string };

export async function responderEncuesta(
  token: string,
  _prev: EncuestaState,
  formData: FormData,
): Promise<EncuestaState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Elegí una calificación de 1 a 5." };

  const encuesta = await prisma.encuesta.findUnique({ where: { token } });
  if (!encuesta) return { ok: false, error: "Encuesta no encontrada." };

  await prisma.encuesta.update({
    where: { token },
    data: {
      puntaje: parsed.data.puntaje,
      comentario: parsed.data.comentario ? parsed.data.comentario : null,
      respondidaEn: new Date(),
    },
  });

  revalidatePath(`/encuesta/${token}`);
  revalidatePath("/panel", "layout");
  return { ok: true };
}
