import { ExerciseCard } from "../components/ExerciseCard";
import { Link } from "react-router-dom";
import { exerciseList } from "../exercises/registry";
import styles from "./Home.module.css";

export function Home() {
  return (
    <div>
      <header className={styles.hero}>
        <span className={styles.heroBadge}>Cuaderno de práctica · {exerciseList.length} lecciones</span>
        <h1 className={styles.heroTitle}>JavaScript para entender de verdad, no para memorizar</h1>
        <p className={styles.heroLead}>
          Esta app está pensada como estudio profundo: cada lección tiene objetivo, código explicado paso a paso,
          entrenamiento activo y laboratorio ejecutable. El foco es razonar con calma y luego resolver bajo presión de
          entrevista.
        </p>
      </header>
      <section className={styles.method} aria-label="Método de aprendizaje">
        <h2 className={styles.methodTitle}>Método de estudio (investigado y aplicado)</h2>
        <ul className={styles.methodList}>
          <li>
            <strong>Más código, menos teoría pasiva:</strong> mini pasos con feedback inmediato, similar a freeCodeCamp.
          </li>
          <li>
            <strong>Proyecto y práctica deliberada:</strong> resolver, comparar y corregir; no “ver videos y ya”.
          </li>
          <li>
            <strong>Worked examples + retiro gradual:</strong> primero guía completa, luego mini-reto sin guía.
          </li>
          <li>
            <strong>Pensamiento transferible:</strong> entender por qué funciona, para adaptarlo a variantes nuevas.
          </li>
        </ul>
        <p className={styles.methodSources}>
          Referencias:{" "}
          <a href="https://freecodecamp.org/news/responsive-web-design-certification-redesigned" target="_blank" rel="noreferrer">
            freeCodeCamp
          </a>{" "}
          ·{" "}
          <a href="https://www.theodinproject.com/paths/foundations/courses/foundations/lessons/how-this-course-will-work" target="_blank" rel="noreferrer">
            The Odin Project
          </a>{" "}
          ·{" "}
          <a href="https://cs-blog.khanacademy.org/2013/08/the-tutorial-ization-of-our-cs.html" target="_blank" rel="noreferrer">
            Khan Academy
          </a>
        </p>
      </section>
      <section aria-label="Listado de ejercicios" className={styles.grid}>
        {exerciseList.map((meta) => (
          <ExerciseCard key={meta.slug} meta={meta} />
        ))}
      </section>
      <section className={styles.knowledgeCta} aria-label="El camino del conocimiento">
        <h2 className={styles.knowledgeTitle}>Nuevo: El camino del conocimiento</h2>
        <p className={styles.knowledgeLead}>
          Modo aventura para JavaScript medio a avanzado: puzzles encadenados con codigo base editable, aprobacion por
          LLM y desbloqueo progresivo del siguiente portal.
        </p>
        <Link to="/camino-del-conocimiento" className={styles.knowledgeButton}>
          Entrar al camino del conocimiento
        </Link>
      </section>
      <section className={styles.evaluatorCta} aria-label="Evaluador de respuestas con LLM">
        <h2 className={styles.evaluatorTitle}>¿Quieres feedback automático de tus respuestas?</h2>
        <p className={styles.evaluatorLead}>
          Usa el evaluador LLM para pegar tu explicación de una solución y recibir fortalezas, huecos, mejoras,
          testing faltante y un guion de comunicación para entrevista.
        </p>
        <Link to="/evaluador-llm" className={styles.evaluatorButton}>
          Abrir Evaluador LLM
        </Link>
      </section>
      <aside className={styles.note}>
        <strong>Cómo usar esto hoy:</strong> toma 2 lecciones, haz “Enunciado → Guía → Entrenamiento activo →
        Laboratorio”. Cierra narrando la solución en 90 segundos como si ya estuvieras en CoderPad.
      </aside>
    </div>
  );
}
