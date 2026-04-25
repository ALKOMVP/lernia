import { CodeBlock } from "../components/CodeBlock";
import type { ExerciseModule } from "../types/exercise";
import { LruDemo } from "./demos/LruDemo";
import prose from "../pages/Prose.module.css";

export const lruCacheExercise: ExerciseModule = {
  meta: {
    slug: "lru-cache",
    title: "Caché LRU con Map + lista doble",
    teaser: "Estructura de datos entrevistable que aparece cuando hay límites de memoria o ventanas de sesión.",
    tags: ["Estructuras de datos", "Complejidad", "TypeScript"],
    difficulty: "avanzado",
    minutes: 25,
    whyItMatters:
      "Patrones de caché de conversaciones, tokens de portal o resultados de búsqueda con eviction explícita.",
  },
  statement: (
    <div>
      <p className={prose.p}>
        Diseña una clase <code>LRUCache&lt;K,V&gt;</code> con capacidad fija <code>N</code>. Operaciones{" "}
        <code>get(key)</code> y <code>set(key, value)</code> en tiempo amortizado O(1). Al superar la capacidad, expulsa
        la entrada <strong>menos usada recientemente</strong>.
      </p>
    </div>
  ),
  walkthrough: (
    <div>
      <p className={prose.p}>
        <strong>Map</strong> da acceso O(1) por clave. Una <strong>lista doblemente enlazada</strong> mantiene el orden
        de uso: frente = más reciente, cola = candidato a expulsar. Los nodos centinela simplifican bordes vacíos.
      </p>
      <div className={`${prose.callout} ${prose.calloutWarn}`}>
        Si solo usas <code>Map</code> y reinsertas al final en cada get, en JS moderno el orden de inserción ayuda, pero
        en entrevista suelen querer la lista explícita para razonar sobre punteros.
      </div>
      <CodeBlock title="API esencial (resumida)" language="ts">
        {`export class LRUCache<K, V> {
  // Map: key -> nodo en la lista
  // Lista: head ... nodos ... tail (centinelas)
  constructor(capacity: number) { /* ... */ }
  get(key: K): V | undefined { /* mover a frente */ }
  set(key: K, value: V): void { /* insertar o actualizar; evict si hace falta */ }
}`}
      </CodeBlock>
      <p className={prose.p}>
        La implementación completa está en <code>src/lib/lruCache.ts</code> del repo de práctica: léela línea a línea
        antes de la entrevista y traza un <code>set</code> que provoca eviction.
      </p>
    </div>
  ),
  learningObjectives: [
    "Combinar estructuras para conseguir O(1) realista.",
    "Entender por qué LRU modela memoria limitada.",
    "Poder trazar punteros manualmente sin confundirte.",
  ],
  masteryChecklist: [
    "Explico qué nodo se expulsa y por qué.",
    "Puedo justificar centinelas para simplificar bordes.",
    "Sé adaptar la clase a un método delete(key).",
  ],
  commonMistakes: [
    "No mover a frente en get y romper la semántica LRU.",
    "Desenlazar nodos de forma incompleta (prev/next inconsistentes).",
    "No validar capacidad mínima y dejar estados inválidos.",
  ],
  miniChallenge: (
    <p className={prose.p}>
      Implementa <code>peek(key)</code> que lea sin alterar recencia, y explica un caso donde eso sea útil en
      observabilidad.
    </p>
  ),
  labSteps: [
    "Inserta a,b,c y luego accede a 'a' para volverlo reciente.",
    "Inserta 'd' y verifica qué clave fue expulsada.",
    "Explica cada cambio en la lista doble como si lo dibujaras en pizarra.",
  ],
  demo: <LruDemo />,
};
