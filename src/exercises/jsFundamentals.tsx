import { CodeBlock } from "../components/CodeBlock";
import type { ExerciseModule } from "../types/exercise";
import prose from "../pages/Prose.module.css";

export const jsFundamentalsExercise: ExerciseModule = {
  meta: {
    slug: "js-fundamentos",
    title: "JavaScript moderno que siempre preguntan",
    teaser: "Closures, mutabilidad, optional chaining y equality — repaso express.",
    tags: ["JavaScript", "ES6+", "Entrevista"],
    difficulty: "base",
    minutes: 14,
    whyItMatters:
      "CoderPad suele mezclar algoritmo pequeño + lectura de código o API moderna; tener el vocabulario a mano ayuda.",
  },
  statement: (
    <div>
      <p className={prose.p}>
        No hay un solo algoritmo: el objetivo es dominar patrones que salen en caliente al escribir bajo presión.
      </p>
    </div>
  ),
  walkthrough: (
    <div>
      <h3 className={prose.sectionTitle}>Closures y estado encapsulado</h3>
      <p className={prose.p}>
        Las funciones devueltas por <code>debounce</code>/<code>throttle</code> “recuerdan” variables del scope externo
        sin exponerlas. Eso es una closure.
      </p>
      <CodeBlock title="Mini contador privado" language="ts">
        {`function createCounter() {
  let n = 0; // no es accesible desde fuera
  return {
    inc: () => ++n,
    read: () => n,
  };
}`}
      </CodeBlock>
      <h3 className={prose.sectionTitle}>Mutación vs copia superficial</h3>
      <p className={prose.p}>
        <code>const x = [...arr]</code> copia el array, no los objetos internos. Para merges inmutables en UI: spread
        selectivo o utilidades tipo <code>immer</code> en producto real.
      </p>
      <h3 className={prose.sectionTitle}>Igualdad</h3>
      <ul className={prose.ul}>
        <li className={prose.li}>
          <code>==</code> coerciona tipos; en entrevistas casi siempre usa <code>===</code>.
        </li>
        <li className={prose.li}>
          <code>Object.is</code> distingue <code>NaN</code> y <code>+0/-0</code> — útil si hablas de detalles finos.
        </li>
      </ul>
      <CodeBlock title="Optional chaining + nullish" language="ts">
        {`const city = user?.address?.city ?? "desconocido";
// ?? solo cae con null/undefined, no con "" o 0`}
      </CodeBlock>
      <div className={prose.callout}>
        Practica en voz alta: “Qué pasa si el array está vacío”, “qué devuelvo si no hay match”, “cuál es la complejidad
        aproximada”. Eso es señal de madurez de producto.
      </div>
    </div>
  ),
  learningObjectives: [
    "Manejar con soltura sintaxis ES6+ de uso diario.",
    "Explicar closures y mutabilidad con ejemplos simples.",
    "Evitar errores de coerción en condiciones y comparaciones.",
  ],
  masteryChecklist: [
    "Sé cuándo usar ?? en lugar de ||.",
    "Puedo detectar copia superficial vs profunda.",
    "Puedo leer código ajeno y anticipar su salida.",
  ],
  commonMistakes: [
    "Usar || y perder valores válidos como 0 o ''.",
    "Asumir que spread clona profundamente objetos anidados.",
    "Mezclar == y === sin criterio explícito.",
  ],
  miniChallenge: (
    <p className={prose.p}>
      Implementa <code>safeGet(obj, path, fallback)</code> sin usar librerías (ej: <code>\"a.b.c\"</code>) y discute
      trade-offs frente a optional chaining.
    </p>
  ),
};
