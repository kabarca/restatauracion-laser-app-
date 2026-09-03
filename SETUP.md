# Puesta en marcha — Sistema de recordatorios

Guía operativa. El código ya está listo para funcionar en **modo prueba** sin
ninguna credencial externa (solo necesita una base de datos). Las integraciones
de WhatsApp y correo se conectan cuando estén disponibles, sin tocar código.

---

## 0. Decisiones que hay que confirmar con el dueño del negocio

Estas venían en el plan (§4) y **no las puede decidir el desarrollo**:

1. **Número de WhatsApp dedicado.** El +506 8901 9811 no se puede usar en la
   Cloud API si sigue usándose a mano en la app de WhatsApp. Recomendación:
   número nuevo, solo para notificaciones automáticas. Mientras tanto se usa el
   **número de prueba** que da Meta (envía a hasta 5 destinos verificados).
2. **Verificación de Meta Business.** Trámite de días a semanas. Arrancarlo ya.
3. **Textos de las 4 plantillas.** Los borradores están en §4 de este documento.
   Confirmarlos antes de mandarlos a aprobar en Meta.
4. **Dominio de correo.** Definir si se usa `restauracionlaser.cr` o un
   subdominio como `notificaciones.restauracionlaser.cr` (recomendado).
5. **Días y hora del recordatorio.** Por defecto: **2 días antes, 9:00 a.m.**
   hora de Costa Rica. Los días se editan en el panel (Ajustes) o por cita. La
   hora se cambia en `vercel.json` (`schedule`, en UTC — `0 15 * * *` = 9:00 CR).
6. **Consentimiento.** Este sistema solo manda mensajes transaccionales sobre la
   cita que el cliente coordinó. Nada de promociones.

---

## 1. Base de datos — Supabase

1. Crear un proyecto en <https://supabase.com> (plan gratis alcanza).
2. **Project Settings → Database → Connection string** → copiar:
   - `DATABASE_URL`: la del **pooler** (puerto `6543`), agregando `?pgbouncer=true`.
   - `DIRECT_URL`: la **directa** (puerto `5432`). La usa `prisma migrate`.
3. **Project Settings → API** → copiar:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (secreta, solo servidor — sirve para crear
     miembros del equipo desde el panel).
4. Pegar todo en `.env.local`.
5. Crear las tablas y el primer admin:

   ```bash
   npm run prisma:migrate      # nombre sugerido: init
   SEED_ADMIN_EMAIL=vos@ejemplo.com SEED_ADMIN_PASSWORD='clave-larga-segura' \
     SEED_ADMIN_NOMBRE='Tu Nombre' npm run db:seed
   ```

> **Autenticación:** la maneja Supabase Auth. La tabla `usuarios` guarda solo el
> perfil y el rol, ligado por `authUserId` al usuario de Supabase. No hay
> registro público: los miembros nuevos los crea un ADMIN desde **Panel → Equipo**
> (se muestra una contraseña temporal una sola vez para entregarla).

---

## 2. WhatsApp — Meta Cloud API

### 2.1 Número de prueba (sirve desde el día uno)

1. <https://developers.facebook.com> → crear app tipo **Business**.
2. Agregar el producto **WhatsApp**.
3. En **API Setup** aparece un `phone number ID` de prueba y un token temporal.
   - `WHATSAPP_PHONE_NUMBER_ID` = ese ID
   - `WHATSAPP_ACCESS_TOKEN` = el token (los de "API Setup" duran 24 h; para algo
     estable, generar un **System User token** permanente en Business Settings).
4. En la misma pantalla, agregar los números de destino de prueba (el equipo) —
   máximo 5, cada uno confirma con un código.

Con esto, apenas `.env.local` tenga esas dos variables, el sistema **deja de
simular y envía de verdad** a esos 5 números.

### 2.2 Plantillas (obligatorias para mensajes que inicia el negocio)

En **WhatsApp Manager → Plantillas de mensajes**, crear 2 plantillas,
categoría **Utility**, idioma **Español** (o "Español (CR)"):

**`confirmacion_cita`** — cuerpo:

```
Hola {{1}}, tu cita con Restauración Láser quedó agendada para el {{2}} a las {{3}}

Cualquier cambio, escribinos por este mismo WhatsApp. ¡Te esperamos!
```

**`recordatorio_cita`** — cuerpo:

```
Hola {{1}}, te recordamos tu cita con Restauración Láser el {{2}} a las {{3}}

Si necesitás reprogramar, contactanos por acá. ¡Nos vemos pronto!
```

Ejemplos para la aprobación: `{{1}}` = `María`, `{{2}}` = `lunes 8 de septiembre de 2025`, `{{3}}` = `2:30 p.m.`

