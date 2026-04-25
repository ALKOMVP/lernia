import { CodeBlock } from "../components/CodeBlock";
import prose from "../pages/Prose.module.css";
import type { ExerciseModule } from "../types/exercise";
import { ReducerQuestDemo } from "./demos/ReducerQuestDemo";

export const reactReducerExercise: ExerciseModule = {
  meta: {
    slug: "react-reducer",
    title: "useReducer para estado complejo en UI",
    teaser: "Cuando useState se vuelve caótico, reducer aporta estructura y trazabilidad.",
    tags: ["React", "Hooks", "Estado"],
    difficulty: "intermedio",
    minutes: 16,
    whyItMatters:
      "Front trabaja con interfaces de soporte con muchos eventos; reducers ayudan a mantener orden mental.",
  },
  statement: (
    <p className={prose.p}>
      Modela estado de compositor de mensajes con <code>useReducer</code>: escribir borrador, enviar, limpiar, y
      almacenar historial.
    </p>
  ),
  walkthrough: (
    <div>
      <p className={prose.p}>
        Un reducer centraliza transiciones. Las acciones son explícitas y testeables. Muy útil cuando hay varios
        eventos de UI sobre el mismo estado.
      </p>
      <CodeBlock title="Esqueleto mental" language="tsx">
        {`type Action =
  | { type: "type"; value: string }
  | { type: "send" }
  | { type: "clear" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "type": return { ...state, draft: action.value };
    case "send": // valida y construye siguiente estado
    case "clear": return initialState;
  }
}`}
      </CodeBlock>
    </div>
  ),
  learningObjectives: [
    "Elegir useReducer cuando hay lógica de transición no trivial.",
    "Diseñar acciones legibles y acotadas.",
    "Mantener reducer puro (sin side effects).",
  ],
  masteryChecklist: [
    "Sé detectar acciones redundantes.",
    "No mutar arrays/objetos en reducer.",
    "Puedo testear reducer como función pura.",
  ],
  commonMistakes: [
    "Meter llamadas async dentro del reducer.",
    "Mutar state y retornar mismo objeto.",
    "Crear acciones ambiguas difíciles de depurar.",
  ],
  miniChallenge: (
    <p className={prose.p}>
      Añade acción <code>undo</code> guardando historial de estados previos (sin librerías).
    </p>
  ),
  demo: <ReducerQuestDemo />,
};
