/**
 * Un solo comando para probar todo localmente sin Supabase ni Docker:
 *   npm run local
 *
 * 1. Levanta un PostgreSQL local real (embedded-postgres) en :5433
 *    (datos en ./.pgdata — persisten entre corridas).
 * 2. Genera el cliente de Prisma y aplica las migraciones.
 * 3. Siembra un admin + citas de ejemplo (idempotente).
 * 4. Arranca `next dev` con DEV_AUTOLOGIN_EMAIL para entrar directo al panel.
 *
 * Ctrl+C detiene todo.
 */
import { spawn } from "node:child_process";
import net from "node:net";
import { existsSync } from "node:fs";
import EmbeddedPostgres from "embedded-postgres";

const PORT_DB = 5433;
const DATA_DIR = "./.pgdata";

function puertoOcupado(port: number, host = "127.0.0.1"): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.connect(port, host);
    s.once("connect", () => {
      s.destroy();
      resolve(true);
    });
    s.once("error", () => resolve(false));
  });
}

void (async () => {
  const yaCorriendo = await puertoOcupado(PORT_DB);
  let pg: EmbeddedPostgres | null = null;

  if (yaCorriendo) {
    console.log(`▶  Reusando PostgreSQL ya activo en 127.0.0.1:${PORT_DB}`);
  } else {
    const inicializado = existsSync(`${DATA_DIR}/PG_VERSION`);
    console.log(`▶  Iniciando PostgreSQL local en 127.0.0.1:${PORT_DB} …`);
    pg = new EmbeddedPostgres({
      databaseDir: DATA_DIR,
      user: "postgres",
      password: "postgres",
      port: PORT_DB,
      persistent: true,
    });
    if (!inicializado) {
      console.log("   (primera vez: descargando/inicializando, puede tardar ~1 min)");
      await pg.initialise();
    }
    await pg.start();
    if (!inicializado) {
      await pg.createDatabase("recordatorios").catch(() => {});
    }
  }

  // spawn asíncrono para no bloquear el event loop.
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

  console.log("▶  Generando cliente de Prisma…");
  await run("npx", ["prisma", "generate"]);

  console.log("▶  Aplicando migraciones…");
  await run("npx", ["prisma", "migrate", "deploy"]);
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
    if (pg) await pg.stop().catch(() => {});
    process.exit(0);
  };
  process.on("SIGINT", cerrar);
  process.on("SIGTERM", cerrar);
  web.on("exit", cerrar);
})();
