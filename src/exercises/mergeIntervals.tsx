import { CodeBlock } from "../components/CodeBlock";
import prose from "../pages/Prose.module.css";
import type { ExerciseModule } from "../types/exercise";
import { MergeIntervalsDemo } from "./demos/MergeIntervalsDemo";

export const mergeIntervalsExercise: ExerciseModule = {
  meta: {
    slug: "merge-intervals",
    title: "Merge intervals para agendas y slots",
    teaser: "Compacta rangos solapados: clásico para calendarios, disponibilidad y ventanas de mantenimiento.",
    tags: ["Arrays", "Ordenación", "Producto"],
    difficulty: "intermedio",
    minutes: 16,
    whyItMatters:
      "En plataformas B2B es frecuente normalizar horarios, ventanas de soporte y bloques de atención.",
  },
  statement: (
    <p className={prose.p}>
      Recibes intervalos <code>[start, end]</code>. Une los que se solapan y devuelve lista compacta ordenada.
    </p>
  ),
  walkthrough: (
    <div>
      <p className={prose.p}>
        Ordena por <code>start</code>. Recorre y compara cada intervalo con el último del resultado. Si se solapan,
        extiende; si no, agrega nuevo.
      </p>
      <CodeBlock title="Patrón estándar" language="ts">
        {`function merge(intervals: number[][]): number[][] {
  if (intervals.length === 0) return [];
  intervals.sort((a, b) => a[0] - b[0]);
  const out = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const top = out[out.length - 1];
    const cur = intervals[i];
    if (cur[0] <= top[1]) top[1] = Math.max(top[1], cur[1]);
    else out.push(cur);
  }
  return out;
}`}
      </CodeBlock>
    </div>
  ),
  learningObjectives: [
    "Aplicar ordenación + recorrido lineal.",
    "Identificar condición exacta de solape.",
    "Explicar complejidad O(n log n).",
  ],
  masteryChecklist: [
    "Manejo input vacío sin errores.",
    "No mutar accidentalmente estructura compartida si no corresponde.",
    "Puedo soportar intervalos ya ordenados eficientemente.",
  ],
  commonMistakes: [
    "Usar < en vez de <= y perder intervalos tocándose.",
    "Olvidar ordenar antes de merge.",
    "No actualizar el end con Math.max.",
  ],
  miniChallenge: (
    <p className={prose.p}>Agrega lógica para devolver también huecos libres entre intervalos mergeados.</p>
  ),
  demo: <MergeIntervalsDemo />,
};
