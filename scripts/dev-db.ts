/**
 * SOLO DESARROLLO/PRUEBAS LOCALES. Levanta un PostgreSQL local real
 * (embedded-postgres) en el puerto 5433, sin instalar Postgres ni Docker.
 * NO usar en producción — ahí va Supabase.
 *
 *   npx tsx scripts/dev-db.ts     (dejalo corriendo; Ctrl+C para detener)
 */
import { existsSync } from "node:fs";
import EmbeddedPostgres from "embedded-postgres";

const PORT_DB = 5433;
const DATA_DIR = "./.pgdata";

void (async () => {
  const inicializado = existsSync(`${DATA_DIR}/PG_VERSION`);
  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: "postgres",
    password: "postgres",
    port: PORT_DB,
    persistent: true,
  });

  if (!inicializado) {
    console.log("Primera vez: inicializando la base…");
    await pg.initialise();
  }
  await pg.start();
  if (!inicializado) {
    await pg.createDatabase("recordatorios").catch(() => {});
  }
  console.log(`PostgreSQL escuchando en postgres://postgres:postgres@127.0.0.1:${PORT_DB}/recordatorios`);

  const cerrar = async () => {
    await pg.stop().catch(() => {});
    process.exit(0);
  };
  process.on("SIGINT", cerrar);
  process.on("SIGTERM", cerrar);
})();
