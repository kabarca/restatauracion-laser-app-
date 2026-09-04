/**
 * Un solo comando para probar todo localmente sin Supabase ni Docker:
 *   npm run local
 *
 * 1. Levanta un Postgres embebido (PGlite) en :5433 (datos en ./.pglite)
 * 2. Aplica el esquema de Prisma
 * 3. Siembra un admin + citas de ejemplo (idempotente)
 * 4. Arranca `next dev` con DEV_AUTOLOGIN_EMAIL para entrar directo al panel
 *
 * Ctrl+C detiene todo.
 */
import { spawn } from "node:child_process";
import net from "node:net";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const PORT_DB = 5433;

function esperarPuerto(port: number, host = "127.0.0.1", timeoutMs = 15000): Promise<void> {
  const inicio = Date.now();
  return new Promise((resolve, reject) => {
    const intentar = () => {
      const sock = net.connect(port, host);
      sock.once("connect", () => {
        sock.end();
        resolve();
      });
      sock.once("error", () => {
        sock.destroy();
        if (Date.now() - inicio > timeoutMs) reject(new Error(`Timeout esperando ${host}:${port}`));
        else setTimeout(intentar, 250);
      });
    };
    intentar();
  });
}

void (async () => {
  console.log("▶  Postgres embebido (PGlite) en 127.0.0.1:" + PORT_DB + " …");
  const db = await PGlite.create({ dataDir: "./.pglite" });
  await db.waitReady;
  const server = new PGLiteSocketServer({ db, port: PORT_DB, host: "127.0.0.1" });
  await server.start();
  await esperarPuerto(PORT_DB);

  // spawn asíncrono: NO usar spawnSync, bloquearía el event loop y PGlite
  // (que corre en este mismo proceso) no podría atender las consultas.
  const run = (cmd: string, args: string[]) =>
    new Promise<void>((resolve) => {
      const p = spawn(cmd, args, { stdio: "inherit", env: process.env });
      p.on("exit", (code) => {
        if (code !== 0) {
          console.error(`✗ Falló: ${cmd} ${args.join(" ")}`);
          process.exit(code ?? 1);
        }
        resolve();
      });
    });

  // Regenerar el cliente de Prisma: si el proyecto está en una carpeta sincronizada
  // (iCloud/Dropbox/OneDrive), src/generated puede quedar a medias entre corridas.
  console.log("▶  Generando cliente de Prisma…");
  await run("npx", ["prisma", "generate"]);

  console.log("▶  Aplicando migraciones…");
  await run("npx", ["prisma", "migrate", "deploy"]);
  // Sincroniza cambios de esquema locales todavía sin migración (dev).
  await run("npx", ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"]);

  console.log("▶  Sembrando datos de ejemplo…");
  await run("npx", ["tsx", "scripts/seed-local.ts"]);

  console.log("\n▶  Arrancando el panel en http://localhost:3000 …\n");
  const web = spawn("npx", ["next", "dev"], {
    stdio: "inherit",
    env: { ...process.env, DEV_AUTOLOGIN_EMAIL: process.env.DEV_AUTOLOGIN_EMAIL || "admin@local" },
  });

  const cerrar = async () => {
    web.kill("SIGINT");
    await server.stop().catch(() => {});
    await db.close().catch(() => {});
    process.exit(0);
  };
  process.on("SIGINT", cerrar);
  process.on("SIGTERM", cerrar);
  web.on("exit", cerrar);
})();
