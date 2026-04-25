import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getExercise } from "../exercises/registry";
import prose from "./Prose.module.css";
import { NotFound } from "./NotFound";

type Tab = "enunciado" | "guia" | "entrenar" | "lab";

export function ExerciseDetail() {
  const { slug } = useParams();
  const exercise = useMemo(() => getExercise(slug), [slug]);
  const [tab, setTab] = useState<Tab>("enunciado");

  useEffect(() => {
    setTab("enunciado");
  }, [slug]);

  if (!exercise) {
    return <NotFound />;
  }

  const {
    meta,
    statement,
    walkthrough,
    demo,
    learningObjectives,
    masteryChecklist,
    commonMistakes,
    miniChallenge,
    labSteps,
  } = exercise;
  const hasLab = Boolean(demo);

  return (
    <article className={prose.article}>
      <Link to="/" className={prose.back}>
        ← Volver al mapa
      </Link>
      <header className={prose.hero}>
        <p className={prose.kicker}>Por qué importa</p>
        <h1 className={prose.h1}>{meta.title}</h1>
        <p className={prose.lead}>{meta.whyItMatters}</p>
      </header>
      <section className={prose.overviewGrid} aria-label="Resumen pedagógico">
        <article className={prose.overviewCard}>
          <h2 className={prose.overviewTitle}>Objetivos de aprendizaje</h2>
          <ul className={prose.compactList}>
            {(learningObjectives ?? [
              "Entender el problema con un ejemplo pequeño.",
              "Implementar una solución correcta y legible.",
              "Explicar trade-offs y casos borde en voz alta.",
            ]).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className={prose.overviewCard}>
          <h2 className={prose.overviewTitle}>Checklist de dominio</h2>
          <ul className={prose.compactList}>
            {(masteryChecklist ?? [
              "Puedo explicar la complejidad temporal/espacial.",
              "Sé qué pasa con input vacío o inválido.",
              "Puedo adaptar la solución a un requisito extra.",
            ]).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <div className={prose.tabs} role="tablist" aria-label="Secciones del ejercicio">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "enunciado"}
          className={`${prose.tab} ${tab === "enunciado" ? prose.tabActive : ""}`}
          onClick={() => setTab("enunciado")}
        >
          Enunciado
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "guia"}
          className={`${prose.tab} ${tab === "guia" ? prose.tabActive : ""}`}
          onClick={() => setTab("guia")}
        >
          Guía y código
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "entrenar"}
          className={`${prose.tab} ${tab === "entrenar" ? prose.tabActive : ""}`}
          onClick={() => setTab("entrenar")}
        >
          Entrenamiento activo
        </button>
        {hasLab ? (
          <button
            type="button"
            role="tab"
            aria-selected={tab === "lab"}
            className={`${prose.tab} ${tab === "lab" ? prose.tabActive : ""}`}
            onClick={() => setTab("lab")}
          >
            Laboratorio
          </button>
        ) : null}
      </div>

      <div className={prose.panel}>
        {tab === "enunciado" ? statement : null}
        {tab === "guia" ? walkthrough : null}
        {tab === "entrenar" ? (
          <div>
            <h2 className={prose.sectionTitle}>Errores comunes</h2>
            <ul className={prose.ul}>
              {(commonMistakes ?? [
                "Saltar a codear sin fijar ejemplos concretos.",
                "No verbalizar supuestos y edge cases.",
                "No cerrar con una mini-validación manual.",
              ]).map((item) => (
                <li key={item} className={prose.li}>
                  {item}
                </li>
              ))}
            </ul>
            <h2 className={prose.sectionTitle}>Mini-reto (sin mirar la guía)</h2>
            <div className={prose.practiceBox}>
              {miniChallenge ?? (
                <p className={prose.p}>
                  Reimplementa la función central desde cero en 8 minutos, luego compara con la guía y enumera 2
                  mejoras de legibilidad.
                </p>
              )}
            </div>
          </div>
        ) : null}
        {tab === "lab" && demo ? (
          <div className={prose.demoWrap}>
            <h2 className={prose.demoTitle}>Prueba interactiva</h2>
            {labSteps?.length ? (
              <ol className={prose.labSteps}>
                {labSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            ) : null}
            {demo}
          </div>
        ) : null}
      </div>
    </article>
  );
}
