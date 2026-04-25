import { useMemo, useRef, useState } from "react";
import { evaluateAnswer, requestWandHelp, revealIdealSolution } from "../lib/evaluatorApi";
import type { EvaluationResponse, WandResponse } from "../types/evaluator";
import styles from "./LlmEvaluator.module.css";

const sampleQuestion = `Parte 1: Implementa una función que agrupe mensajes consecutivos del mismo autor si están dentro de 60 segundos.
Parte 2: Extiende la solución para que un mensaje con adjunto siempre fuerce grupo nuevo.`;

const conversationEventSourcingQuestion = `Implementa una función que procese eventos de un sistema de conversaciones (tipo ticket/email) y reconstruya el estado final por conversationId.

Tipos de evento:
- messageReceived: si la conversación no existe, crearla; actualizar subject y agregar mensaje con timestamp.
- assigned: actualizar assignedUser con override del valor anterior.
- unassigned: remover assignedUser.

Requisitos:
1) Aplicar eventos en orden de timestamp (si no vienen ordenados, ordenarlos).
2) Mantener lastUpdatedTimestamp por conversación.
3) Conservar historial de mensajes por conversación.
4) Retornar una estructura indexada por conversationId (idealmente Map o Record).
5) Explicar complejidad temporal y espacial.

Parte 2:
- Define al menos 5 casos de prueba clave (override de assigned, eventos fuera de orden, conversación sin mensajes, unassigned sin assigned previo, etc.).
- Explica qué cambios harías si el volumen fuera de millones de eventos (streaming, particionado, memoria).`;

const exerciseCatalog = [
  { value: "two-part-problem", label: "two-part-problem", defaultQuestion: sampleQuestion },
  { value: "algoritmos", label: "algoritmos", defaultQuestion: sampleQuestion },
  { value: "javascript", label: "javascript", defaultQuestion: sampleQuestion },
  { value: "react", label: "react", defaultQuestion: sampleQuestion },
  { value: "sistemas-chat-portal", label: "sistemas-chat-portal", defaultQuestion: sampleQuestion },
  {
    value: "event-sourcing-conversaciones",
    label: "event-sourcing-conversaciones (nuevo)",
    defaultQuestion: conversationEventSourcingQuestion,
  },
] as const;

