import { CodeBlock } from "../components/CodeBlock";
import type { ExerciseModule } from "../types/exercise";
import { DebounceDemo } from "./demos/DebounceDemo";
import prose from "../pages/Prose.module.css";

export const debounceExercise: ExerciseModule = {
  meta: {
    slug: "debounce",
    title: "Debounce para búsquedas y handlers costosos",
    teaser: "Retrasa la ejecución hasta que el usuario “deje de teclear”. Clásico en portales y chat.",
    tags: ["JavaScript", "Rendimiento", "React"],
    difficulty: "base",
    minutes: 12,
    whyItMatters:
      "En productos tipo Front, evitas martillar APIs al escribir en un buscador de tickets o al autocompletar respuestas.",
  },
  statement: (
    <div>
      <p className={prose.p}>
        Implementa una función <code>debounce(fn, waitMs)</code> que devuelve una nueva función. Cada vez que se llame,
        reinicia un temporizador: solo cuando pasen <code>waitMs</code> milisegundos <strong>sin</strong> nuevas llamadas
        se debe invocar <code>fn</code> con los <strong>últimos</strong> argumentos recibidos.
      </p>
      <ul className={prose.ul}>
        <li className={prose.li}>Si llamas muchas veces seguidas, <code>fn</code> corre solo una vez al final.</li>
        <li className={prose.li}>Piensa en cancelar/reprogramar el temporizador anterior.</li>
      </ul>
    </div>
  ),
  walkthrough: (
    <div>
      <p className={prose.p}>
        Idea central: guardar el id del <code>setTimeout</code> y, si llega otra llamada antes de que dispare,
        hacer <code>clearTimeout</code> y programar otro. Así modelas “silencio” del usuario.
      </p>
      <div className={prose.callout}>
        En entrevista: nombra complejidad espacial O(1), temporal depende de cuántas veces se llame vs cuántas veces
        realmente ejecute <code>fn</code>.
      </div>
      <CodeBlock title="Solución comentada (TypeScript)" language="ts">
        {`/**
 * debounce(fn, waitMs) → función envuelta.
 * Cada llamada reinicia la cuenta; fn solo corre tras waitMs de inactividad.
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  // timer compartido por todas las invocaciones de la función devuelta (closure)
  let timer: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>) => {
    // Si había un disparo pendiente, lo cancelamos: el usuario "siguió escribiendo"
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    // Programamos el próximo intento real de ejecutar fn
    timer = setTimeout(() => {
      timer = undefined; // ya no hay pendiente
      fn(...args);       // aplicamos los ÚLTIMOS args recibidos
    }, waitMs);
  };
}`}
      </CodeBlock>
      <h3 className={prose.sectionTitle}>Trampas comunes</h3>
      <ul className={prose.ul}>
        <li className={prose.li}>
          En React, recrear <code>debounce</code> en cada render rompe el temporizador. Usa <code>useMemo</code> o{" "}
          <code>useRef</code> para mantener una instancia estable.
        </li>
        <li className={prose.li}>
          Si necesitas cancelación al desmontar el componente, guarda el id y haz <code>clearTimeout</code> en el
          cleanup de <code>useEffect</code>.
        </li>
      </ul>
    </div>
  ),
  learningObjectives: [
    "Explicar debounce con tus palabras y un ejemplo real de búsqueda.",
    "Implementar debounce sin perder los últimos argumentos.",
    "Evitar bugs de recreación en React (instancia estable).",
  ],
  masteryChecklist: [
    "Sé diferenciar debounce vs throttle sin dudar.",
    "Puedo justificar por qué reduce carga en red/API.",
    "Puedo extenderlo para exponer un método cancel().",
  ],
  commonMistakes: [
    "No usar closure compartida y perder el timer entre llamadas.",
    "Recrear la función debounced en cada render de React.",
    "Olvidar cómo se limpia el timeout al desmontar un componente.",
  ],
  miniChallenge: (
    <div>
      <p className={prose.p}>
        Implementa una versión <code>debounceWithCancel</code> que devuelva una función invocable + método{" "}
        <code>cancel()</code>. Prueba este flujo: escribe 3 veces, cancela, confirma que no se ejecuta <code>fn</code>.
      </p>
    </div>
  ),
  labSteps: [
    "Escribe una palabra rápido y observa que el valor final cambia solo tras pausa.",
    "Haz una pausa corta (<400ms) y sigue: no debería disparar ejecución final todavía.",
    "Explica en voz alta por qué este patrón protege APIs de búsqueda.",
  ],
  demo: <DebounceDemo />,
};
