import { env, dryRun } from "@/lib/env";
import { conReintentos } from "@/lib/reintentos";

export type ResultadoEnvio = {
  estado: "ENVIADO" | "FALLIDO" | "SIMULADO";
  proveedorId?: string;
  error?: string;
  intentos?: number;
  payload: unknown;
};

type PlantillaParams = {
  to: string; // E.164 sin el "+", o con "+" (Meta acepta ambos)
  template: string;
  locale: string;
  /** Parámetros del componente BODY, en orden ({{1}}, {{2}}, ...). */
  bodyParams: string[];
};

class ErrorTransitorio extends Error {}

/**
 * Envía una plantilla (HSM) por WhatsApp Cloud API, con reintentos ante fallos
 * transitorios (HTTP 429 / 5xx / error de red).
 * En dry-run devuelve estado "SIMULADO" con el payload que se habría enviado.
 */
export async function enviarPlantillaWhatsapp({
  to,
  template,
  locale,
  bodyParams,
}: PlantillaParams): Promise<ResultadoEnvio> {
  // "hello_world" es la plantilla de demo de Meta y no lleva parámetros — útil
  // para un primer test de conectividad antes de tener plantillas propias.
  const sinParametros = template === "hello_world" || bodyParams.length === 0;

  const payload = {
    messaging_product: "whatsapp",
    to: to.replace(/^\+/, ""),
    type: "template",
    template: {
      name: template,
      language: { code: template === "hello_world" ? "en_US" : locale },
      ...(sinParametros
        ? {}
        : {
            components: [
              { type: "body", parameters: bodyParams.map((text) => ({ type: "text", text })) },
            ],
          }),
    },
  };

  if (dryRun("whatsapp")) {
    return { estado: "SIMULADO", payload };
  }

  const url = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  let intentos = 0;

  try {
    const r = await conReintentos<ResultadoEnvio>(
      async () => {
        intentos++;
        let res: Response;
        try {
          res = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });
        } catch (e) {
          throw new ErrorTransitorio(e instanceof Error ? e.message : "error de red");
        }

        const json = (await res.json().catch(() => ({}))) as {
          messages?: { id: string }[];
          error?: { message?: string; error_data?: { details?: string } };
        };

        if (res.status === 429 || res.status >= 500) {
          throw new ErrorTransitorio(
            json.error?.message || `HTTP ${res.status} (reintentable)`,
          );
        }
        if (!res.ok) {
          const msg =
            json.error?.error_data?.details || json.error?.message || `HTTP ${res.status}`;
          return { estado: "FALLIDO", error: msg, payload };
        }
        return { estado: "ENVIADO", proveedorId: json.messages?.[0]?.id, payload };
      },
      { esTransitorio: (x) => x instanceof ErrorTransitorio },
    );
    return { ...r, intentos };
  } catch (e) {
    return {
      estado: "FALLIDO",
      error: e instanceof Error ? e.message : "Error al llamar a Meta",
      intentos,
      payload,
    };
  }
}
