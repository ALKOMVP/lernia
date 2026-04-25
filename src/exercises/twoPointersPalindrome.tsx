import { CodeBlock } from "../components/CodeBlock";
import prose from "../pages/Prose.module.css";
import type { ExerciseModule } from "../types/exercise";

export const twoPointersPalindromeExercise: ExerciseModule = {
  meta: {
    slug: "two-pointers-palindrome",
    title: "Two pointers: palíndromo tolerante",
    teaser: "Comparar extremos limpiando caracteres no alfanuméricos. Simple y muy entrevistable.",
    tags: ["Strings", "Two pointers", "Entrevista"],
    difficulty: "base",
    minutes: 12,
    whyItMatters:
      "Es un clásico para demostrar claridad al recorrer desde ambos lados y tratar casos de normalización.",
  },
  statement: (
    <p className={prose.p}>
      Implementa función que verifica si un texto es palíndromo ignorando símbolos y mayúsculas/minúsculas.
    </p>
  ),
  walkthrough: (
    <div>
      <CodeBlock title="Solución de dos punteros" language="ts">
        {`function isPalindrome(raw: string): boolean {
  const s = raw.toLowerCase();
  let i = 0, j = s.length - 1;
  const isAlnum = (c: string) => /[a-z0-9]/.test(c);
  while (i < j) {
    while (i < j && !isAlnum(s[i]!)) i++;
    while (i < j && !isAlnum(s[j]!)) j--;
    if (s[i] !== s[j]) return false;
    i++; j--;
  }
  return true;
}`}
      </CodeBlock>
      <p className={prose.p}>
        Caso útil para explicar cómo separar “limpieza de input” de “comparación principal”.
      </p>
    </div>
  ),
  learningObjectives: [
    "Aplicar two pointers en strings.",
    "Manejar filtros de caracteres sin construir copias costosas.",
    "Practicar lectura clara de bucles while.",
  ],
  masteryChecklist: [
    "Pasa casos con signos y espacios.",
    "No se sale de rango en while internos.",
    "Puedo adaptar a 'eliminar un char y validar'.",
  ],
  commonMistakes: [
    "No normalizar a minúscula.",
    "Olvidar saltar caracteres no válidos en ambos lados.",
    "Construir string filtrado completo sin necesidad.",
  ],
  miniChallenge: (
    <p className={prose.p}>
      Variante: devuelve <code>true</code> si puede ser palíndromo eliminando como máximo un carácter.
    </p>
  ),
};
