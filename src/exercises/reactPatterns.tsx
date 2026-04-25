import { CodeBlock } from "../components/CodeBlock";
import type { ExerciseModule } from "../types/exercise";
import prose from "../pages/Prose.module.css";

export const reactPatternsExercise: ExerciseModule = {
  meta: {
    slug: "react-patrones",
    title: "Patrones React para UI reactiva",
    teaser: "Estado derivado, effects con cleanup, keys y renders — alineado con el stack del rol.",
    tags: ["React", "Hooks", "UI"],
    difficulty: "intermedio",
    minutes: 16,
    whyItMatters:
      "El puesto menciona React explícitamente; aunque CoderPad sea vanilla, conectas tu solución con cómo lo montarías en app.",
  },
  statement: (
    <div>
      <p className={prose.p}>
        Imagina que debes sincronizar un campo de búsqueda con la URL o con un store. Enumera riesgos de renders
        infinitos y cómo los evitarías.
      </p>
    </div>
  ),
  walkthrough: (
    <div>
      <h3 className={prose.sectionTitle}>Estado mínimo vs derivado</h3>
      <p className={prose.p}>
        No dupliques en estado lo que puedes calcular en render (filtrado de lista si ya tienes query y datos base).
      </p>
      <h3 className={prose.sectionTitle}>useEffect: suscripción con cleanup</h3>
      <CodeBlock title="WebSocket / canal ficticio" language="tsx">
        {`useEffect(() => {
  const unsub = channel.subscribe("tick", onTick);
  return () => {
    unsub(); // siempre limpiar: evita fugas y dobles handlers en StrictMode dev
  };
}, [onTick]); // o estabiliza onTick con useCallback`}
      </CodeBlock>
      <h3 className={prose.sectionTitle}>Lista con keys estables</h3>
      <p className={prose.p}>
        Usa ids de negocio, no índices de arreglo, para que React reconcilie bien listas de mensajes que crecen en
        tiempo real.
      </p>
      <div className={`${prose.callout} ${prose.calloutWarn}`}>
        Si mencionas <code>useMemo</code>/<code>useCallback</code>, justifica con mediciones o dependencias de hijos
        memorizados; evita sonar a optimización prematura sin criterio.
      </div>
    </div>
  ),
  learningObjectives: [
    "Separar estado fuente de estado derivado.",
    "Aplicar cleanup correcto en efectos de suscripción.",
    "Prevenir renders y bugs de reconciliación por keys.",
  ],
  masteryChecklist: [
    "Puedo justificar cada dependencia de useEffect.",
    "Sé cuándo usar id de negocio como key.",
    "Sé explicar un bug típico de stale closure.",
  ],
  commonMistakes: [
    "Duplicar estado y crear inconsistencias.",
    "Suscribirse en effect sin cleanup al desmontar.",
    "Usar index como key en listas dinámicas.",
  ],
  miniChallenge: (
    <p className={prose.p}>
      Diseña un hook <code>useDebouncedValue</code> y describe cómo evitarías race conditions al disparar fetches.
    </p>
  ),
};
