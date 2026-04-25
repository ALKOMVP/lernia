import { CodeBlock } from "../components/CodeBlock";
import type { ExerciseModule } from "../types/exercise";
import { PromisePoolDemo } from "./demos/PromisePoolDemo";
import prose from "../pages/Prose.module.css";

export const promisePoolExercise: ExerciseModule = {
  meta: {
    slug: "promise-pool",
    title: "Pool de promesas con concurrencia limitada",
    teaser: "Patrón diario al integrar APIs: muchos ítems, pocos slots en vuelo.",
    tags: ["Async", "Fetch", "Node"],
    difficulty: "intermedio",
    minutes: 20,
    whyItMatters:
      "En backoffice y automatizaciones no quieres abrir 500 conexiones; quieres throughput controlado y backpressure.",
  },
  statement: (
    <div>
      <p className={prose.p}>
        Implementa <code>promisePool(items, concurrency, worker)</code> que devuelve un arreglo de resultados en el
        mismo orden que <code>items</code>, ejecutando como máximo <code>concurrency</code> workers en paralelo.
      </p>
    </div>
  ),
  walkthrough: (
    <div>
      <p className={prose.p}>
        Mantén un índice atómico lógico “siguiente trabajo”. Lanza <code>min(concurrency, n)</code> funciones async
        que en bucle toman el siguiente ítem hasta agotar. Cada worker escribe en <code>results[i]</code>.
      </p>
      <CodeBlock title="Esqueleto de worker" language="ts">
        {`let nextIndex = 0;

async function runWorker() {
  while (true) {
    const i = nextIndex++;
    if (i >= items.length) break;
    results[i] = await worker(items[i], i);
  }
}

await Promise.all(
  Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker())
);`}
      </CodeBlock>
      <div className={prose.callout}>
        Alternativa: cola con semáforo. Lo importante es explicar por qué no haces{" "}
        <code>Promise.all(items.map(worker))</code> cuando <code>items</code> es enorme.
      </div>
    </div>
  ),
  learningObjectives: [
    "Controlar concurrencia sin perder orden de resultados.",
    "Razonar backpressure en integraciones reales.",
    "Explicar por qué Promise.all no siempre es buena idea.",
  ],
  masteryChecklist: [
    "Mantengo resultados en el índice correcto.",
    "No excedo el límite de tareas en vuelo.",
    "Sé cómo propagar errores del worker.",
  ],
  commonMistakes: [
    "Olvidar preservar orden y devolver resultados desalineados.",
    "Mutar índices de forma insegura con closures mal diseñadas.",
    "No pensar qué ocurre cuando un worker falla a mitad de ejecución.",
  ],
  miniChallenge: (
    <div>
      <p className={prose.p}>
        Extiende <code>promisePool</code> para soportar modo <code>settled</code> (similar a{" "}
        <code>Promise.allSettled</code>) y devolver estado por ítem sin abortar todo al primer error.
      </p>
    </div>
  ),
  labSteps: [
    "Ejecuta el pool y confirma que empiezan como máximo 2 tareas al mismo tiempo.",
    "Observa el orden: los completados pueden intercalarse, pero el resultado final debe respetar índice.",
    "Explica qué pasaría si pones concurrencia=1 o concurrencia=items.length.",
  ],
  demo: <PromisePoolDemo />,
};
