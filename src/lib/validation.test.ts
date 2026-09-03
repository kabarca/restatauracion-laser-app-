import { describe, it, expect } from "vitest";
import { normalizarTelefono, citaFormSchema } from "./validation";

describe("normalizarTelefono", () => {
  it("normaliza un número de Costa Rica a E.164", () => {
    expect(normalizarTelefono("8899 0011", "CR")).toBe("+50688990011");
    expect(normalizarTelefono("+506 8899 0011")).toBe("+50688990011");
  });

  it("acepta otros países", () => {
    expect(normalizarTelefono("(305) 555-0123", "US")).toBe("+13055550123");
  });

  it("rechaza números inválidos", () => {
    expect(() => normalizarTelefono("123", "CR")).toThrow();
    expect(() => normalizarTelefono("", "CR")).toThrow();
  });
});

describe("citaFormSchema", () => {
  const futura = () => {
    const d = new Date(Date.now() + 5 * 24 * 3600 * 1000);
    return d.toISOString().slice(0, 10);
  };

  const base = {
    clienteNombre: "Ana Solís",
    clienteEmail: "ana@ejemplo.com",
    clienteTelefono: "8899 0011",
    clientePais: "CR",
    hora: "09:00",
  };

  it("acepta una cita válida y normaliza teléfono + fechaHora", () => {
    const r = citaFormSchema.safeParse({ ...base, fecha: futura() });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.telefonoE164).toBe("+50688990011");
      expect(r.data.fechaHora).toBeInstanceOf(Date);
      expect(r.data.recordatorioMismoDia).toBe(false);
    }
  });

  it("marca recordatorioMismoDia cuando el checkbox viene 'on'", () => {
    const r = citaFormSchema.safeParse({ ...base, fecha: futura(), recordatorioMismoDia: "on" });
    expect(r.success && r.data.recordatorioMismoDia).toBe(true);
  });

  it("rechaza fecha en el pasado", () => {
    const r = citaFormSchema.safeParse({ ...base, fecha: "2020-01-01" });
    expect(r.success).toBe(false);
  });

  it("rechaza teléfono inválido para el país", () => {
    const r = citaFormSchema.safeParse({ ...base, fecha: futura(), clienteTelefono: "1" });
    expect(r.success).toBe(false);
  });

  it("rechaza servicio desconocido", () => {
    const r = citaFormSchema.safeParse({ ...base, fecha: futura(), servicio: "inventado" });
    expect(r.success).toBe(false);
  });
});
