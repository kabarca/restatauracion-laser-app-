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

## Puesta en marcha

Ver **[SETUP.md](./SETUP.md)** para el paso a paso completo (Supabase, Meta,
Resend, plantillas, despliegue en Vercel).

### Opción A — con Supabase (igual que producción)

```bash
npm install
cp .env.example .env.local          # completar DATABASE_URL + Supabase
npm run prisma:migrate              # crea las tablas
SEED_ADMIN_EMAIL=vos@ejemplo.com SEED_ADMIN_PASSWORD='una-clave-larga' npm run db:seed
npm run dev                         # http://localhost:3000
```

### Opción B — sin instalar nada (Postgres embebido)

Para trabajar el código sin crear todavía el proyecto de Supabase ni instalar
Postgres/Docker, hay un Postgres embebido (PGlite) que habla el protocolo real:

```bash
npm install
npm run db:local                    # deja esto corriendo (Postgres en :5433)
# .env.local ya viene apuntando a PGlite; en otra terminal:
npm run prisma:push                 # crea las tablas
npm run dev
```

> El login del panel **sí** necesita Supabase Auth. Sin él se puede ejercitar
> toda la lógica de negocio con el script de verificación:

```bash
npm run verificar    # crea una cita de prueba y valida confirmación + recordatorio
```

Disparar el cron de recordatorios manualmente:

```bash
npm run cron:local
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