export function LlmEvaluator() {
  const [exerciseType, setExerciseType] = useState<string>(exerciseCatalog[0]!.value);
  const [question, setQuestion] = useState(sampleQuestion);
  const [candidateAnswer, setCandidateAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [wandLoading, setWandLoading] = useState(false);
  const [revealLoading, setRevealLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<EvaluationResponse | null>(null);
  const [wandCurrent, setWandCurrent] = useState<(WandResponse & { sourceAnswer: string }) | null>(null);
  const [wandContextHints, setWandContextHints] = useState<string[]>([]);
  const [copyOkStep, setCopyOkStep] = useState<number | null>(null);
  const [applyOkStep, setApplyOkStep] = useState<number | null>(null);
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const outputRef = useRef<HTMLDivElement | null>(null);

  const scoreTone = useMemo(() => {
    const score = result?.score ?? 0;
    if (score >= 80) return { color: "#bbf7d0", border: "rgba(74,222,128,0.4)" };
    if (score >= 60) return { color: "#fde68a", border: "rgba(251,191,36,0.4)" };
    return { color: "#fecdd3", border: "rgba(251,113,133,0.5)" };
  }, [result]);

  const scoreTooltip = useMemo(() => {
    if (!result?.scoreBreakdown) return null;
    const b = result.scoreBreakdown;
    const impacts = (result.improvementImpact ?? []).slice(0, 4);
    return {
      lines: [
        `Correctitud: ${b.correctness}/${b.maxPerCategory}`,
        `Casos borde: ${b.edgeCases}/${b.maxPerCategory}`,
        `Claridad código: ${b.codeClarity}/${b.maxPerCategory}`,
        `Comunicación: ${b.communication}/${b.maxPerCategory}`,
      ],
      impacts,
    };
  }, [result]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setWandCurrent(null);
    setWandContextHints([]);
    setLoading(true);
    try {
      const data = await evaluateAnswer({ exerciseType, question, candidateAnswer });
      setResult(data);
      focusOutputPanel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  async function onWandClick(focusImprovementItem?: string) {
    if (!result) {
      setError("Primero ejecuta “Evaluar con LLM” para habilitar la varita.");
      return;
    }
    setError("");
    setWandLoading(true);
    try {
      const hint = await requestWandHelp({
        exerciseType,
        question,
        candidateAnswer,
        iteration: wandContextHints.length + 1,
        previousHints: wandContextHints,
        previousImprovedAnswer: wandCurrent?.improvedAnswer,
        focusImprovementItem,
        lastEvaluationScore: result?.score,
        lastEvaluationStrengths: result?.strengths,
        lastEvaluationIssues: result?.issues,
        lastEvaluationImprovements: result?.improvements,
        lastEvaluationMissingTests: result?.missingTests,
        lastScoreBreakdown: result?.scoreBreakdown,
        lastImprovementImpact: result?.improvementImpact,
      });
      setWandCurrent({ ...hint, sourceAnswer: candidateAnswer });
      setWandContextHints((prev) => [...prev, `${hint.focusArea}: ${hint.tinyUpgrade}`].slice(-10));
      focusOutputPanel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido en la varita.");
    } finally {
      setWandLoading(false);
    }
  }

  async function onRevealClick() {
    setError("");
    setRevealLoading(true);
    try {
      const data = await revealIdealSolution({
        exerciseType,
        question,
        candidateAnswer,
      });
      if (!data.solutionCode?.trim()) {
        throw new Error("La solución devuelta vino vacía.");
      }
      setCandidateAnswer(data.solutionCode);
      setWandCurrent(null);
      setWandContextHints([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo revelar el resultado final.");
    } finally {
      setRevealLoading(false);
    }
  }

  async function copySnippet(hint: WandResponse & { sourceAnswer: string }) {
    try {
      await navigator.clipboard.writeText(hint.improvedAnswer?.trim() ? hint.improvedAnswer : hint.revisedSnippet);
      setCopyOkStep(hint.iteration);
      setTimeout(() => setCopyOkStep((s) => (s === hint.iteration ? null : s)), 1300);
    } catch {
      setError("No se pudo copiar al portapapeles.");
    }
  }

  async function copyCurrentAnswer() {
    if (!candidateAnswer.trim()) {
      setError("Todavía no hay texto para copiar.");
      return;
    }
    try {
      await navigator.clipboard.writeText(candidateAnswer);
      setCopiedAnswer(true);
      setTimeout(() => setCopiedAnswer(false), 1300);
    } catch {
      setError("No se pudo copiar el texto del alumno.");
    }
  }

  function applySnippet(hint: WandResponse & { sourceAnswer: string }) {
    if (hint.improvedAnswer?.trim()) {
      setCandidateAnswer(hint.improvedAnswer);
    } else {
      const block = `\n\n// Sugerencia varita (paso ${hint.iteration})\n${hint.revisedSnippet}`;
      setCandidateAnswer((prev) => `${prev.trimEnd()}${block}`);
    }
    setApplyOkStep(hint.iteration);
    setTimeout(() => setApplyOkStep((s) => (s === hint.iteration ? null : s)), 1300);
  }

  function focusOutputPanel() {
    requestAnimationFrame(() => {
      outputRef.current?.focus();
      outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function onExerciseTypeChange(nextType: string) {
    setExerciseType(nextType);
    const selected = exerciseCatalog.find((item) => item.value === nextType);
    if (!selected) return;

    // Rellena automáticamente una guía base para practicar sin perder tiempo en redactar consigna.
    setQuestion(selected.defaultQuestion);
  }

  return (
    <section className={styles.wrap}>
      <header className={styles.hero}>
        <h1 className={styles.title}>Evaluador LLM de respuestas de entrevista</h1>
        <p className={styles.lead}>
          Pega tu explicación o solución y recibe feedback estructurado: fortalezas, huecos, mejoras y guion de cómo
          decirlo mejor en vivo.
        </p>
        <p className={styles.warning}>
          Usa tu propia API key en <code>.env</code>. No existe una API pública para reutilizar la membresía de Cursor
          dentro de esta app.
        </p>
      </header>

      <form onSubmit={(e) => void onSubmit(e)} className={styles.form}>
        <div>
          <label className={styles.label} htmlFor="exerciseType">
            Tipo de ejercicio
          </label>
          <select id="exerciseType" value={exerciseType} onChange={(e) => onExerciseTypeChange(e.target.value)}>
            {exerciseCatalog.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={styles.label} htmlFor="question">
            Enunciado / problema
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className={styles.textareaLg}
          />
        </div>

        <div>
          <div className={styles.labelRow}>
            <label className={styles.label} htmlFor="answer">
              Tu respuesta (texto libre)
            </label>
            <button
              type="button"
              className={`btn ${styles.iconBtn}`}
              onClick={() => void copyCurrentAnswer()}
              title={copiedAnswer ? "Copiado" : "Copiar texto del alumno"}
              aria-label={copiedAnswer ? "Copiado" : "Copiar texto del alumno"}
            >
              <span className={styles.iconGlyph} aria-hidden="true">
                {copiedAnswer ? "✓" : "📋"}
              </span>
            </button>
          </div>
          <textarea
            id="answer"
            value={candidateAnswer}
            onChange={(e) => setCandidateAnswer(e.target.value)}
            className={styles.textareaLg}
            placeholder="Explica tu enfoque, edge cases, complejidad, y cómo adaptarías a parte 2."
          />
        </div>

        <div className={styles.actions}>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Evaluando..." : "Evaluar con LLM"}
          </button>
          <button type="button" className={`btn ${styles.revealBtn}`} disabled={revealLoading} onClick={() => void onRevealClick()}>
            {revealLoading ? "Revelando..." : "✨ Revelar solución ideal (100/100)"}
          </button>
        </div>
      </form>

      {error ? <div className={styles.error}>{error}</div> : null}

      {(loading || wandLoading) ? (
        <div className={styles.fxOverlay} aria-hidden="true">
          {loading ? (
            <div className={styles.gearFx}>
              <div className={`${styles.gear} ${styles.gearLg}`}>
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className={`${styles.gear} ${styles.gearMd}`}>
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className={`${styles.gear} ${styles.gearSm}`}>
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          ) : null}
          {wandLoading ? (
            <div className={styles.wandFx}>
              <div className={styles.wandStick} />
              <div className={styles.magicAura} />
              <div className={styles.magicRing} />
              <div className={`${styles.spark} ${styles.spark1}`} />
              <div className={`${styles.spark} ${styles.spark2}`} />
              <div className={`${styles.spark} ${styles.spark3}`} />
              <div className={`${styles.spark} ${styles.spark4}`} />
            </div>
          ) : null}
        </div>
      ) : null}

      {result || wandCurrent ? (
        <section className={styles.outputWrap} ref={outputRef} tabIndex={-1}>
          <article className={styles.result}>
            <h2 className={styles.sectionTitle}>Evaluación principal</h2>
            {result ? (
              <>
                <div className={styles.score}>
                  <span className={styles.scoreBadgeWrap}>
                    <span className={styles.scoreBadge} style={{ color: scoreTone.color, borderColor: scoreTone.border }}>
                      {result.score}/100
                    </span>
                    {scoreTooltip ? (
                      <span className={styles.scoreTooltip} role="tooltip">
                        {scoreTooltip.lines.map((line) => (
                          <span key={line} className={styles.scoreTooltipLine}>
                            {line}
                          </span>
                        ))}
                        {scoreTooltip.impacts.length ? (
                          <>
                            <span className={styles.scoreTooltipDivider} />
                            {scoreTooltip.impacts.map((it) => (
                              <span key={it.item} className={styles.scoreTooltipLine}>
                                +{it.estimatedPoints} {it.item}
                              </span>
                            ))}
                          </>
                        ) : null}
                      </span>
                    ) : null}
                  </span>
                  <strong>{result.verdict}</strong>
                </div>

                <div className={styles.grid}>
                  <section>
                    <h2 className={styles.sectionTitle}>Fortalezas</h2>
                    <ul className={styles.list}>
                      {result.strengths.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </section>
                  <section>
                    <h2 className={styles.sectionTitle}>Riesgos / huecos</h2>
                    <ul className={styles.list}>
                      {result.issues.map((x) => (
                        <li key={x}>
                          <div className={styles.itemRow}>
                            <span>{x}</span>
                            <button
                              type="button"
                              className={`btn ${styles.itemActionBtn}`}
                              disabled={wandLoading}
                              onClick={() => void onWandClick(x)}
                              title="Sugerir mejora sobre este punto"
                              aria-label="Sugerir mejora sobre este punto"
                            >
                              🪄
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section>
                    <h2 className={styles.sectionTitle}>Mejoras accionables</h2>
                    <ul className={styles.list}>
                      {result.improvements.map((x) => (
                        <li key={x}>
                          <div className={styles.itemRow}>
                            <span>{x}</span>
                            <button
                              type="button"
                              className={`btn ${styles.itemActionBtn}`}
                              disabled={wandLoading}
                              onClick={() => void onWandClick(x)}
                              title="Sugerir mejora sobre este punto"
                              aria-label="Sugerir mejora sobre este punto"
                            >
                              🪄
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section>
                    <h2 className={styles.sectionTitle}>Casos de prueba faltantes</h2>
                    <ul className={styles.list}>
                      {result.missingTests.map((x) => (
                        <li key={x}>
                          <div className={styles.itemRow}>
                            <span>{x}</span>
                            <button
                              type="button"
                              className={`btn ${styles.itemActionBtn}`}
                              disabled={wandLoading}
                              onClick={() => void onWandClick(x)}
                              title="Sugerir mejora sobre este punto"
                              aria-label="Sugerir mejora sobre este punto"
                            >
                              🪄
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>

                <h2 className={styles.sectionTitle}>Guion sugerido para decirlo en entrevista</h2>
                <pre className={styles.script}>{result.interviewScript}</pre>

                <div className={styles.wandInline}>
                  <div className={styles.wandInlineText}>
                    <strong>Varita mágica</strong>
                    <span>Usa el resultado de esta evaluación para proponer la siguiente mejora de código.</span>
                  </div>
                  <button type="button" className={`btn ${styles.wandBtn}`} disabled={wandLoading} onClick={() => void onWandClick()}>
                    {wandLoading ? "Afinando..." : "🪄 Sugerir mejora"}
                  </button>
                </div>
              </>
            ) : (
              <article className={styles.placeholder}>Ejecuta “Evaluar con LLM” para ver el análisis principal.</article>
            )}
          </article>

          <article className={styles.wandResult}>
            <h2 className={styles.sectionTitle}>Varita mágica (en la misma pestaña)</h2>
            {wandCurrent ? (
              <>
                <section className={styles.wandCard}>
                  {(() => {
                    const current = result?.score ?? 0;
                    const after = Number.isFinite(wandCurrent.expectedScoreAfter)
                      ? wandCurrent.expectedScoreAfter
                      : current;
                    const delta = after - current;
                    return (
                      <p className={styles.wandScoreLift}>
                        Puntaje estimado tras aplicar:{" "}
                        <strong>
                          {after}/100 {result?.score !== undefined ? `(${delta >= 0 ? "+" : ""}${delta})` : ""}
                        </strong>
                      </p>
                    );
                  })()}
                  <p className={styles.wandLead}>
                    <strong>{wandCurrent.focusArea}:</strong> {wandCurrent.tinyUpgrade}
                  </p>
                  {wandCurrent.addressedItems?.length ? (
                    <ul className={styles.list}>
                      {wandCurrent.addressedItems.slice(0, 3).map((x) => (
                        <li key={x}>Ataca: {x}</li>
                      ))}
                    </ul>
                  ) : null}
                  <ul className={styles.list}>
                    {(wandCurrent.codingSuggestions?.slice(0, 2) ?? []).map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                  <h3 className={styles.wandSubtitle}>Código completo sugerido (diff estilo git)</h3>
                  <pre className={styles.diffBlock}>
                    {buildGitDiffLines(wandCurrent.sourceAnswer, wandCurrent.improvedAnswer || wandCurrent.sourceAnswer).map(
                      (line, idx) => (
                        <div
                          key={`${wandCurrent.iteration}-${idx}-${line.type}-${line.text}`}
                          className={`${styles.diffLine} ${
                            line.type === "add" ? styles.diffAdded : line.type === "del" ? styles.diffRemoved : styles.diffSame
                          }`}
                        >
                          <span className={styles.diffPrefix}>
                            {line.type === "add" ? "+" : line.type === "del" ? "-" : " "}
                          </span>
                          <span>{line.text || " "}</span>
                        </div>
                      )
                    )}
                  </pre>
                  <div className={styles.wandActions}>
                    <button
                      type="button"
                      className={`btn ${styles.iconBtn}`}
                      onClick={() => void copySnippet(wandCurrent)}
                      title={copyOkStep === wandCurrent.iteration ? "Copiado" : "Copiar código sugerido"}
                      aria-label={copyOkStep === wandCurrent.iteration ? "Copiado" : "Copiar código sugerido"}
                    >
                      <span className={styles.iconGlyph} aria-hidden="true">
                        {copyOkStep === wandCurrent.iteration ? "✓" : "📋"}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`btn ${styles.iconBtn} ${styles.applyBtn}`}
                      onClick={() => applySnippet(wandCurrent)}
                      title={applyOkStep === wandCurrent.iteration ? "Aplicado" : "Aplicar al texto actual"}
                      aria-label={applyOkStep === wandCurrent.iteration ? "Aplicado" : "Aplicar al texto actual"}
                    >
                      <span className={styles.iconGlyph} aria-hidden="true">
                        {applyOkStep === wandCurrent.iteration ? "✓" : "🧩"}
                      </span>
                    </button>
                  </div>
                </section>
              </>
            ) : (
              <article className={styles.placeholder}>
                Ejecuta la varita para ver ayuda incremental en este mismo espacio.
              </article>
            )}
          </article>
        </section>
      ) : null}
    </section>
  );
}

function buildGitDiffLines(
  oldText: string,
  newText: string
): Array<{ type: "same" | "add" | "del"; text: string }> {
  const oldLines = oldText.replace(/\r\n/g, "\n").split("\n");
  const newLines = newText.replace(/\r\n/g, "\n").split("\n");
  const dp = buildLcsTable(oldLines, newLines);
  const out: Array<{ type: "same" | "add" | "del"; text: string }> = [];

  let i = oldLines.length;
  let j = newLines.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      out.push({ type: "same", text: oldLines[i - 1]! });
      i -= 1;
      j -= 1;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      out.push({ type: "add", text: newLines[j - 1]! });
      j -= 1;
    } else if (i > 0) {
      out.push({ type: "del", text: oldLines[i - 1]! });
      i -= 1;
    }
  }
  return out.reverse();
}

function buildLcsTable(a: string[], b: string[]): number[][] {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp;
}
