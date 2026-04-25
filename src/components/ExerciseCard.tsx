import { Link } from "react-router-dom";
import type { ExerciseMeta } from "../types/exercise";
import styles from "./ExerciseCard.module.css";

const diffClass: Record<ExerciseMeta["difficulty"], string> = {
  base: styles.difficultyBase,
  intermedio: styles.difficultyMid,
  avanzado: styles.difficultyAdv,
};

const diffLabel: Record<ExerciseMeta["difficulty"], string> = {
  base: "Base",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

export function ExerciseCard({ meta }: { meta: ExerciseMeta }) {
  return (
    <article className={styles.card}>
      <Link to={`/ejercicio/${meta.slug}`} className={styles.cardLink}>
        <div className={styles.top}>
          <h2 className={styles.title}>{meta.title}</h2>
          <span className={`${styles.difficulty} ${diffClass[meta.difficulty]}`}>
            {diffLabel[meta.difficulty]}
          </span>
        </div>
        <p className={styles.teaser}>{meta.teaser}</p>
        <div className={styles.meta}>
          {meta.tags.map((t) => (
            <span key={t} className={styles.tag}>
              {t}
            </span>
          ))}
          <span className={styles.tag}>~{meta.minutes} min</span>
        </div>
        <div className={styles.row}>
          Abrir lección <span className={styles.arrow}>→</span>
        </div>
      </Link>
    </article>
  );
}
