/**
 * SOLO DESARROLLO/PRUEBAS LOCALES. Levanta un Postgres embebido (PGlite) que
 * habla el protocolo de Postgres en el puerto 5433, para poder correr el sistema
 * sin instalar Postgres ni Docker. NO usar en producción — ahí va Supabase.
 *
 *   npx tsx scripts/dev-db.ts
 */
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

void (async () => {
  const db = await PGlite.create({ dataDir: "./.pglite" });
  const server = new PGLiteSocketServer({ db, port: 5433, host: "127.0.0.1" });

  await server.start();
  console.log("PGlite escuchando en postgres://postgres@127.0.0.1:5433/postgres");

  process.on("SIGINT", async () => {
    await server.stop();
    await db.close();
    process.exit(0);
  });
})();
