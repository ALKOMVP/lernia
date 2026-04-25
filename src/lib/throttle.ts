/**
 * Garantiza como máximo una ejecución de `fn` cada `waitMs`.
 * La primera llamada dispara de inmediato; las siguientes se ignoran
 * hasta que expire la ventana (leading edge común en scroll/handlers).
 */
export function throttle<T extends (...args: Parameters<T>) => void>(
  fn: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let last = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - last >= waitMs) {
      last = now;
      fn(...args);
    }
  };
}
