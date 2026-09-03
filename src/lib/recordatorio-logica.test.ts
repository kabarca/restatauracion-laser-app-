import { describe, it, expect } from "vitest";
import {
  debeEnviarRecordatorio,
  debeEnviarRecordatorioDia,
  debeEnviarEncuesta,
} from "./recordatorio-logica";
import { crWallToUtc } from "./timezone";

// "Ahora" fijo: 2026-09-05 09:00 CR = 15:00 UTC (cuando corre el cron).
const AHORA = new Date("2026-09-05T15:00:00.000Z");

const citaBase = {
  diasRecordatorio: 2,
  recordatorioEnviadoEn: null as Date | null,
  recordatorioMismoDia: false,
  recordatorioDiaEnviadoEn: null as Date | null,
  canceladaEn: null as Date | null,
  estado: "AGENDADA",
};

describe("debeEnviarRecordatorio", () => {
  it("envía cuando la cita es exactamente a N días", () => {
    const cita = { ...citaBase, fechaHora: crWallToUtc("2026-09-07", "10:00") };
    expect(debeEnviarRecordatorio(cita, AHORA)).toBe(true);
  });

  it("envía también si la cita quedó dentro de la ventana (creada tarde)", () => {
    const cita = { ...citaBase, fechaHora: crWallToUtc("2026-09-06", "10:00") };
    expect(debeEnviarRecordatorio(cita, AHORA)).toBe(true);
  });

  it("NO envía si todavía falta más que N días", () => {
    const cita = { ...citaBase, fechaHora: crWallToUtc("2026-09-09", "10:00") };
    expect(debeEnviarRecordatorio(cita, AHORA)).toBe(false);
  });

  it("NO reenvía si ya se envió", () => {
    const cita = {
      ...citaBase,
      fechaHora: crWallToUtc("2026-09-07", "10:00"),
      recordatorioEnviadoEn: new Date(),
    };
    expect(debeEnviarRecordatorio(cita, AHORA)).toBe(false);
  });

  it("NO envía para citas canceladas o pasadas", () => {
    expect(
      debeEnviarRecordatorio(
        { ...citaBase, fechaHora: crWallToUtc("2026-09-07", "10:00"), estado: "CANCELADA" },
        AHORA,
      ),
    ).toBe(false);
    expect(
      debeEnviarRecordatorio({ ...citaBase, fechaHora: crWallToUtc("2026-09-01", "10:00") }, AHORA),
    ).toBe(false);
  });
});

describe("debeEnviarRecordatorioDia", () => {
  it("envía la mañana de la cita si está activado", () => {
    const cita = {
      ...citaBase,
      recordatorioMismoDia: true,
      fechaHora: crWallToUtc("2026-09-05", "16:00"),
    };
    expect(debeEnviarRecordatorioDia(cita, AHORA)).toBe(true);
  });

  it("NO envía si no está activado", () => {
    const cita = { ...citaBase, fechaHora: crWallToUtc("2026-09-05", "16:00") };
    expect(debeEnviarRecordatorioDia(cita, AHORA)).toBe(false);
  });

  it("NO envía en un día que no es el de la cita", () => {
    const cita = {
      ...citaBase,
      recordatorioMismoDia: true,
      fechaHora: crWallToUtc("2026-09-06", "16:00"),
    };
    expect(debeEnviarRecordatorioDia(cita, AHORA)).toBe(false);
  });
});

describe("debeEnviarEncuesta", () => {
  const base = { canceladaEn: null as Date | null, estado: "COMPLETADA", tieneEncuesta: false };

  it("envía 1 día después de la cita", () => {
    const cita = { ...base, fechaHora: crWallToUtc("2026-09-04", "10:00") };
    expect(debeEnviarEncuesta(cita, AHORA, 1)).toBe(true);
  });

  it("NO envía si la cita fue hoy", () => {
    const cita = { ...base, fechaHora: crWallToUtc("2026-09-05", "08:00") };
    expect(debeEnviarEncuesta(cita, AHORA, 1)).toBe(false);
  });

  it("NO envía si ya tiene encuesta o está cancelada", () => {
    const f = crWallToUtc("2026-09-01", "10:00");
    expect(debeEnviarEncuesta({ ...base, fechaHora: f, tieneEncuesta: true }, AHORA, 1)).toBe(false);
    expect(debeEnviarEncuesta({ ...base, fechaHora: f, estado: "CANCELADA" }, AHORA, 1)).toBe(false);
  });

  it("NO envía para citas de hace más de 30 días", () => {
    const cita = { ...base, fechaHora: crWallToUtc("2026-07-01", "10:00") };
    expect(debeEnviarEncuesta(cita, AHORA, 1)).toBe(false);
  });
});
