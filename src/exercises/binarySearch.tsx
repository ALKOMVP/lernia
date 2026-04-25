import { CodeBlock } from "../components/CodeBlock";
import prose from "../pages/Prose.module.css";
import type { ExerciseModule } from "../types/exercise";
import { BinarySearchGameDemo } from "./demos/BinarySearchGameDemo";

export const binarySearchExercise: ExerciseModule = {
  meta: {
    slug: "binary-search",
    title: "Búsqueda binaria sin errores de borde",
    teaser: "Mitad y descarte en arreglos ordenados; poco código, muchos edge cases.",
    tags: ["Algoritmos", "Arrays", "O(log n)"],
    difficulty: "base",
    minutes: 14,
    whyItMatters:
      "En entrevistas lo usan para medir claridad en invariantes y manejo de límites.",
  },
  statement: (
    <p className={prose.p}>
      Implementa función que retorna índice de <code>target</code> en arreglo ordenado o <code>-1</code> si no existe.
    </p>
  ),
  walkthrough: (
    <div>
      <CodeBlock title="Versión iterativa robusta" language="ts">
        {`function binarySearch(nums: number[], target: number): number {
  let lo = 0;
  let hi = nums.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`}
      </CodeBlock>
      <p className={prose.p}>
        Truco mental: define siempre el invariante del rango activo y cuándo termina el bucle.
      </p>
    </div>
  ),
  learningObjectives: [
    "Dominar invariantes de límites lo/hi.",
    "Evitar bucles infinitos por actualización incorrecta.",
    "Explicar salto de O(n) a O(log n).",
  ],
  masteryChecklist: [
    "Manejo array vacío correctamente.",
    "No repito mid en la misma iteración.",
    "Puedo derivar lower_bound si me lo piden.",
  ],
  commonMistakes: [
    "Usar while(lo < hi) sin ajustar semántica de salida.",
    "Actualizar hi = mid en vez de hi = mid - 1 (según variante).",
    "Olvidar retorno -1 cuando no hay match.",
  ],
  miniChallenge: <p className={prose.p}>Implementa versión que devuelva primera aparición de un valor repetido.</p>,
  demo: <BinarySearchGameDemo />,
};
