import { CodeBlock } from "../components/CodeBlock";
import prose from "../pages/Prose.module.css";
import type { ExerciseModule } from "../types/exercise";
import { StateMachineDemo } from "./demos/StateMachineDemo";

export const stateMachineChatExercise: ExerciseModule = {
  meta: {
    slug: "state-machine-chat",
    title: "Máquina de estados para flujo de chat",
    teaser: "Modela estados válidos y evita comportamientos imposibles en UI.",
    tags: ["Arquitectura", "Frontend", "Tiempo real"],
    difficulty: "intermedio",
    minutes: 17,
    whyItMatters:
      "Cuando crece la complejidad, un FSM hace explícitas reglas de negocio y reduce bugs fantasma.",
  },
  statement: (
    <p className={prose.p}>
      Define estados de envío de mensaje (<code>idle</code>, <code>typing</code>, <code>sending</code>, etc.) y
      transiciones válidas. Rechaza cambios inválidos.
    </p>
  ),
  walkthrough: (
    <div>
      <p className={prose.p}>
        En vez de muchos booleans sueltos, usa una sola variable de estado + mapa de transiciones permitidas.
      </p>
      <CodeBlock title="Guard de transición" language="ts">
        {`type ChatState = "idle" | "typing" | "sending" | "delivered" | "failed";
const transitions: Record<ChatState, ChatState[]> = {
  idle: ["typing"],
  typing: ["sending", "idle"],
  sending: ["delivered", "failed"],
  delivered: ["typing"],
  failed: ["typing", "sending"],
};

function canTransition(from: ChatState, to: ChatState): boolean {
  return transitions[from].includes(to);
}`}
      </CodeBlock>
    </div>
  ),
  learningObjectives: [
    "Cambiar booleans dispersos por modelado explícito.",
    "Bloquear transiciones inválidas desde código.",
    "Comunicar diseño con un diagrama simple de estados.",
  ],
  masteryChecklist: [
    "Puedo agregar estado nuevo sin romper anteriores.",
    "Tengo una función canTransition testeable.",
    "Sé dónde loguear transiciones para depuración.",
  ],
  commonMistakes: [
    "Permitir cualquier estado a cualquier estado.",
    "Actualizar estado sin validar transición.",
    "No contemplar estado de error/recuperación.",
  ],
  miniChallenge: <p className={prose.p}>Añade estado <code>retrying</code> y limita reintentos a 2.</p>,
  demo: <StateMachineDemo />,
};
