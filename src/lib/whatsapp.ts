import { env, dryRun } from "@/lib/env";

export type ResultadoEnvio = {
  estado: "ENVIADO" | "FALLIDO" | "SIMULADO";
  proveedorId?: string;
  error?: string;
  payload: unknown;
};

type PlantillaParams = {
  to: string; // E.164 sin el "+", o con "+" (Meta acepta ambos)
  template: string;
  locale: string;
  /** Parámetros del componente BODY, en orden ({{1}}, {{2}}, ...). */
  bodyParams: string[];
};

/**
 * Envía una plantilla (HSM) por WhatsApp Cloud API.
 * En dry-run devuelve estado "SIMULADO" con el payload que se habría enviado.
 */
export async function enviarPlantillaWhatsapp({
  to,
  template,
  locale,
  bodyParams,
}: PlantillaParams): Promise<ResultadoEnvio> {
  const payload = {
    messaging_product: "whatsapp",
    to: to.replace(/^\+/, ""),
    type: "template",
    template: {
      name: template,
      language: { code: locale },
      components: [
        {
          type: "body",
          parameters: bodyParams.map((text) => ({ type: "text", text })),
        },
      ],
    },
  };

  if (dryRun("whatsapp")) {
    return { estado: "SIMULADO", payload };
  }

  const url = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = (await res.json()) as {
      messages?: { id: string }[];
      error?: { message?: string; error_data?: { details?: string } };
    };

    if (!res.ok) {
      const msg =
        json.error?.error_data?.details ||
        json.error?.message ||
        `HTTP ${res.status}`;
      return { estado: "FALLIDO", error: msg, payload };
    }

    return { estado: "ENVIADO", proveedorId: json.messages?.[0]?.id, payload };
  } catch (e) {
    return {
      estado: "FALLIDO",
      error: e instanceof Error ? e.message : "Error de red al llamar a Meta",
      payload,
    };
  }
}
