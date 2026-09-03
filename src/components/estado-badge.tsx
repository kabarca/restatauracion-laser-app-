import { cn } from "@/lib/cn";
import type { EstadoCita, EstadoMensaje } from "@/generated/prisma";

const CITA: Record<EstadoCita, { label: string; clase: string }> = {
  AGENDADA: { label: "Agendada", clase: "bg-blue-50 text-blue-700 border-blue-200" },
  RECORDADA: { label: "Recordada", clase: "bg-violet-50 text-violet-700 border-violet-200" },
  COMPLETADA: { label: "Completada", clase: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CANCELADA: { label: "Cancelada", clase: "bg-zinc-100 text-zinc-500 border-zinc-200" },
};

const MENSAJE: Record<EstadoMensaje, { label: string; clase: string }> = {
  ENVIADO: { label: "Enviado", clase: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  FALLIDO: { label: "Fallido", clase: "bg-red-50 text-red-700 border-red-200" },
  SIMULADO: { label: "Simulado", clase: "bg-amber-50 text-amber-700 border-amber-200" },
};

const base = "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium";

export function EstadoCitaBadge({ estado }: { estado: EstadoCita }) {
  const c = CITA[estado];
  return <span className={cn(base, c.clase)}>{c.label}</span>;
}

export function EstadoMensajeBadge({ estado }: { estado: EstadoMensaje }) {
  const c = MENSAJE[estado];
  return <span className={cn(base, c.clase)}>{c.label}</span>;
}
