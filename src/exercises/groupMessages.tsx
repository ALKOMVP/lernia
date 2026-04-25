import { CodeBlock } from "../components/CodeBlock";
import type { ExerciseModule } from "../types/exercise";
import { GroupMessagesDemo } from "./demos/GroupMessagesDemo";
import prose from "../pages/Prose.module.css";

export const groupMessagesExercise: ExerciseModule = {
  meta: {
    slug: "agrupar-mensajes",
    title: "Agrupar mensajes de chat por autor y tiempo",
    teaser: "Problema cercano a portales de soporte: burbujas consecutivas del mismo actor.",
    tags: ["Lógica de producto", "Arrays", "Ordenación"],
    difficulty: "intermedio",
    minutes: 18,
    whyItMatters:
      "Demuestras que entiendes dominio B2B: reducir ruido visual y preservar contexto en hilos largos.",
  },
  statement: (
    <div>
      <p className={prose.p}>
        Dado un arreglo de mensajes <code>{`{ id, authorId, body, ts }`}</code> (epoch ms), devuelve grupos: cada grupo
        tiene el mismo <code>authorId</code> consecutivo y la diferencia de tiempo entre mensajes adyacentes ≤{" "}
        <code>gapMs</code>. Ordena primero por <code>ts</code> ascendente.
      </p>
    </div>
  ),
  walkthrough: (
    <div>
      <p className={prose.p}>
        Recorre en orden temporal. Mantén un “grupo actual”. Si el siguiente mensaje comparte autor con el último del
        grupo y está dentro de la ventana temporal, agrégalo; si no, cierra el grupo y abre uno nuevo.
      </p>
      <CodeBlock title="Bucle principal (idea)" language="ts">
        {`const sorted = [...messages].sort((a, b) => a.ts - b.ts);
const groups = [];
let current = { authorId: sorted[0].authorId, messages: [sorted[0]] };

for (let i = 1; i < sorted.length; i++) {
  const m = sorted[i];
  const prev = current.messages[current.messages.length - 1];
  const sameAuthor = m.authorId === prev.authorId;
  const close = m.ts - prev.ts <= gapMs;
  if (sameAuthor && close) current.messages.push(m);
  else {
    groups.push(current);
    current = { authorId: m.authorId, messages: [m] };
  }
}
groups.push(current);`}
      </CodeBlock>
      <p className={prose.p}>
        Complejidad: O(n log n) por el sort (si ya viene ordenado, O(n)). Habla de estabilidad y de cómo manejarías
        mensajes duplicados o reordenados por red.
      </p>
    </div>
  ),
  learningObjectives: [
    "Traducir una regla de producto a lógica determinista.",
    "Recorrer arrays con estado acumulado sin perder legibilidad.",
    "Razonar sobre orden temporal y consistencia visual.",
  ],
  masteryChecklist: [
    "Puedo explicar cuándo empieza y termina un grupo.",
    "Contemplo mensajes desordenados y lista vacía.",
    "Puedo adaptar la regla a ventanas por canal/prioridad.",
  ],
  commonMistakes: [
    "No ordenar por timestamp antes de agrupar.",
    "Comparar con el primer mensaje del grupo en vez del último.",
    "Olvidar agregar el grupo final al terminar el bucle.",
  ],
  miniChallenge: (
    <div>
      <p className={prose.p}>
        Añade una regla extra: si el mensaje contiene archivo adjunto, fuerza grupo nuevo aunque coincida autor y
        tiempo.
      </p>
    </div>
  ),
  labSteps: [
    "Observa el grupo del usuario con 2 mensajes y el del agente separado.",
    "Cambia mentalmente gapMs a 10s: ¿qué grupos se romperían?",
    "Piensa cómo manejarías mensajes que llegan tarde por red.",
  ],
  demo: <GroupMessagesDemo />,
};
