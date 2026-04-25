/**
 * Ejecuta tareas async con concurrencia limitada (pool).
 * Evita saturar APIs o el navegador cuando hay muchas peticiones.
 */
export async function promisePool<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (concurrency < 1) throw new RangeError("concurrency >= 1");
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (true) {
      const i = nextIndex++;
      if (i >= items.length) break;
      results[i] = await worker(items[i]!, i);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker());
  await Promise.all(workers);
  return results;
}
