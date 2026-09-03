"use client";

import { useMemo, useState } from "react";
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

const PRIORITARIOS: CountryCode[] = ["CR", "US", "NI", "PA", "MX", "CO", "GT", "HN", "SV", "ES"];

const nombreRegion = new Intl.DisplayNames(["es"], { type: "region" });

type PaisOpt = { iso: CountryCode; code: string; nombre: string };

function construirPaises(): PaisOpt[] {
  const todos: PaisOpt[] = getCountries().map((iso) => ({
    iso,
    code: getCountryCallingCode(iso),
    nombre: nombreRegion.of(iso) ?? iso,
  }));
  const prio = PRIORITARIOS.map((iso) => todos.find((p) => p.iso === iso)).filter(
    (p): p is PaisOpt => Boolean(p),
  );
  const resto = todos
    .filter((p) => !PRIORITARIOS.includes(p.iso))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return [...prio, ...resto];
}

export function TelefonoInput({
  defaultPais = "CR",
  defaultNumero = "",
  error,
}: {
  defaultPais?: CountryCode;
  defaultNumero?: string;
  error?: string;
}) {
  const paises = useMemo(construirPaises, []);
  const [pais, setPais] = useState<CountryCode>(defaultPais);
  const [numero, setNumero] = useState(defaultNumero);

  const formateado = new AsYouType(pais).input(numero);
  const parsed = numero ? parsePhoneNumberFromString(numero, pais) : undefined;
  const valido = parsed?.isValid() ?? false;

  return (
    <div>
      <label className="etiqueta" htmlFor="clienteTelefono">
        Teléfono (WhatsApp)
      </label>
      <div className="flex gap-2">
        <select
          name="clientePais"
          aria-label="País"
          className="campo max-w-[9.5rem]"
          value={pais}
          onChange={(e) => setPais(e.target.value as CountryCode)}
        >
          {paises.map((p) => (
            <option key={p.iso} value={p.iso}>
              {p.iso} +{p.code}
            </option>
          ))}
        </select>
        <input
          id="clienteTelefono"
          name="clienteTelefono"
          inputMode="tel"
          autoComplete="tel"
          required
          className="campo"
          placeholder="8888 8888"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
        />
      </div>
      <p className="mt-1 text-xs text-zinc-400">
        {numero
          ? valido
            ? `Se guardará como ${parsed?.number}`
            : `Formato: ${formateado || "…"} — revisá el número`
          : "Elegí el país y escribí el número."}
      </p>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
