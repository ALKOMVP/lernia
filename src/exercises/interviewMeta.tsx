import type { ExerciseModule } from "../types/exercise";
import prose from "../pages/Prose.module.css";

export const interviewMetaExercise: ExerciseModule = {
  meta: {
    slug: "meta-entrevista",
    title: "Cómo brillar en 60 minutos de CoderPad",
    teaser: "Comunicación, corte de alcance y señales de senior — sin una sola línea obligatoria de código.",
    tags: ["Comunicación", "Proceso", "Front"],
    difficulty: "base",
    minutes: 8,
    whyItMatters:
      "El correo dice que la sesión es colaborativa: tu ventaja es pensar en voz alta como PM+engineer.",
  },
  statement: (
    <div>
      <p className={prose.p}>
        El evaluador busca código limpio que funcione, pero también cómo acotas el problema, pides ejemplos y
        priorizas entregables.
      </p>
    </div>
  ),
  walkthrough: (
    <div>
      <h3 className={prose.sectionTitle}>Apertura (2–3 min)</h3>
      <ul className={prose.ul}>
        <li className={prose.li}>Repite el enunciado con tus palabras y confirma inputs/salidas y casos borde.</li>
        <li className={prose.li}>Pregunta si importa complejidad vs pragmatismo (suelen valorar pragmatismo).</li>
      </ul>
      <h3 className={prose.sectionTitle}>Mitad (bulk del tiempo)</h3>
      <ul className={prose.ul}>
        <li className={prose.li}>Boceta en comentarios la API pública de tus funciones antes de implementar.</li>
        <li className={prose.li}>Implementa el camino feliz, luego borde; nombras tests mentales mientras escribes.</li>
        <li className={prose.li}>Si te atascas, ofrece una versión naive primero y optimiza con su feedback.</li>
      </ul>
      <h3 className={prose.sectionTitle}>Cierre</h3>
      <ul className={prose.ul}>
        <li className={prose.li}>Resume trade-offs: memoria, complejidad, cómo evolucionaría en producción.</li>
        <li className={prose.li}>Conecta con el dominio del rol (chat, portal, integraciones) cuando encaje natural.</li>
      </ul>
      <div className={prose.callout}>
        En roles “product and business oriented”, una frase fuerte es: “Primero haría X porque desbloquea Y para el
        usuario, aunque Z sería ideal a escala”.
      </div>
    </div>
  ),
  learningObjectives: [
    "Estructurar la conversación técnica antes de picar código.",
    "Gestionar tiempo en dos partes de problema.",
    "Cerrar con trade-offs claros y siguientes pasos.",
  ],
  masteryChecklist: [
    "Confirmo inputs, outputs y edge cases en <3 minutos.",
    "Verbalizo complejidad y límites de mi solución.",
    "Propongo una mejora si quedara tiempo.",
  ],
  commonMistakes: [
    "Quedarse callado mientras piensa o depura.",
    "Perseguir perfección temprana en vez de entregar camino feliz.",
    "No validar manualmente con ejemplos concretos al final.",
  ],
  miniChallenge: (
    <div>
      <p className={prose.p}>
        Grábate resolviendo un ejercicio de esta plataforma en 20 min: 2 min de aclaraciones, 14 min de implementación,
        4 min de cierre. Luego revisa: ¿fuiste claro y colaborativo?
      </p>
    </div>
  ),
};
