import { whatsappConfigurado, emailConfigurado, env } from "@/lib/env";

/** Aviso visible cuando WhatsApp o Email están en modo dry-run (sin credenciales). */
export function ModoEnvioBanner() {
  if (env.FORCE_DRY_RUN || !whatsappConfigurado || !emailConfigurado) {
    const faltantes = [
      env.FORCE_DRY_RUN ? "modo prueba forzado" : null,
      !whatsappConfigurado ? "WhatsApp" : null,
      !emailConfigurado ? "Email" : null,
    ]
      .filter(Boolean)
      .join(" · ");
    return (
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-800">
        Modo prueba ({faltantes}): los mensajes se registran pero <strong>no se envían</strong>.
        Configurá las credenciales en <code>.env.local</code> para activar los envíos reales.
      </div>
    );
  }
  return null;
}
