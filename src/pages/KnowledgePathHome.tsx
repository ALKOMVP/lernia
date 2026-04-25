import { Link } from "react-router-dom";
import { javascriptPuzzles, knowledgePathTitle } from "../data/knowledgePath";
import styles from "./KnowledgePathHome.module.css";

export function KnowledgePathHome() {
  return (
    <section className={styles.wrap}>
      <header className={styles.hero}>
        <span className={styles.badge}>{knowledgePathTitle}</span>
        <h1 className={styles.title}>Una aventura ludica para dominar JavaScript real</h1>
        <p className={styles.lead}>
          Este camino te lleva desde fundamentos de razonamiento intermedio hasta arquitectura asincrona avanzada. No
          es teoria pasiva: cada paso es un puzzle con codigo editable, criterio de aprobacion y feedback guiado.
        </p>
      </header>

      <section className={styles.bookCard}>
        <div>
          <h2 className={styles.chapterTitle}>Modulo activo: JavaScript de nivel medio a avanzado</h2>
          <p className={styles.chapterLead}>
            {javascriptPuzzles.length} puzzles encadenados. Resuelves uno, desbloqueas el siguiente. El LLM actua como
            mentor tecnico: valida si apruebas y te empuja al siguiente nivel con pistas accionables.
          </p>
          <ul className={styles.points}>
            <li>Codigo base editable por puzzle.</li>
            <li>Progreso persistente en tu navegador.</li>
            <li>Feedback orientado a entrevistas y pensamiento transferible.</li>
          </ul>
        </div>
        <Link to="/camino-del-conocimiento/javascript" className={styles.enterBtn}>
          Entrar al modulo JavaScript
        </Link>
      </section>
    </section>
  );
}
