"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function CerrarSesion() {
  const router = useRouter();
  async function salir() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }
  return (
    <button onClick={salir} className="text-sm text-zinc-500 hover:text-zinc-900">
      Cerrar sesión
    </button>
  );
}
