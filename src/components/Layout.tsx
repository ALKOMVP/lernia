import { Link, NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import styles from "./Layout.module.css";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.brand}>
            <span className={styles.brandMark}>⌁</span>
            <span className={styles.brandText}>
              <span className={styles.brandTitle}>Prep Live Coding</span>
              <span className={styles.brandSubtitle}>JS · React · tiempo real</span>
            </span>
          </Link>
          <nav className={styles.nav} aria-label="Principal">
            <span className={styles.pill}>Modo estudio · 60 min</span>
            <NavLink
              to="/camino-del-conocimiento"
              className={({ isActive }) => `${styles.pill} ${styles.pillLink} ${isActive ? styles.pillActive : ""}`}
            >
              El camino del conocimiento
            </NavLink>
            <NavLink
              to="/evaluador-llm"
              className={({ isActive }) => `${styles.pill} ${styles.pillLink} ${isActive ? styles.pillActive : ""}`}
            >
              Evaluador LLM
            </NavLink>
          </nav>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        Hecho para practicar entrevistas tipo Front — código educativo, no producción.
      </footer>
    </div>
  );
}
