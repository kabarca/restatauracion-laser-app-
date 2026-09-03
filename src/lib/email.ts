import { Resend } from "resend";
import { env, dryRun } from "@/lib/env";
import type { ResultadoEnvio } from "@/lib/whatsapp";
import { conReintentos } from "@/lib/reintentos";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const ERRORES_TRANSITORIOS = new Set([
  "rate_limit_exceeded",
  "internal_server_error",
  "application_error",
]);

type EnviarEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

class ErrorTransitorio extends Error {}

/** Envía un correo con Resend, con reintentos ante fallos transitorios. */
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

  let intentos = 0;
  try {
    const r = await conReintentos<ResultadoEnvio>(
      async () => {
        intentos++;
        const { data, error } = await resend.emails.send({
          from: env.EMAIL_FROM,
          to,
          subject,
          html,
          text,
          ...(replyTo ? { replyTo } : {}),
        });
        if (error) {
          if (ERRORES_TRANSITORIOS.has(error.name)) {
            throw new ErrorTransitorio(error.message);
          }
          return { estado: "FALLIDO", error: error.message, payload };
        }
        return { estado: "ENVIADO", proveedorId: data?.id, payload };
      },
      { esTransitorio: (x) => x instanceof ErrorTransitorio },
    );
    return { ...r, intentos };
  } catch (e) {
    return {
      estado: "FALLIDO",
      error: e instanceof Error ? e.message : "Error al llamar a Resend",
      intentos,
      payload,
    };
  }
}
