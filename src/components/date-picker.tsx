"use client";

import { useEffect, useRef, useState } from "react";
import { formatMesLargo, grillaMes, mesActualCr, mesRelativo } from "@/lib/timezone";
import { cn } from "@/lib/cn";
import { IconoCalendario, IconoChevronDown, IconoChevronLeft, IconoChevronRight } from "@/components/icons";

const DIAS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

const fechaCortaFmt = new Intl.DateTimeFormat("es-CR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "2026-09-04" → "Vie 4 sept 2026" (fecha de calendario pura, sin hora). */
function formatoCorto(fecha: string): string {
  const texto = fechaCortaFmt.format(new Date(`${fecha}T12:00:00Z`)).replace(",", "");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function DatePicker({
  id,
  name,
  value,
  onChange,
  min,
  placeholder = "Elegí una fecha",
}: {
  id?: string;
  name?: string;
  value: string;
  onChange: (v: string) => void;
  min?: string;
  placeholder?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [mesVisible, setMesVisible] = useState(() => (value || min || mesActualCr()).slice(0, 7));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickFuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    if (abierto) document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, [abierto]);

  useEffect(() => {
    if (abierto) setMesVisible((value || min || mesActualCr()).slice(0, 7));
  }, [abierto, value, min]);

  const grilla = grillaMes(mesVisible);
  const hoy = mesActualCr();

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
          <IconoCalendario className="h-4 w-4 text-zinc-400" />
          {value ? formatoCorto(value) : <span className="text-zinc-400">{placeholder}</span>}
        </span>
        <IconoChevronDown className={cn("h-4 w-4 text-zinc-400 transition", abierto && "rotate-180")} />
      </button>

      {abierto && (
        <div className="absolute z-20 mt-1.5 w-72 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMesVisible((m) => mesRelativo(m, -1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            >
              <IconoChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-zinc-900">{formatMesLargo(mesVisible)}</span>
            <button
              type="button"
              onClick={() => setMesVisible((m) => mesRelativo(m, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            >
              <IconoChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center">
            {DIAS.map((d) => (
              <span key={d} className="text-[11px] font-medium uppercase text-zinc-400">
                {d}
              </span>
            ))}
            {grilla.map((dia) => {
              const deshabilitado = Boolean(min) && dia.fecha < (min as string);
              const seleccionado = dia.fecha === value;
              return (
                <button
                  key={dia.fecha}
                  type="button"
                  disabled={deshabilitado}
                  onClick={() => {
                    onChange(dia.fecha);
                    setAbierto(false);
                  }}
                  className={cn(
                    "mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition",
                    !dia.enMes && "text-zinc-300",
                    dia.enMes && !seleccionado && "text-zinc-700 hover:bg-zinc-100",
                    dia.fecha === hoy && !seleccionado && "font-semibold text-marca",
                    seleccionado && "bg-marca font-semibold text-white",
                    deshabilitado && "cursor-not-allowed text-zinc-200 hover:bg-transparent",
                  )}
                >
                  {Number(dia.fecha.slice(8, 10))}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              onChange(hoy);
              setMesVisible(hoy.slice(0, 7));
              setAbierto(false);
            }}
            className="mt-2 w-full rounded-lg py-1.5 text-center text-sm font-medium text-zinc-600 hover:bg-zinc-100"
          >
            Hoy
          </button>
        </div>
      )}
    </div>
  );
}
