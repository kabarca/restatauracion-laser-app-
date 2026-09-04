import { describe, it, expect } from "vitest";
import {
  crWallToUtc,
  utcToCrWall,
  formatFechaLarga,
  formatHora,
  formatFechaHora,
  rangoDiaCrUtc,
  mesActualCr,
  mesRelativo,
  formatMesLargo,
  grillaMes,
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

describe("vista de calendario (mes)", () => {
  it("mesActualCr / mesRelativo", () => {
    const ahora = new Date("2026-09-05T12:00:00.000Z"); // 06:00 CR, sigue siendo 5/09
    expect(mesActualCr(ahora)).toBe("2026-09");
    expect(mesRelativo("2026-09", 1)).toBe("2026-10");
    expect(mesRelativo("2026-01", -1)).toBe("2025-12");
    expect(mesRelativo("2026-12", 1)).toBe("2027-01");
  });

  it("formatMesLargo", () => {
    expect(formatMesLargo("2026-09")).toBe("Septiembre de 2026");
  });

  it("grillaMes empieza en lunes y cubre todo el mes", () => {
    const g = grillaMes("2026-09"); // 1 de sept 2026 es martes
    expect(g.length % 7).toBe(0);
    expect(g[0].fecha).toBe("2026-08-31"); // lunes anterior
    expect(g.some((d) => d.fecha === "2026-09-01" && d.enMes)).toBe(true);
    expect(g.some((d) => d.fecha === "2026-09-30" && d.enMes)).toBe(true);
    // días fuera del mes están marcados
    expect(g.find((d) => d.fecha === "2026-08-31")?.enMes).toBe(false);
  });

  it("grillaMes marca 'hoy' correctamente", () => {
    const ahora = new Date("2026-09-05T12:00:00.000Z");
    const g = grillaMes("2026-09", ahora);
    expect(g.find((d) => d.fecha === "2026-09-05")?.hoy).toBe(true);
    expect(g.find((d) => d.fecha === "2026-09-06")?.hoy).toBe(false);
  });

  it("grillaMes recorta la última semana si es enteramente del mes siguiente", () => {
    // Febrero 2026 cabe en 5 semanas (35 celdas): la 6ª sería toda de marzo.
    expect(grillaMes("2026-02").length).toBe(35);
    // Noviembre 2026 necesita las 6 semanas completas (42 celdas).
    expect(grillaMes("2026-11").length).toBe(42);
  });
});
