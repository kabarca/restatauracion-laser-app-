/**
 * Verificación de integración de los flujos B y C sin pasar por la UI ni Supabase.
 * Requiere scripts/dev-db.ts corriendo y el schema aplicado (prisma db push).
 *
 *   npx tsx scripts/verificar-flujos.ts
 */
void (async () => {
  const { prisma } = await import("../src/lib/prisma");
  const { notificarConfirmacion } = await import("../src/lib/notificaciones");
  const { crWallToUtc, utcToCrWall } = await import("../src/lib/timezone");

  console.log("Limpiando datos de prueba previos…");
  await prisma.mensajeLog.deleteMany({});
  await prisma.cita.deleteMany({});
  await prisma.cliente.deleteMany({});
  await prisma.usuario.deleteMany({ where: { email: "tester@local" } });

  const usuario = await prisma.usuario.upsert({
    where: { email: "tester@local" },
    create: { authUserId: "local-tester", nombre: "Tester", email: "tester@local", rol: "ADMIN" },
    update: {},
  });

  // ── Flujo B: crear cita + confirmación inmediata ──────────────────────────
  const en2Dias = utcToCrWall(new Date(Date.now() + 2 * 86400000)).fecha;
  const cita = await prisma.cita.create({
    data: {
      cliente: { create: { nombre: "María Rodríguez", email: "maria@ejemplo.com", telefono: "+50688990011" } },
      servicio: "remocion-de-oxido",
      fechaHora: crWallToUtc(en2Dias, "14:30"),
      diasRecordatorio: 2,
      creadaPor: { connect: { id: usuario.id } },
    },
    include: { cliente: true },
  });
  console.log(`\nCita creada para ${en2Dias} 14:30 CR →`, cita.fechaHora.toISOString(), "UTC");

  await notificarConfirmacion(cita.id);

  const logsConfirmacion = await prisma.mensajeLog.findMany({ where: { citaId: cita.id } });
  console.log("\nFlujo B — MensajeLog de confirmación:");
  for (const l of logsConfirmacion) {
    console.log(`  ${l.canal.padEnd(9)} ${l.tipo.padEnd(13)} ${l.estado.padEnd(9)} → ${l.destino}`);
    const p = l.payload as Record<string, unknown>;
    if (l.canal === "WHATSAPP") console.log(`    template:`, JSON.stringify((p.template as object)));
    if (l.canal === "EMAIL") console.log(`    asunto:`, (p as { subject?: string }).subject);
  }

  const citaTrasConfirmar = await prisma.cita.findUniqueOrThrow({ where: { id: cita.id } });
  console.log("\n  confirmacionEnviadaEn:", citaTrasConfirmar.confirmacionEnviadaEn?.toISOString());

  // ── Flujo C: lógica del cron de recordatorios ────────────────────────────
  const ahora = new Date();
  const limite = new Date(ahora.getTime() + 32 * 86400000);
  const candidatas = await prisma.cita.findMany({
    where: {
      estado: { in: ["AGENDADA", "RECORDADA"] },
      recordatorioEnviadoEn: null,
      canceladaEn: null,
      fechaHora: { gte: ahora, lte: limite },
    },
    include: { cliente: true },
  });
  const fechaCrEnNDias = (n: number) => utcToCrWall(new Date(ahora.getTime() + n * 86400000)).fecha;

  const { notificarRecordatorio } = await import("../src/lib/notificaciones");
  let enviados = 0;
  for (const c of candidatas) {
    if (utcToCrWall(c.fechaHora).fecha > fechaCrEnNDias(c.diasRecordatorio)) continue;
    await notificarRecordatorio(c.id);
    enviados++;
  }
  console.log(`\nFlujo C — cron: ${candidatas.length} candidata(s), ${enviados} recordatorio(s) enviado(s)`);

  const logsRecordatorio = await prisma.mensajeLog.findMany({
    where: { citaId: cita.id, tipo: "RECORDATORIO" },
  });
  for (const l of logsRecordatorio) {
    console.log(`  ${l.canal.padEnd(9)} ${l.estado.padEnd(9)} → ${l.destino}`);
  }

  const citaFinal = await prisma.cita.findUniqueOrThrow({ where: { id: cita.id } });
  console.log("\n  estado:", citaFinal.estado, "| recordatorioEnviadoEn:", citaFinal.recordatorioEnviadoEn?.toISOString());

  // ── Idempotencia: correr el cron de nuevo no debe re-enviar ──────────────
  const candidatas2 = await prisma.cita.findMany({
    where: { estado: { in: ["AGENDADA", "RECORDADA"] }, recordatorioEnviadoEn: null, canceladaEn: null },
  });
  console.log(`\nIdempotencia — segunda pasada del cron: ${candidatas2.length} candidata(s) (debe ser 0)`);

  console.log("\n✅ Verificación completada.");
  await prisma.$disconnect();
  process.exit(0);
})();
