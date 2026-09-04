"use client";

import { useEffect, useState } from "react";
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

const PRIORITARIOS: CountryCode[] = ["CR", "US", "NI", "PA", "MX", "CO", "GT", "HN", "SV", "ES"];

type PaisOpt = { iso: CountryCode; code: string; nombre: string };

/**
 * Lista base SIN Intl: se renderiza en el servidor y en la primera hidratación,
 * así el HTML del server y del cliente coinciden (evita el error de hidratación).
 * El orden es por código ISO, 100% determinista.
 */
function listaBase(): PaisOpt[] {
  const todos: PaisOpt[] = getCountries().map((iso) => ({
    iso,
    code: getCountryCallingCode(iso),
    nombre: iso,
  }));
  const prio = PRIORITARIOS.map((iso) => todos.find((p) => p.iso === iso)).filter(
    (p): p is PaisOpt => Boolean(p),
  );
  const resto = todos
    .filter((p) => !PRIORITARIOS.includes(p.iso))
    .sort((a, b) => (a.iso < b.iso ? -1 : 1));
  return [...prio, ...resto];
}

/** Lista con nombres en español y orden alfabético — solo en el cliente. */
function listaLocalizada(): PaisOpt[] {
  let dn: Intl.DisplayNames | null = null;
  try {
    dn = new Intl.DisplayNames(["es"], { type: "region" });
  } catch {
    dn = null;
  }
  const nombreDe = (iso: string) => dn?.of(iso) ?? iso;
  const todos: PaisOpt[] = getCountries().map((iso) => ({
    iso,
    code: getCountryCallingCode(iso),
    nombre: nombreDe(iso),
  }));
  const prio = PRIORITARIOS.map((iso) => todos.find((p) => p.iso === iso)).filter(
    (p): p is PaisOpt => Boolean(p),
  );
  const resto = todos
    .filter((p) => !PRIORITARIOS.includes(p.iso))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return [...prio, ...resto];
}

function etiquetaPais(p: PaisOpt): string {
  return p.nombre === p.iso ? `${p.iso}  +${p.code}` : `${p.nombre} (+${p.code})`;
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
  const [paises, setPaises] = useState<PaisOpt[]>(listaBase);
  const [pais, setPais] = useState<CountryCode>(defaultPais);
  const [numero, setNumero] = useState(defaultNumero);

  useEffect(() => {
    setPaises(listaLocalizada());
  }, []);

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
          className="campo max-w-[11.5rem]"
          value={pais}
          onChange={(e) => setPais(e.target.value as CountryCode)}
        >
          {paises.map((p) => (
            <option key={p.iso} value={p.iso}>
              {etiquetaPais(p)}
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
