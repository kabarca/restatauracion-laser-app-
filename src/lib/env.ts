import { z } from "zod";

/**
 * Validación de variables de entorno. Las credenciales de WhatsApp / Resend son
 * opcionales: si faltan, el sistema corre en modo dry-run (registra el mensaje
 * que habría enviado, sin enviarlo). Ver src/lib/whatsapp.ts y src/lib/email.ts.
 */
const schema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .pipe(z.string().url().optional()),

  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),

  WHATSAPP_PHONE_NUMBER_ID: z.string().optional().default(""),
  WHATSAPP_ACCESS_TOKEN: z.string().optional().default(""),
  WHATSAPP_API_VERSION: z.string().default("v21.0"),
  WHATSAPP_TEMPLATE_CONFIRMACION: z.string().default("confirmacion_cita"),
  WHATSAPP_TEMPLATE_RECORDATORIO: z.string().default("recordatorio_cita"),
  WHATSAPP_TEMPLATE_LOCALE: z.string().default("es"),

  RESEND_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().default("Restauración Láser <onboarding@resend.dev>"),
  EMAIL_EQUIPO: z.string().optional().default(""),

  WHATSAPP_CONTACTO_PUBLICO: z.string().default("+506 8901 9811"),

  CRON_SECRET: z.string().optional().default(""),

  FORCE_DRY_RUN: z
    .enum(["true", "false"])
    .optional()
    .default("false")
    .transform((v) => v === "true"),
  RECORDATORIO_DIAS_DEFAULT: z
    .string()
    .optional()
    .default("2")
    .transform((v) => Math.max(0, parseInt(v, 10) || 2)),

  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Variables de entorno inválidas:",
    JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
  );
  throw new Error("Revisá tu .env.local — faltan o están mal variables requeridas.");
}

export const env = parsed.data;

export const whatsappConfigurado =
  env.WHATSAPP_PHONE_NUMBER_ID.length > 0 && env.WHATSAPP_ACCESS_TOKEN.length > 0;

export const emailConfigurado = env.RESEND_API_KEY.length > 0;

/** true cuando NO se debe enviar de verdad (falta credencial o se forzó dry-run). */
export function dryRun(canal: "whatsapp" | "email"): boolean {
  if (env.FORCE_DRY_RUN) return true;
  return canal === "whatsapp" ? !whatsappConfigurado : !emailConfigurado;
}
