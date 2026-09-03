/**
 * Verifica las consultas del tablero de inicio con datos de ejemplo.
 *   npm run verificar:tablero   (requiere db:local corriendo + prisma:push)
 */
void (async () => {
  const { prisma } = await import("../src/lib/prisma");
  const { resumenTablero } = await import("../src/lib/panel-data");
  const { crWallToUtc, utcToCrWall } = await import("../src/lib/timezone");

  await prisma.mensajeLog.deleteMany({});
  await prisma.cita.deleteMany({});
  await prisma.cliente.deleteMany({});

  const u = await prisma.usuario.upsert({
    where: { email: "tester@local" },
    create: { authUserId: "local-tester", nombre: "Tester", email: "tester@local", rol: "ADMIN" },
    update: {},
  });

  const dia = (n: number) => utcToCrWall(new Date(Date.now() + n * 86400000)).fecha;

  const crear = (nombre: string, offsetDias: number, hora: string, extra: Record<string, unknown> = {}) =>
    prisma.cita.create({
      data: {
        cliente: { create: { nombre, email: `${nombre.toLowerCase()}@x.com`, telefono: "+50688990011" } },
        fechaHora: crWallToUtc(dia(offsetDias), hora),
        diasRecordatorio: 2,
        creadaPor: { connect: { id: u.id } },
        ...extra,
      },
    });

  const hoy1 = await crear("HoyUno", 0, "10:00");
  await crear("HoyDos", 0, "15:30");
  await crear("EnTresDias", 3, "09:00"); // recordatorio pendiente (sale en 1 día)
  await crear("MananaSinAviso", 1, "11:00"); // recordatorio atrasado (debía salir ayer)
  await crear("EnDiezDias", 10, "14:00"); // fuera de los próximos 7
  await crear("Cancelada", 2, "08:00", { estado: "CANCELADA", canceladaEn: new Date() });

  // Un envío fallido para el bloque de fallos.
  await prisma.mensajeLog.create({
    data: {
      citaId: hoy1.id,
      canal: "WHATSAPP",
      tipo: "CONFIRMACION",
      estado: "FALLIDO",
      destino: "+50688990011",
      error: "(#132000) Number of parameters does not match",
    },
  });

  const r = await resumenTablero();
  console.log(JSON.stringify(
    {
      citasHoy: r.citasHoy.map((c) => c.cliente.nombre),
      proximos7: r.proximas.map((c) => c.cliente.nombre),
      recordatoriosPendientes: r.recordatoriosPendientes.map((c) => c.cliente.nombre),
      recordatoriosAtrasados: r.recordatoriosAtrasados.map((c) => c.cliente.nombre),
      fallidos: r.fallidos.map((m) => `${m.cita.cliente.nombre}/${m.canal}`),
      totales: r.totales,
    },
    null,
    2,
  ));

  await prisma.$disconnect();
  process.exit(0);
})();
