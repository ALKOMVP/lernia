import { CodeBlock } from "../components/CodeBlock";
import type { ExerciseModule } from "../types/exercise";
import { ThrottleDemo } from "./demos/ThrottleDemo";
import prose from "../pages/Prose.module.css";

export const throttleExercise: ExerciseModule = {
  meta: {
    slug: "throttle",
    title: "Throttle para scroll, resize y telemetría",
    teaser: "Limita la frecuencia máxima de ejecución. Complemento natural del debounce.",
    tags: ["JavaScript", "Eventos", "UX"],
    difficulty: "base",
    minutes: 10,
    whyItMatters:
      "Útil cuando quieres muestrear posición de scroll o enviar heartbeats sin inundar la red.",
  },
  statement: (
    <div>
      <p className={prose.p}>
        Implementa <code>throttle(fn, waitMs)</code>: la función envuelta puede ejecutar <code>fn</code> como máximo
        una vez cada <code>waitMs</code> milisegundos, aunque se llame muchas más veces (por ejemplo en{" "}
        <code>scroll</code>).
      </p>
      <p className={prose.p}>
        Variante simple (leading): la primera llamada en una ventana se ejecuta al instante; las siguientes se ignoran
        hasta que pase el intervalo.
      </p>
    </div>
  ),
  walkthrough: (
    <div>
      <p className={prose.p}>
        Llevamos un timestamp de la última ejecución real. Si <code>now - last &gt;= waitMs</code>, ejecutamos y
        actualizamos <code>last</code>.
      </p>
      <div className={prose.callout}>
        En la práctica existen variantes “leading”, “trailing” o ambas. Si el entrevistador pide trailing, habla de
        combinar <code>setTimeout</code> con control de flancos.
      </div>
      <CodeBlock title="Solución (leading edge)" language="ts">
        {`export function throttle<T extends (...args: Parameters<T>) => void>(
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
}`}
      </CodeBlock>
    </div>
  ),
  learningObjectives: [
    "Comprender cuándo limitar frecuencia en vez de esperar silencio.",
    "Implementar una versión leading correcta.",
    "Explicar cómo sería una variante trailing.",
  ],
  masteryChecklist: [
    "Identifico eventos candidatos: scroll, resize, mousemove.",
    "Puedo argumentar impacto en UX y consumo de CPU/red.",
    "Puedo dibujar una línea temporal simple de ejecuciones.",
  ],
  commonMistakes: [
    "Confundir throttle con debounce y esperar el mismo comportamiento.",
    "Usar Date.now sin considerar inicialización de last.",
    "No aclarar qué flanco implementa (leading/trailing).",
  ],
  miniChallenge: (
    <p className={prose.p}>
      Escribe una versión <code>throttleTrailing</code> que garantice una ejecución final al terminar la ráfaga de
      eventos.
    </p>
  ),
  labSteps: [
    "Haz 10 clics rápidos y compara clics totales vs ejecuciones throttled.",
    "Espera 1 segundo y vuelve a hacer clic: se abre una nueva ventana de ejecución.",
    "Describe cuándo usarías leading y cuándo trailing en producto real.",
  ],
  demo: <ThrottleDemo />,
};
