"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { IconoChevronDown, IconoReloj } from "@/components/icons";

const horaFmt = new Intl.DateTimeFormat("es-CR", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "UTC",
});

/** "14:30" → "2:30 p.m." (formato de pared, sin conversión de zona horaria). */
function formatoHora12(hhmm: string): string {
  const [hh, mm] = hhmm.split(":").map(Number);
  const texto = horaFmt
    .format(new Date(Date.UTC(2000, 0, 1, hh || 0, mm || 0)))
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\ba\.?\s?m\.?$/i, "a.m.")
    .replace(/\bp\.?\s?m\.?$/i, "p.m.");
  return texto;
}

function generarOpciones(pasoMin: number, desde = "06:00", hasta = "20:00"): string[] {
  const [h0, m0] = desde.split(":").map(Number);
  const [h1, m1] = hasta.split(":").map(Number);
  const opciones: string[] = [];
  for (let t = h0 * 60 + m0; t <= h1 * 60 + m1; t += pasoMin) {
    opciones.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
  }
  return opciones;
}

export function TimePicker({
  id,
  name,
  value,
  onChange,
  paso = 15,
}: {
  id?: string;
  name?: string;
  value: string;
  onChange: (v: string) => void;
  paso?: number;
}) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const seleccionadoRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onClickFuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    if (abierto) document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, [abierto]);

  useEffect(() => {
    if (abierto) seleccionadoRef.current?.scrollIntoView({ block: "center" });
  }, [abierto]);

  const opciones = generarOpciones(paso);
  if (value && !opciones.includes(value)) {
    opciones.push(value);
    opciones.sort();
  }

  return (
    <div className="relative" ref={ref}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        id={id}
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="campo flex items-center justify-between gap-2 whitespace-nowrap text-left"
      >
        <span className="flex items-center gap-2 text-zinc-800">
          <IconoReloj className="h-4 w-4 text-zinc-400" />
          {value ? formatoHora12(value) : <span className="text-zinc-400">Elegí una hora</span>}
        </span>
        <IconoChevronDown className={cn("h-4 w-4 text-zinc-400 transition", abierto && "rotate-180")} />
      </button>

      {abierto && (
        <div className="absolute z-20 mt-1.5 max-h-64 w-44 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg">
          {opciones.map((hhmm) => {
            const seleccionado = hhmm === value;
            return (
              <button
                key={hhmm}
                ref={seleccionado ? seleccionadoRef : undefined}
                type="button"
                onClick={() => {
                  onChange(hhmm);
                  setAbierto(false);
                }}
                className={cn(
                  "block w-full rounded-lg px-3 py-1.5 text-left text-sm transition",
                  seleccionado ? "bg-marca font-semibold text-white" : "text-zinc-700 hover:bg-zinc-100",
                )}
              >
                {formatoHora12(hhmm)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
