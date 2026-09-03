/**
 * Dispara el job de recordatorios contra el servidor local.
 * Requiere `npm run dev` corriendo en otra terminal.
 *
 *   npm run cron:local
 */
void (async () => {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const secret = process.env.CRON_SECRET ?? "";

  const url = new URL("/api/cron/recordatorios", base);
  if (secret) url.searchParams.set("secret", secret);

  const res = await fetch(url, { method: "POST" });
  console.log("HTTP", res.status);
  console.log(JSON.stringify(await res.json(), null, 2));
})();
