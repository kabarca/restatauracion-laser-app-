# Guía de pruebas — Sistema de recordatorios

Arrancá con:

```bash
npm install
npm run local
```

Abre **http://localhost:3000** ya logueado como `admin@local`. Todos los envíos
están en **modo prueba**: se registran en el historial pero no se manda nada real.

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

## 7. Equipo y ajustes (solo ADMIN)

- [ ] **Equipo**: crear un miembro (muestra una contraseña temporal). *Nota:*
      esto necesita Supabase configurado; en modo local sin Supabase da un aviso.
- [ ] Cambiar rol / desactivar un miembro (no a vos mismo).
- [ ] **Ajustes**: cambiar "días antes para el recordatorio" → se aplica a las
      citas nuevas. Ver el estado de las integraciones (WhatsApp/Email).

## 8. Zona horaria

- [ ] Crear una cita a las `14:30`. En el detalle y los mensajes debe decir
      **2:30 p.m.** (hora de Costa Rica). El valor guardado en la base está en
      UTC (20:30) — es correcto.

---

## Reiniciar los datos de prueba

```bash
rm -rf .pglite
npm run local
```
