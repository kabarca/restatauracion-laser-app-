/**
 * Siembra para pruebas LOCALES (sin Supabase): un admin que funciona con
 * DEV_AUTOLOGIN_EMAIL + unas citas de ejemplo con sus mensajes registrados.
 * Idempotente. Lo llama `npm run local`.
 */
void (async () => {
  const { prisma } = await import("../src/lib/prisma");
  const { notificarConfirmacion } = await import("../src/lib/notificaciones");
  const { crWallToUtc, utcToCrWall } = await import("../src/lib/timezone");

  const email = process.env.DEV_AUTOLOGIN_EMAIL || "admin@local";

  const admin = await prisma.usuario.upsert({
    where: { email },
    create: { authUserId: `local-${email}`, nombre: "Admin (local)", email, rol: "ADMIN" },
    update: { rol: "ADMIN", activo: true },
  });
  console.log(`✔ Usuario admin: ${email}`);

  const yaHayCitas = (await prisma.cita.count()) > 0;
  if (yaHayCitas) {
    console.log("✔ Ya hay citas de ejemplo, no se agregan más.");
    await prisma.$disconnect();
    process.exit(0);
  }

  const dia = (n: number) => utcToCrWall(new Date(Date.now() + n * 86400000)).fecha;

  const ejemplos: {
    nombre: string;
    servicio: string;
    offset: number;
    hora: string;
    mismoDia: boolean;
    estado?: "COMPLETADA";
  }[] = [
    { nombre: "María Rodríguez", servicio: "remocion-de-oxido", offset: 2, hora: "09:00", mismoDia: false },
    { nombre: "Carlos Jiménez", servicio: "remocion-de-grafiti", offset: 4, hora: "14:30", mismoDia: true },
    { nombre: "Instituto Nacional de Seguros", servicio: "restauracion-patrimonial", offset: 9, hora: "10:00", mismoDia: false },
    { nombre: "Taller Vindas", servicio: "remocion-de-grasa-y-aceite", offset: 1, hora: "08:00", mismoDia: false },
    // Cita pasada (para probar la encuesta de satisfacción).
    { nombre: "Condominio Vista Real", servicio: "remocion-de-moho-y-biofilm", offset: -3, hora: "11:00", mismoDia: false, estado: "COMPLETADA" },
  ];

  for (const e of ejemplos) {
    const cita = await prisma.cita.create({
      data: {
        cliente: {
          create: {
            nombre: e.nombre,
            email: `${e.nombre.toLowerCase().replace(/[^a-z]+/g, ".")}@ejemplo.com`,
            telefono: "+50688990011",
          },
        },
        servicio: e.servicio,
        fechaHora: crWallToUtc(dia(e.offset), e.hora),
        diasRecordatorio: 2,
        recordatorioMismoDia: e.mismoDia,
        estado: e.estado ?? "AGENDADA",
        creadaPor: { connect: { id: admin.id } },
      },
    });
    if (e.offset >= 0) await notificarConfirmacion(cita.id);
    console.log(`✔ Cita de ejemplo: ${e.nombre} (${dia(e.offset)} ${e.hora})`);
  }

  console.log("\n✅ Datos de ejemplo listos. Los mensajes quedaron como SIMULADO (modo prueba).");
  await prisma.$disconnect();
  process.exit(0);
})();
