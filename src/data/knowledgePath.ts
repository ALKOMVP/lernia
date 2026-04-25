import type { KnowledgePuzzle } from "../types/knowledgePath";

export const knowledgePathTitle = "El camino del conocimiento";

export const javascriptPuzzles: KnowledgePuzzle[] = [
  {
    id: "cipher-00-normalizador",
    chapter: "Capitulo I · El umbral",
    title: "El normalizador de runas",
    difficulty: "medio",
    narrative:
      "En la puerta de entrada, cada mensaje llega con ruido: nulls, strings vacios y espacios de mas. Si no normalizas, el mapa se rompe.",
    prompt:
      "Implementa normalizeTokens(input) para convertir una lista mixta en un array limpio de tokens. Debe ignorar null/undefined, recortar espacios, convertir a minusculas y eliminar duplicados manteniendo el orden de primera aparicion.",
    learningGoals: [
      "Defenderse de entradas sucias sin romper la ejecucion.",
      "Combinar transformacion + filtrado + deduplicacion.",
      "Mantener orden estable sin costo excesivo.",
    ],
    completionCriteria: [
      "No muta el array original.",
      "Ignora valores no string y strings vacios tras trim.",
      "Devuelve tokens unicos en orden de aparicion.",
    ],
    loreHint: "Si deduplicas con Set, recuerda mantener el orden del primer encuentro.",
    starterCode: `export function normalizeTokens(input) {
  // TODO:
  // 1) Validar que input sea array; si no, retornar []
  // 2) Recorrer input y quedarte solo con strings utiles
  // 3) trim + lowercase
  // 4) eliminar duplicados manteniendo orden
  return [];
}`,
  },
  {
    id: "cipher-01-sliding-signals",
    chapter: "Capitulo II · El rio de eventos",
    title: "Ventana de señales estables",
    difficulty: "medio",
    narrative:
      "El rio trae miles de eventos por minuto. Debes detectar la mejor racha sin duplicados para no perder una oportunidad critica.",
    prompt:
      "Implementa longestUniqueBurst(events) que retorne la longitud de la sublista contigua mas larga sin elementos repetidos.",
    learningGoals: [
      "Aplicar sliding window con punteros.",
      "Razonar sobre complejidad O(n).",
      "Actualizar estado incrementalmente sin recomputar todo.",
    ],
    completionCriteria: [
      "Resuelve en tiempo lineal.",
      "Funciona con arrays vacios y eventos repetidos consecutivos.",
      "No usa nested loops para reescanear toda la ventana.",
    ],
    loreHint: "Un mapa de ultimo indice visto evita retroceder de mas el puntero izquierdo.",
    starterCode: `export function longestUniqueBurst(events) {
  // TODO: implementar sliding window O(n)
  // Ej: ["a","b","a","c","d"] => 4 ("b","a","c","d")
  return 0;
}`,
  },
  {
    id: "cipher-02-deep-merge",
    chapter: "Capitulo III · La biblioteca fractal",
    title: "Fusion profunda sin mutaciones",
    difficulty: "medio-alto",
    narrative:
      "Dos grimorios describen la misma configuracion. Debes fusionarlos sin destruir los originales y sin mezclar referencias peligrosas.",
    prompt:
      "Implementa deepMerge(base, patch) para combinar objetos recursivamente. Si ambos valores son objetos planos, merge recursivo; para el resto, patch pisa a base.",
    learningGoals: [
      "Diferenciar copia superficial vs profunda.",
      "Evitar mutaciones accidentales.",
      "Pensar criterios de merge explicitos.",
    ],
    completionCriteria: [
      "No muta ni base ni patch.",
      "Hace merge recursivo solo para objetos planos.",
      "Maneja nulls y tipos primitivos correctamente.",
    ],
    loreHint: "No todo typeof object debe mergearse: arrays y fechas suelen requerir estrategia distinta.",
    starterCode: `function isPlainObject(value) {
  // TODO: retornar true solo para objetos literales
  return false;
}

export function deepMerge(base, patch) {
  // TODO: implementar merge recursivo inmutable
  return {};
}`,
  },
  {
    id: "cipher-03-memo-ttl",
    chapter: "Capitulo IV · El reloj de arena",
    title: "Memoizacion con expiracion",
    difficulty: "medio-alto",
    narrative:
      "Tus hechizos son costosos. Puedes cachearlos, pero el conocimiento envejece; cuando caduca, debes recalcular.",
    prompt:
      "Implementa memoizeWithTTL(fn, ttlMs) que cachee resultados por argumentos serializados. Si la entrada existe y no expiro, reutiliza. Si expiro, recalcula y reemplaza.",
    learningGoals: [
      "Construir caches con politicas de validez temporal.",
      "Diseñar claves de cache estables.",
      "Balancear performance y frescura de datos.",
    ],
    completionCriteria: [
      "Evita recalculo durante ttl valido.",
      "Recalcula y actualiza al expirar.",
      "No rompe para multiples combinaciones de argumentos.",
    ],
    loreHint: "El cache guarda valor + timestamp. Decide que reloj usar y como invalidar.",
    starterCode: `export function memoizeWithTTL(fn, ttlMs) {
  const cache = new Map();
  return function memoized(...args) {
    // TODO:
    // - construir key
    // - revisar expiracion
    // - devolver cache o recalcular
    return fn(...args);
  };
}`,
  },
  {
    id: "cipher-04-event-bus",
    chapter: "Capitulo V · La sala de ecos",
    title: "Event bus con on/off/once",
    difficulty: "medio-alto",
    narrative:
      "Los guardianes se comunican por eventos. Necesitas un bus robusto: suscribir, desuscribir, y handlers que vivan una sola vez.",
    prompt:
      "Implementa createEventBus() que retorna { on, off, once, emit }. on(event, handler) suscribe; off remueve; once se auto-remueve tras primer emit; emit ejecuta handlers en orden.",
    learningGoals: [
      "Modelar pub/sub simple y confiable.",
      "Manejar remociones sin romper iteraciones activas.",
      "Diseñar APIs ergonomicas para sistemas event-driven.",
    ],
    completionCriteria: [
      "once se ejecuta solo una vez.",
      "off elimina handler exacto.",
      "emit no falla si no hay listeners.",
    ],
    loreHint: "Para evitar efectos de remocion durante emit, itera sobre una copia defensiva.",
    starterCode: `export function createEventBus() {
  // TODO: estructura de listeners por evento
  return {
    on(event, handler) {},
    off(event, handler) {},
    once(event, handler) {},
    emit(event, payload) {},
  };
}`,
  },
  {
    id: "cipher-05-retry-jitter",
    chapter: "Capitulo VI · La tormenta asincrona",
    title: "Retry exponencial con jitter",
    difficulty: "avanzado",
    narrative:
      "Los portales fallan de forma intermitente. Si todos reintentan al mismo tiempo, colapsa todo. Necesitas backoff con jitter.",
    prompt:
      "Implementa retryWithJitter(task, options) para reintentar una funcion async con backoff exponencial y jitter aleatorio. Debe lanzar error final cuando supera maxRetries.",
    learningGoals: [
      "Orquestar reintentos robustos en IO inestable.",
      "Aplicar backoff exponencial con aleatoriedad.",
      "Manejar errores async preservando causa final.",
    ],
    completionCriteria: [
      "Respeta maxRetries.",
      "Espera entre intentos con baseDelay * 2^intento + jitter.",
      "Devuelve resultado al primer exito.",
    ],
    loreHint: "Separar calculo de delay y sleep simplifica testing.",
    starterCode: `function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryWithJitter(task, options = {}) {
  const { maxRetries = 4, baseDelayMs = 150, jitterMs = 60 } = options;
  // TODO: loop de intentos + backoff + jitter
  return task();
}`,
  },
  {
    id: "cipher-06-promise-pool",
    chapter: "Capitulo VII · El consejo de concurrencia",
    title: "Promise pool con limite dinamico",
    difficulty: "avanzado",
    narrative:
      "Tienes cien expediciones simultaneas, pero solo caben unas pocas en la mesa de control. Controla concurrencia sin perder orden final.",
    prompt:
      "Implementa runPool(tasks, concurrency) donde tasks es array de funciones async. Ejecuta max concurrency en paralelo y retorna resultados en orden original.",
    learningGoals: [
      "Controlar concurrencia real en JavaScript.",
      "Conservar orden de salida aunque terminen desordenadas.",
      "Propagar errores de forma predecible.",
    ],
    completionCriteria: [
      "No supera concurrencia maxima.",
      "Retorna resultados en indice original.",
      "Si una tarea falla, rechaza con ese error.",
    ],
    loreHint: "Un puntero compartido + workers en loop suele ser mas simple que recursividad compleja.",
    starterCode: `export async function runPool(tasks, concurrency = 3) {
  // tasks: Array<() => Promise<any>>
  // TODO:
  // 1) validar entradas
  // 2) lanzar workers hasta concurrency
  // 3) mantener resultados por indice
  return [];
}`,
  },
  {
    id: "cipher-07-stream-aggregator",
    chapter: "Capitulo VIII · El santuario final",
    title: "Agregador incremental de stream",
    difficulty: "avanzado",
    narrative:
      "Ultimo portal: un stream infinito de mensajes. Debes mantener estadisticas incrementales por autor y ventana de tiempo sin recalcular todo.",
    prompt:
      "Implementa createStreamAggregator(windowMs) que retorne { push, snapshot }. push(message) ingresa eventos {author, timestamp}. snapshot() devuelve top autor, total valido y cantidad por autor en ventana activa.",
    learningGoals: [
      "Diseñar estructuras incrementales para streams.",
      "Limpiar datos expirados sin barrer todo cada vez.",
      "Pensar APIs de observabilidad en tiempo real.",
    ],
    completionCriteria: [
      "Ignora mensajes invalidos.",
      "Mantiene solo eventos dentro de la ventana.",
      "snapshot refleja estado consistente tras multiples pushes.",
    ],
    loreHint: "Una cola temporal y un contador por autor permiten eviction amortizada eficiente.",
    starterCode: `export function createStreamAggregator(windowMs = 60_000) {
  // TODO: mantener una cola de eventos y un mapa de conteos
  return {
    push(message) {},
    snapshot() {
      return {
        totalValid: 0,
        topAuthor: null,
        byAuthor: {},
      };
    },
  };
}`,
  },
];
