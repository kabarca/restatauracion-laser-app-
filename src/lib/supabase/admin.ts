import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Cliente con service_role — SOLO en servidor. Se usa para crear/eliminar
 * miembros del equipo en Supabase Auth desde el panel de ADMIN.
 */
export function createSupabaseAdminClient() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY — necesaria para administrar usuarios del equipo.",
    );
  }
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
