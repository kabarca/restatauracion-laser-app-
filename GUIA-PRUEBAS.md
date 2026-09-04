# Guía de pruebas — Sistema de recordatorios

Arrancá con:

```bash
npm install
npm run local
```

Abre **http://localhost:3000** ya logueado como `admin@local`. Todos los envíos
están en **modo prueba**: se registran en el historial pero no se manda nada real.

Los datos de ejemplo usan el número **+506 7300 1338** y el correo
**sanchezthomas023@gmail.com** como cliente, así que al conectar credenciales los
mensajes de prueba llegan a un solo lado.

### Enviar de verdad (opcional)

1. **Correo:** crear una API key en resend.com, ponerla en `RESEND_API_KEY` de
   `.env.local`. Sin verificar dominio solo se puede enviar al correo dueño de la
   cuenta de Resend, así que abrí la cuenta con `sanchezthomas023@gmail.com`.
2. **WhatsApp:** en developers.facebook.com → app → WhatsApp → API Setup, copiar
   `Phone number ID` y token a `.env.local`, agregar **+506 7300 1338** como
   destino de prueba, y poner los dos `WHATSAPP_TEMPLATE_*` en `hello_world`.
3. Probar el envío directo (sin crear cita):
   ```bash
   npm run enviar:prueba
   ```
   Debe decir `ENVIADO` en vez de `SIMULADO`.

---

## 1. Tablero de inicio (`/panel`)

- [ ] Se ven 4 indicadores: **Citas hoy**, **Próximos 7 días**, **Recordatorios
      pendientes**, **Envíos fallidos**.
- [ ] "Citas de hoy" y "Próximos 7 días" listan las citas de ejemplo.
- [ ] "Recordatorios pendientes" muestra la cita **Taller Vindas** (es mañana,
      con recordatorio a 2 días → ya debía salir → marcada como atrasada).

## 2. Crear una cita (Flujo A + B)

- [ ] Ir a **Nueva cita**.
- [ ] Escribir nombre, correo, y un teléfono. Probar el selector de país:
      elegí `CR +506` y escribí `8888 8888` → abajo dice "Se guardará como
      +50688888888". Probá un número inválido → avisa.
- [ ] Elegir fecha (calendario) y hora (selector).
- [ ] Mirar la **Vista previa del mensaje**: cambia en vivo con lo que escribís.
- [ ] Guardar → redirige al detalle con el aviso "Cita creada…".
- [ ] En **Registro de mensajes** aparecen 2 filas (WhatsApp + Correo) con estado
      **Simulado**.
- [ ] En el detalle, "Confirmación: enviada …".

## 3. Recordatorio automático (Flujo C)

Con `npm run local` corriendo, en otra terminal:

```bash
npm run cron:local
```

- [ ] Responde `{ "ok": true, "enviadas": N, ... }`.
- [ ] Las citas cuya fecha está a ≤ 2 días quedan con estado **Recordada** y
      suman 2 filas de tipo **Recordatorio** en su registro.
- [ ] Correr el comando otra vez → `"enviadas": 0` (no se repite).

## 4. Reprogramar y cancelar (Fase 3)

- [ ] En el detalle de una cita → **Reprogramar** → cambiar fecha/hora → Guardar.
      Aparece una fila **Reprogramación** y el recordatorio vuelve a "pendiente".
- [ ] **Cancelar cita** con un motivo → estado pasa a **Cancelada**, fila
      **Cancelación** en el registro, y el motivo se ve en el detalle.
- [ ] **Marcar completada** / **Reabrir** cambian el estado.

## 5. Reintentar envíos fallidos

Los datos de ejemplo no traen fallos. Para generar uno:

```bash
# con npm run local corriendo, en otra terminal:
FORCE_DRY_RUN=false WHATSAPP_PHONE_NUMBER_ID=000 WHATSAPP_ACCESS_TOKEN=malo npm run cron:local
```

- [ ] En el tablero aparece la cita en **Envíos fallidos** con el error de Meta.
- [ ] Botón **Reintentar todos los fallidos** → muestra el resumen.
- [ ] En el detalle de esa cita, botón **Reintentar** en la fila fallida.

## 6. Filtros, búsqueda y export (`/panel/citas`)

- [ ] Buscar por nombre / teléfono / correo.
- [ ] Filtrar por estado y por rango de fechas.
- [ ] **Exportar CSV** descarga el listado filtrado (se abre en Excel/Numbers).

## 7. Recordatorio el mismo día (Fase 4)

- [ ] **Ajustes** → activar "Recordatorio adicional el mismo día" → Guardar.
- [ ] Crear una cita **para hoy** (o abrir una y usar "Activar recordatorio del
      mismo día" en Acciones).
- [ ] Correr `npm run cron:local` → la respuesta trae `"recordatoriosDia": 1` y en
      el registro de la cita aparece una fila **Recordatorio (mismo día)**.

## 8. Encuesta de satisfacción (Fase 4)

- [ ] **Ajustes** → activar "Encuesta de satisfacción post-servicio", días = 1.
- [ ] Los datos de ejemplo traen la cita **Condominio Vista Real** (hace 3 días).
- [ ] Correr `npm run cron:local` → `"encuestas": 1`.
- [ ] En el detalle de esa cita, sección **Encuesta** → copiar el enlace
      `/encuesta/{token}` y abrirlo en el navegador (no pide login).
- [ ] Calificar + comentar + Enviar.
- [ ] **Encuestas** (en el menú) → aparece la respuesta, con promedio y tasa.

## 9. Equipo y ajustes (solo ADMIN)

- [ ] **Equipo**: crear un miembro (muestra una contraseña temporal). *Nota:*
      esto necesita Supabase configurado; en modo local sin Supabase da un aviso.
- [ ] Cambiar rol / desactivar un miembro (no a vos mismo).
- [ ] **Ajustes**: cambiar "días antes para el recordatorio" → se aplica a las
      citas nuevas. Ver el estado de las integraciones (WhatsApp/Email).

## 10. Zona horaria

- [ ] Crear una cita a las `14:30`. En el detalle y los mensajes debe decir
      **2:30 p.m.** (hora de Costa Rica). El valor guardado en la base está en
      UTC (20:30) — es correcto.

---

## Reiniciar los datos de prueba

```bash
rm -rf .pgdata
npm run local
```

## Si `npm run local` se queda pegado o ves "Internal Server Error"

```bash
# en cualquier terminal:
lsof -iTCP:3000 -sTCP:LISTEN   # anotá el PID que aparece
kill -9 <ese PID>
lsof -iTCP:5433 -sTCP:LISTEN   # lo mismo para la base
kill -9 <ese PID>
npm run local
```

`npm run local` reutiliza el PostgreSQL si ya está corriendo, así que un segundo
`Ctrl+C` + `npm run local` normalmente alcanza. Esto es distinto a como estaba
antes (con una base "simulada" que se colgaba fácil) — ahora es un PostgreSQL
de verdad, mucho más estable.
