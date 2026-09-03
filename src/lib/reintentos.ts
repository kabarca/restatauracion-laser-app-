/** Reintenta una operación async ante fallos transitorios, con backoff. */
export async function conReintentos<T>(
  fn: () => Promise<T>,
  opts: {
    intentos?: number;
    esperaMs?: number[];
    esTransitorio: (resultadoOError: T | unknown) => boolean;
  },
): Promise<T> {
  const intentos = opts.intentos ?? 3;
  const esperas = opts.esperaMs ?? [500, 2000, 5000];

  let ultimo: T | undefined;
  for (let i = 0; i < intentos; i++) {
    try {
      const r = await fn();
      if (!opts.esTransitorio(r) || i === intentos - 1) return r;
      ultimo = r;
    } catch (e) {
      if (!opts.esTransitorio(e) || i === intentos - 1) throw e;
    }
    await new Promise((res) => setTimeout(res, esperas[Math.min(i, esperas.length - 1)]));
  }
  return ultimo as T;
}
