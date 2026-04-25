/**
 * Retorna una función que retrasa la ejecución de `fn` hasta que
 * pasen `waitMs` milisegundos sin nuevas llamadas.
 *
 * Útil en búsquedas, redimensionado de ventana, autoguardado, etc.
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>) => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = undefined;
      fn(...args);
    }, waitMs);
  };
}
