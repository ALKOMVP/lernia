import { CodeBlock } from "../components/CodeBlock";
import prose from "../pages/Prose.module.css";
import type { ExerciseModule } from "../types/exercise";
import { SlidingWindowDemo } from "./demos/SlidingWindowDemo";

export const slidingWindowExercise: ExerciseModule = {
  meta: {
    slug: "sliding-window",
    title: "Sliding window: substring sin repetidos",
    teaser: "Patrón de entrevista frecuente para strings y arrays en O(n).",
    tags: ["Strings", "Algoritmos", "O(n)"],
    difficulty: "intermedio",
    minutes: 20,
    whyItMatters:
      "Dominar sliding window te da rapidez para problemas de secuencias con restricciones dinámicas.",
  },
  statement: (
    <p className={prose.p}>
      Dado un string, devuelve la longitud de la subcadena más larga sin caracteres repetidos. Ejemplo:{" "}
      <code>\"abcabcbb\" -&gt; 3</code>.
    </p>
  ),
  walkthrough: (
    <div>
      <p className={prose.p}>
        Mantén dos punteros <code>left</code> y <code>right</code>. Usa un <code>Map</code> para recordar última
        posición de cada caracter. Si se repite dentro de la ventana, mueve <code>left</code>.
      </p>
      <CodeBlock title="Implementación O(n)" language="ts">
        {`function lengthOfLongestSubstring(s: string): number {
  const last = new Map<string, number>();
  let left = 0;
  let best = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right]!;
    const seen = last.get(ch);
    if (seen !== undefined && seen >= left) left = seen + 1;
    last.set(ch, right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}`}
      </CodeBlock>
    </div>
  ),
  learningObjectives: [
    "Reconocer cuándo aplicar ventana deslizante.",
    "Controlar punteros sin perder casos borde.",
    "Justificar O(n) con recorrido único.",
  ],
  masteryChecklist: [
    "Puedo trazar la ventana a mano en un ejemplo.",
    "No confundo 'última aparición global' con 'dentro de ventana'.",
    "Sé adaptar patrón a 'máximo con K distintos'.",
  ],
  commonMistakes: [
    "Mover left hacia atrás por error.",
    "No validar seen >= left.",
    "Usar Set sin información de posiciones.",
  ],
  miniChallenge: (
    <p className={prose.p}>
      Extiende a “longest substring con como máximo 2 caracteres distintos”.
    </p>
  ),
  labSteps: [
    "Avanza paso a paso para ver cómo cambia left cuando hay repetidos.",
    "Prueba strings cortos y predice resultado antes de ejecutar.",
    "Compara mentalmente contra solución O(n²).",
  ],
  demo: <SlidingWindowDemo />,
};
