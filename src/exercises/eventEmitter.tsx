import { CodeBlock } from "../components/CodeBlock";
import type { ExerciseModule } from "../types/exercise";
import { EventEmitterDemo } from "./demos/EventEmitterDemo";
import prose from "../pages/Prose.module.css";

export const eventEmitterExercise: ExerciseModule = {
  meta: {
    slug: "event-emitter",
    title: "EventEmitter mínimo (pub/sub)",
    teaser: "Patrón base detrás de muchas capas de tiempo real y extensiones de producto.",
    tags: ["Patrones", "Arquitectura", "Tiempo real"],
    difficulty: "intermedio",
    minutes: 15,
    whyItMatters:
      "Desacopla módulos: un canal de chat, un bus interno o un SDK pueden emitir eventos sin conocer a todos los consumidores.",
  },
  statement: (
    <div>
      <p className={prose.p}>
        Implementa una clase con <code>on(event, fn)</code>, <code>off(event, fn)</code>, <code>emit(event, ...args)</code>{" "}
        y opcionalmente <code>once</code>. Varios listeners por evento deben ejecutarse todos.
      </p>
    </div>
  ),
  walkthrough: (
    <div>
      <p className={prose.p}>
        Un <code>Map&lt;string, Set&lt;Listener&gt;&gt;</code> evita duplicados accidentales si usas Set, y el unsubscribe
        de <code>on</code> puede devolver una función que llama a <code>off</code> (patrón típico de React effects).
      </p>
      <CodeBlock title="Núcleo (emit con copia defensiva)" language="ts">
        {`emit(event: string, ...args: unknown[]): void {
  const set = this.listeners.get(event);
  if (!set) return;
  // Copia por si un listener se da de baja durante la iteración
  for (const fn of [...set]) {
    fn(...args);
  }
}`}
      </CodeBlock>
      <div className={prose.callout}>
        Menciona en voz alta el riesgo de recursión infinita si dentro de un listener vuelves a emitir el mismo evento
        sin guardas.
      </div>
    </div>
  ),
  learningObjectives: [
    "Modelar pub/sub con APIs pequeñas y claras.",
    "Desacoplar emisor y consumidores sin dependencias directas.",
    "Explicar unsubscribe y prevención de fugas de listeners.",
  ],
  masteryChecklist: [
    "Sé implementar on/off/emit sin duplicar listeners.",
    "Puedo añadir once y justificar su utilidad.",
    "Entiendo por qué copiar listeners al emitir evita bugs.",
  ],
  commonMistakes: [
    "Mutar el set durante iteración sin copia defensiva.",
    "No devolver función de unsubscribe desde on.",
    "Ignorar el cleanup en componentes React suscritos.",
  ],
  miniChallenge: (
    <p className={prose.p}>
      Implementa <code>listenerCount(event)</code> y <code>clear(event?)</code>, y describe en qué métricas de salud
      de una app de chat te ayudarían.
    </p>
  ),
  labSteps: [
    "Dispara varios emits y observa fan-out: dos listeners reciben el mismo evento.",
    "Imagina que uno se da de baja en runtime: ¿qué garantiza la copia defensiva?",
    "Relaciona este patrón con WebSocket/message bus en productos reales.",
  ],
  demo: <EventEmitterDemo />,
};
