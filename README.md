# Restauración Láser — Sistema de recordatorios de citas

Herramienta interna (standalone) para coordinar citas y enviar **confirmaciones**
y **recordatorios** automáticos por WhatsApp y correo.

- **Flujo A:** un miembro del equipo agenda una cita en el panel.
- **Flujo B:** al guardar, se envía de inmediato la confirmación (WhatsApp + correo).
- **Flujo C:** un job diario (9:00 a.m. Costa Rica) envía el recordatorio N días
  antes (por defecto 2), una sola vez por cita.

## Stack

| Pieza | Tecnología |
|---|---|
| Frontend + backend | Next.js 15 (App Router, TypeScript) |
| Base de datos | PostgreSQL (Supabase) vía Prisma |
| Autenticación | Supabase Auth + roles `ADMIN` / `STAFF` en tabla `usuarios` |
| WhatsApp | Meta WhatsApp Cloud API (plantillas Utility) |
| Correo | Resend |
| Job programado | Vercel Cron → `/api/cron/recordatorios` |
| Teléfono internacional | `libphonenumber-js` (normaliza a E.164) |

## Modo prueba (dry-run)

Si faltan las credenciales de WhatsApp o Resend, el sistema **registra** cada
mensaje (tabla `mensajes_log`, estado `SIMULADO`) sin enviarlo. Así se puede
construir y probar todo el flujo antes de tener la línea de WhatsApp o el dominio
de correo. Forzalo con `FORCE_DRY_RUN=true`.

## Probarlo ahora (sin Supabase, sin Docker)

```bash
npm install
npm run local
```

Eso levanta un Postgres embebido, crea las tablas, siembra un admin + citas de
ejemplo y abre el panel en **http://localhost:3000** ya logueado. Ctrl+C detiene
todo. Los datos quedan en `./.pglite` entre corridas.

Qué probar: ver **[GUIA-PRUEBAS.md](./GUIA-PRUEBAS.md)**.

Todos los mensajes salen en **modo prueba** (se registran, no se envían) hasta
configurar WhatsApp y Resend.

Disparar el cron de recordatorios a mano (con `npm run local` corriendo):

```bash
npm run cron:local
```

Otras verificaciones sin UI:

```bash
npm run verificar           # crea una cita y valida confirmación + recordatorio
npm run verificar:tablero   # valida las consultas del tablero de inicio
```

## Puesta en marcha para producción

Ver **[SETUP.md](./SETUP.md)** — paso a paso de Supabase, Meta, Resend, plantillas
y despliegue en Vercel. Resumen:

```bash
cp .env.example .env.local          # completar DATABASE_URL + Supabase + resto
npm run prisma:migrate              # crea las tablas
SEED_ADMIN_EMAIL=vos@ejemplo.com SEED_ADMIN_PASSWORD='una-clave-larga' npm run db:seed
npm run dev
```

## Estructura

```
prisma/schema.prisma          modelo de datos
src/lib/env.ts                validación de variables de entorno + flag dry-run
src/lib/timezone.ts           conversión hora Costa Rica (UTC-6 fijo) ⇄ UTC
src/lib/whatsapp.ts           cliente WhatsApp Cloud API
src/lib/email.ts              cliente Resend
src/lib/plantillas.ts         textos de WhatsApp y HTML de los correos
src/lib/notificaciones.ts     orquesta envío + registro en mensajes_log + alerta interna
src/app/panel/…               panel de administración (protegido)
src/app/api/cron/recordatorios job diario
```
