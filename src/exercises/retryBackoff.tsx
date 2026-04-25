import { CodeBlock } from "../components/CodeBlock";
import prose from "../pages/Prose.module.css";
import type { ExerciseModule } from "../types/exercise";
import { BackoffDemo } from "./demos/BackoffDemo";

export const retryBackoffExercise: ExerciseModule = {
  meta: {
    slug: "retry-backoff",
    title: "Retry con exponential backoff",
    teaser: "Reintenta operaciones inestables sin martillar el servidor ni bloquear UX.",
    tags: ["Async", "Resiliencia", "Integraciones"],
    difficulty: "intermedio",
    minutes: 18,
    whyItMatters:
      "En chatbots, webhooks e integraciones externas vas a ver fallos transitorios. Saber reintentar bien es clave.",
  },
  statement: (
    <p className={prose.p}>
      Implementa <code>retryWithBackoff(fn, maxRetries, baseMs)</code>. Debe reintentar una operación async tras cada
      fallo, esperando <code>baseMs * 2^k</code>. Si agota reintentos, propaga el error.
    </p>
  ),
  walkthrough: (
    <div>
      <p className={prose.p}>
        La idea: bucle por intento, ejecutar, y en caso de error dormir antes del siguiente intento. En producción
        sueles agregar <em>jitter</em> aleatorio para evitar que todos reintenten al mismo tiempo.
      </p>
      <CodeBlock title="Versión base" language="ts">
        {`export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  baseMs: number
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries) break;
      const waitMs = baseMs * 2 ** attempt;
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  throw lastError;
}`}
      </CodeBlock>
    </div>
  ),
  learningObjectives: [
    "Diferenciar fallo transitorio vs fallo permanente.",
    "Implementar reintentos acotados sin bucles infinitos.",
    "Explicar por qué el backoff protege infraestructura.",
  ],
  masteryChecklist: [
    "Sé calcular espera por intento.",
    "No oculto error final al consumidor.",
    "Puedo mencionar jitter/circuit breaker como evolución.",
  ],
  commonMistakes: [
    "Reintentar sin límite y congelar el flujo.",
    "No esperar entre intentos (retry agresivo).",
    "Tragar errores sin observabilidad.",
  ],
  miniChallenge: (
    <p className={prose.p}>
      Añade parámetro <code>shouldRetry(error)</code> para no reintentar 4xx funcionales y sí reintentar 5xx/timeouts.
    </p>
  ),
  labSteps: [
    "Sube la tasa de fallo y observa cómo crecen las esperas.",
    "Compara con una estrategia sin backoff (mentalmente) y estima carga.",
    "Explica cómo loguearías intentos en una app real.",
  ],
  demo: <BackoffDemo />,
};
