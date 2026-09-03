import { describe, it, expect } from "vitest";
import {
  crWallToUtc,
  utcToCrWall,
  formatFechaLarga,
  formatHora,
  formatFechaHora,
  rangoDiaCrUtc,
} from "./timezone";

describe("crWallToUtc / utcToCrWall", () => {
  it("convierte hora de pared de Costa Rica a UTC (UTC-6 fijo)", () => {
    // 14:30 en Costa Rica = 20:30 UTC
    expect(crWallToUtc("2026-09-05", "14:30").toISOString()).toBe("2026-09-05T20:30:00.000Z");
    // medianoche CR = 06:00 UTC del mismo día
    expect(crWallToUtc("2026-01-01", "00:00").toISOString()).toBe("2026-01-01T06:00:00.000Z");
  });

  it("es reversible", () => {
    const d = crWallToUtc("2026-12-24", "08:15");
    expect(utcToCrWall(d)).toEqual({ fecha: "2026-12-24", hora: "08:15" });
  });

  it("una cita nocturna en CR cae al día siguiente en UTC pero conserva su fecha CR", () => {
    const d = crWallToUtc("2026-09-05", "23:00");
    expect(d.toISOString()).toBe("2026-09-06T05:00:00.000Z");
    expect(utcToCrWall(d).fecha).toBe("2026-09-05");
  });

  it("rechaza entradas inválidas", () => {
    expect(() => crWallToUtc("no-es-fecha", "10:00")).toThrow();
    expect(() => crWallToUtc("2026-09-05", "99:99")).toThrow();
  });
});

describe("formato en español de Costa Rica", () => {
  const d = crWallToUtc("2026-09-07", "14:30"); // lunes

  it("fecha larga sin coma tras el día de la semana", () => {
    expect(formatFechaLarga(d)).toBe("lunes 7 de septiembre de 2026");
  });

  it("hora en formato 12h compacto", () => {
    expect(formatHora(d)).toBe("2:30 p.m.");
    expect(formatHora(crWallToUtc("2026-09-07", "09:00"))).toBe("9:00 a.m.");
  });

  it("fecha y hora combinadas", () => {
    expect(formatFechaHora(d)).toBe("lunes 7 de septiembre de 2026 a las 2:30 p.m.");
  });
});

describe("rangoDiaCrUtc", () => {
  it("cubre un día de calendario CR completo en instantes UTC", () => {
    const ahora = new Date("2026-09-05T12:00:00.000Z"); // 06:00 CR
    const { inicio, fin } = rangoDiaCrUtc(0, ahora);
    expect(inicio.toISOString()).toBe("2026-09-05T06:00:00.000Z"); // 00:00 CR
    expect(fin.toISOString()).toBe("2026-09-06T06:00:00.000Z");
  });

  it("desplaza N días", () => {
    const ahora = new Date("2026-09-05T12:00:00.000Z");
    expect(rangoDiaCrUtc(2, ahora).inicio.toISOString()).toBe("2026-09-07T06:00:00.000Z");
  });
});