> El sistema manda `{{3}}` ya con formato `2:30 p.m.` (termina en punto), por eso el
> texto **no lleva punto** después de `{{3}}` — se usa un salto de línea. Si preferís
> el punto, cambiá `formatHora` en `src/lib/timezone.ts` para que no termine en ".".

Cuando cambien de nombre o idioma, actualizar `WHATSAPP_TEMPLATE_CONFIRMACION`,
`WHATSAPP_TEMPLATE_RECORDATORIO` y `WHATSAPP_TEMPLATE_LOCALE` en el entorno.

> Los correos (confirmación, recordatorio, reprogramación, cancelación) **no**
> necesitan aprobación. Solo hay plantilla de WhatsApp para confirmación y
> recordatorio; reprogramación y cancelación se avisan solo por correo.

### 2.3 Corte a la línea nueva (Fase 5)

Cuando la línea dedicada quede verificada en WhatsApp Business Platform:
**solo se cambia `WHATSAPP_PHONE_NUMBER_ID`** (y el token si aplica) en las
variables de entorno de Vercel. No se toca código. Probar con una cita real
antes de avisar al equipo.

---

## 3. Correo — Resend

1. Crear cuenta en <https://resend.com>.
2. **Domains → Add Domain** → `notificaciones.restauracionlaser.cr` (o el que se
   decida). Agregar los registros DNS (SPF, DKIM) que indica Resend y esperar
   verificación.
3. **API Keys** → crear una → `RESEND_API_KEY`.
4. En el entorno:
   - `EMAIL_FROM="Restauración Láser <citas@notificaciones.restauracionlaser.cr>"`
   - `EMAIL_EQUIPO="equipo@restauracionlaser.cr"` (recibe copia de alertas cuando
     un envío falla).

Sin `RESEND_API_KEY`, los correos se simulan (quedan en `mensajes_log`).

---

## 4. Textos de los mensajes (borradores a confirmar)

WhatsApp: ver §2.2. Correos (editables en `src/lib/plantillas.ts`):

- **Confirmación** · asunto *Tu cita con Restauración Láser está confirmada*
- **Recordatorio** · asunto *Recordatorio: tu cita con Restauración Láser es el {fecha}*
- **Reprogramación** · asunto *Tu cita con Restauración Láser cambió de fecha*
- **Cancelación** · asunto *Tu cita con Restauración Láser fue cancelada*

Todos en voseo, tono sobrio. Confirmar si se agrega dirección/firma/logo.

---

## 5. Cron de recordatorios

- `vercel.json` ya define el cron: `0 15 * * *` (15:00 UTC = 9:00 a.m. CR).
- Generar un secreto y ponerlo como `CRON_SECRET` en Vercel:
  ```bash
  openssl rand -hex 32
  ```
  Vercel Cron manda `Authorization: Bearer <CRON_SECRET>` automáticamente.
- Prueba manual (local): `npm run cron:local`.
- Prueba manual (producción):
  ```bash
  curl -X POST "https://TU-APP.vercel.app/api/cron/recordatorios?secret=EL_SECRETO"
  ```

Lógica: busca citas `AGENDADA`/`RECORDADA`, sin recordatorio enviado, cuya fecha
(en calendario de Costa Rica) caiga exactamente a `diasRecordatorio` días de hoy.
Marca `recordatorioEnviadoEn` para no repetir.

---

## 6. Despliegue en Vercel

1. Importar el repo en Vercel.
2. Cargar **todas** las variables de `.env.example` en Project Settings →
   Environment Variables (Production + Preview).
3. Build command por defecto (`npm run build`, ya corre `prisma generate`).
4. Primer deploy: correr las migraciones contra la base de producción:
   ```bash
   DATABASE_URL=... DIRECT_URL=... npx prisma migrate deploy
   ```
5. Crear el primer admin (§1.5) apuntando a la base de producción.
6. Verificar en **Ajustes** del panel que WhatsApp y Email digan *conectado*.

---

## 7. Checklist de lanzamiento

- [ ] Meta Business verificado y línea dedicada activa en WhatsApp Platform
- [ ] Plantillas `confirmacion_cita` y `recordatorio_cita` **aprobadas**
- [ ] Dominio de correo verificado en Resend
- [ ] `CRON_SECRET` configurado en Vercel
- [ ] `FORCE_DRY_RUN` = `false` en producción
- [ ] Cita de prueba real: confirmación llega por WhatsApp y correo
- [ ] Cron de prueba: recordatorio llega y `mensajes_log` lo registra
- [ ] `WHATSAPP_PHONE_NUMBER_ID` apunta a la línea nueva (no a la de prueba)
