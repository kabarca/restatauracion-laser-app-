import { Resend } from "resend";
import { env, dryRun } from "@/lib/env";
import type { ResultadoEnvio } from "@/lib/whatsapp";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

type EnviarEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

/** Envía un correo con Resend. En dry-run devuelve estado "SIMULADO". */
export async function enviarEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}: EnviarEmailArgs): Promise<ResultadoEnvio> {
  const payload = { from: env.EMAIL_FROM, to, subject, replyTo };

  if (dryRun("email") || !resend) {
    return { estado: "SIMULADO", payload: { ...payload, text } };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
      text,
      ...(replyTo ? { replyTo } : {}),
    });

    if (error) {
      return { estado: "FALLIDO", error: error.message, payload };
    }
    return { estado: "ENVIADO", proveedorId: data?.id, payload };
  } catch (e) {
    return {
      estado: "FALLIDO",
      error: e instanceof Error ? e.message : "Error al llamar a Resend",
      payload,
    };
  }
}
