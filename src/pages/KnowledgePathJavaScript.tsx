import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "prettier/standalone";
import * as prettierPluginBabel from "prettier/plugins/babel";
import * as prettierPluginEstree from "prettier/plugins/estree";
import { javascriptPuzzles } from "../data/knowledgePath";
import { applyKnowledgeGuidance, reviewKnowledgePuzzle } from "../lib/evaluatorApi";
import type { KnowledgePuzzleReviewResponse } from "../types/knowledgePath";
import styles from "./KnowledgePathJavaScript.module.css";

const STORAGE_UNLOCKED = "knowledge-path-js-unlocked-count";
const STORAGE_DRAFTS = "knowledge-path-js-drafts";
const STORAGE_ATTEMPTS = "knowledge-path-js-attempts";
const CURSOR_MARK = "/*__CURSOR_MARK__*/";

type DraftMap = Record<string, string>;
type AttemptMap = Record<string, number>;

function readNumberStorage(key: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function readJsonStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveStorage(key: string, value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
}

export function KnowledgePathJavaScript() {
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [unlockedCount, setUnlockedCount] = useState(() => readNumberStorage(STORAGE_UNLOCKED, 1));
  const [drafts, setDrafts] = useState<DraftMap>(() => readJsonStorage<DraftMap>(STORAGE_DRAFTS, {}));
  const [attempts, setAttempts] = useState<AttemptMap>(() => readJsonStorage<AttemptMap>(STORAGE_ATTEMPTS, {}));
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [applyingGuidanceIndex, setApplyingGuidanceIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [applyInfo, setApplyInfo] = useState("");
  const [review, setReview] = useState<KnowledgePuzzleReviewResponse | null>(null);

  const selectedPuzzle = javascriptPuzzles[selectedIndex]!;
  const isUnlocked = selectedIndex < unlockedCount;
  const currentDraft = drafts[selectedPuzzle.id] ?? selectedPuzzle.starterCode;
  const solvedCount = useMemo(
    () =>
      javascriptPuzzles.filter((puzzle, index) => {
        if (index >= unlockedCount) return false;
        const tries = attempts[puzzle.id] ?? 0;
        return tries > 0;
      }).length,
    [attempts, unlockedCount]
  );

  function selectPuzzle(index: number) {
    if (index >= unlockedCount) return;
    setSelectedIndex(index);
    setReview(null);
    setError("");
  }

  function onDraftChange(value: string, nextCaret?: number) {
    if (Number.isFinite(nextCaret)) {
      pendingCaretRef.current = Number(nextCaret);
    }
    setDrafts((prev) => {
      const next = { ...prev, [selectedPuzzle.id]: value };
      saveStorage(STORAGE_DRAFTS, JSON.stringify(next));
      return next;
    });
  }

  async function formatAndPersistDraft(rawCode: string, caretIndex?: number) {
    const source = String(rawCode || "");
    if (!source.trim()) return;
    const hasCaret = Number.isFinite(caretIndex);
    const sourceWithMark =
      hasCaret && caretIndex !== undefined
        ? `${source.slice(0, caretIndex)}${CURSOR_MARK}${source.slice(caretIndex)}`
        : source;
    try {
      let formatted = await format(sourceWithMark, {
        parser: "babel",
        plugins: [prettierPluginBabel, prettierPluginEstree],
        semi: true,
        singleQuote: true,
        trailingComma: "all",
        printWidth: 100,
        tabWidth: 2,
      });
      let formattedCaret: number | undefined;
      if (hasCaret) {
        const markIndex = formatted.indexOf(CURSOR_MARK);
        if (markIndex >= 0) {
          formattedCaret = markIndex;
        }
        formatted = formatted.replace(CURSOR_MARK, "");
      }
      const normalized = formatted.replace(/\r\n/g, "\n").trimEnd();
      if (normalized && normalized !== source.trimEnd()) {
        onDraftChange(normalized, formattedCaret);
      } else if (Number.isFinite(formattedCaret) && editorRef.current && document.activeElement === editorRef.current) {
        const caret = Math.max(0, Math.min(Number(formattedCaret), editorRef.current.value.length));
        editorRef.current.setSelectionRange(caret, caret);
      }
    } catch {
      // Si hay error de sintaxis en medio de escritura, no forzamos formato.
    }
  }

  async function formatCurrentDraftFromEditor() {
    const textarea = editorRef.current;
    const liveValue = textarea?.value ?? currentDraft;
    const caretIndex = textarea?.selectionStart;
    await formatAndPersistDraft(liveValue, caretIndex);
  }

  useEffect(() => {
    const pendingCaret = pendingCaretRef.current;
    if (!Number.isFinite(pendingCaret)) return;
    const textarea = editorRef.current;
    if (!textarea || document.activeElement !== textarea) {
      pendingCaretRef.current = null;
      return;
    }
    const safeCaret = Math.max(0, Math.min(Number(pendingCaret), textarea.value.length));
    textarea.setSelectionRange(safeCaret, safeCaret);
    pendingCaretRef.current = null;
  }, [currentDraft, selectedPuzzle.id]);

  function resetStarter() {
    onDraftChange(selectedPuzzle.starterCode);
  }

  async function analyzePuzzle() {
    if (!isUnlocked) return;
    if (currentDraft.trim().length < 20) {
      setError("Escribe mas codigo antes de analizar el puzzle.");
      return;
    }
    setError("");
    setApplyInfo("");
    setAnalysisLoading(true);
    try {
      const nextAttempt = (attempts[selectedPuzzle.id] ?? 0) + 1;
      const data = await reviewKnowledgePuzzle({
        puzzleId: selectedPuzzle.id,
        puzzleTitle: selectedPuzzle.title,
        puzzleDifficulty: selectedPuzzle.difficulty,
        puzzleNarrative: selectedPuzzle.narrative,
        puzzlePrompt: selectedPuzzle.prompt,
        learningGoals: selectedPuzzle.learningGoals,
        completionCriteria: selectedPuzzle.completionCriteria,
        starterCode: selectedPuzzle.starterCode,
        candidateCode: currentDraft,
        attempt: nextAttempt,
      });

      setAttempts((prev) => {
        const next = { ...prev, [selectedPuzzle.id]: nextAttempt };
        saveStorage(STORAGE_ATTEMPTS, JSON.stringify(next));
        return next;
      });

      if (data.approved) {
        const possibleUnlock = Math.min(javascriptPuzzles.length, Math.max(unlockedCount, selectedIndex + 2));
        if (possibleUnlock !== unlockedCount) {
          setUnlockedCount(possibleUnlock);
          saveStorage(STORAGE_UNLOCKED, String(possibleUnlock));
        }
      }

      setReview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo revisar el puzzle.");
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function applyGuidanceToCode(guidanceItem: string, index: number) {
    if (!review) return;
    setError("");
    setApplyInfo("");
    setApplyingGuidanceIndex(index);
    try {
      const data = await applyKnowledgeGuidance({
        puzzleId: selectedPuzzle.id,
        puzzleTitle: selectedPuzzle.title,
        puzzleDifficulty: selectedPuzzle.difficulty,
        puzzlePrompt: selectedPuzzle.prompt,
        learningGoals: selectedPuzzle.learningGoals,
        completionCriteria: selectedPuzzle.completionCriteria,
        candidateCode: currentDraft,
        guidanceItem,
        guidanceExample: review.guidanceExamples[index],
      });
      onDraftChange(data.improvedCode);
      await formatAndPersistDraft(data.improvedCode);
      setApplyInfo(data.appliedChange || "Mejora aplicada al codigo actual.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo aplicar la mejora automaticamente.");
    } finally {
      setApplyingGuidanceIndex(null);
    }
  }

  return (
    <section className={styles.wrap}>
      <header className={styles.hero}>
        <span className={styles.badge}>El camino del conocimiento · JavaScript</span>
        <h1 className={styles.title}>Puzzle-driven learning: de intermedio a avanzado</h1>
        <p className={styles.lead}>
          Piensa como ingeniero en entrevista: resolver, validar, refinar y comunicar. Cada puzzle es un portal del
          libro de aventuras, con codigo base y mentor LLM para guiarte.
        </p>
        <div className={styles.progressStrip}>
          <span>
            Desbloqueados: {unlockedCount}/{javascriptPuzzles.length}
          </span>
          <span>Intentados: {solvedCount}</span>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <h2 className={styles.sidebarTitle}>Mapa de portales</h2>
          <ul className={styles.portalList}>
            {javascriptPuzzles.map((puzzle, index) => {
              const unlocked = index < unlockedCount;
              const active = index === selectedIndex;
              return (
                <li key={puzzle.id}>
                  <button
                    type="button"
                    disabled={!unlocked}
                    className={`${styles.portalBtn} ${active ? styles.portalBtnActive : ""} ${
                      !unlocked ? styles.portalBtnLocked : ""
                    }`}
                    onClick={() => selectPuzzle(index)}
                  >
                    <span className={styles.portalTop}>
                      <strong>{puzzle.title}</strong>
                      <span>{unlocked ? "abierto" : "bloqueado"}</span>
                    </span>
                    <span className={styles.portalMeta}>
                      {puzzle.chapter} · {puzzle.difficulty}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <article className={styles.mainCard}>
          <div className={styles.heading}>
            <div>
              <p className={styles.chapter}>{selectedPuzzle.chapter}</p>
              <h2 className={styles.puzzleTitle}>{selectedPuzzle.title}</h2>
            </div>
            <span className={styles.difficulty}>{selectedPuzzle.difficulty}</span>
          </div>

          <p className={styles.narrative}>{selectedPuzzle.narrative}</p>
          <p className={styles.prompt}>{selectedPuzzle.prompt}</p>

          <section className={styles.criteria}>
            <div>
              <h3>Objetivos de aprendizaje</h3>
              <ul>
                {selectedPuzzle.learningGoals.map((goal) => (
                  <li key={goal}>{goal}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Criterios de aprobacion</h3>
              <ul>
                {selectedPuzzle.completionCriteria.map((criterion) => (
                  <li key={criterion}>{criterion}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className={styles.editorBlock}>
            <div className={styles.editorHeader}>
              <h3>Tu solucion</h3>
              <div className={styles.editorActions}>
                <button type="button" className="btn" onClick={resetStarter}>
                  Restaurar base
                </button>
                <button type="button" className={`btn ${styles.primaryBtn}`} onClick={() => void analyzePuzzle()} disabled={analysisLoading}>
                  {analysisLoading ? "Analizando..." : "Analizar con LLM"}
                </button>
              </div>
            </div>
            <textarea
              ref={editorRef}
              value={currentDraft}
              onChange={(e) => onDraftChange(e.target.value)}
              onBlur={() => void formatCurrentDraftFromEditor()}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  requestAnimationFrame(() => {
                    void formatCurrentDraftFromEditor();
                  });
                }
              }}
              className={styles.editor}
              spellCheck={false}
            />
          </section>

          {error ? <div className={styles.error}>{error}</div> : null}
          {applyInfo ? <div className={styles.applyInfo}>{applyInfo}</div> : null}

          <section className={styles.feedback}>
            <h3>Mentor LLM</h3>
            {review ? (
              <div className={styles.reviewCard}>
                <p className={styles.reviewVerdict}>
                  <span className={review.approved ? styles.approved : styles.pending}>
                    {review.approved ? "Aprobado" : "Aun no"}
                  </span>{" "}
                  {review.score}/100 · {review.verdict}
                </p>
                <div className={styles.reviewGrid}>
                  <div>
                    <h4>Lo que esta fuerte</h4>
                    <ul>
                      {review.strengths.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4>Brechas a cerrar</h4>
                    <ul>
                      {review.gaps.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <h4>Guia de siguiente paso</h4>
                <ul>
                  {review.guidance.map((item, index) => (
                    <li key={`${item}-${index}`} className={styles.guidanceItem}>
                      <span>{item}</span>
                      <span className={styles.tipWrap}>
                        <button type="button" className={styles.tipIcon} aria-label="Ver ejemplo de implementacion">
                          💡
                        </button>
                        <span className={styles.tipTooltip} role="tooltip">
                          <pre>{review.guidanceExamples[index] || "// Ejemplo no disponible."}</pre>
                        </span>
                      </span>
                      <button
                        type="button"
                        className={styles.wandIcon}
                        aria-label="Aplicar esta mejora automaticamente"
                        title="Aplicar esta mejora al codigo"
                        disabled={applyingGuidanceIndex === index}
                        onClick={() => void applyGuidanceToCode(item, index)}
                      >
                        {applyingGuidanceIndex === index ? "…" : "🪄"}
                      </button>
                    </li>
                  ))}
                </ul>
                <p className={styles.nextHint}>
                  <strong>Pista del mentor:</strong> {review.nextHint}
                </p>
                <p className={styles.interviewAngle}>
                  <strong>Como venderlo en entrevista:</strong> {review.interviewAngle}
                </p>
                {review.approved && selectedIndex + 1 < javascriptPuzzles.length ? (
                  <button type="button" className={`btn ${styles.unlockBtn}`} onClick={() => selectPuzzle(selectedIndex + 1)}>
                    Abrir siguiente portal
                  </button>
                ) : null}
              </div>
            ) : (
              <div className={styles.placeholder}>
                Cuando analices tu codigo, aqui apareceran aprobacion, brechas y guia concreta para destrabar el
                puzzle.
              </div>
            )}
          </section>

          {!review?.approved && (attempts[selectedPuzzle.id] ?? 0) >= 2 ? (
            <aside className={styles.loreHint}>
              <strong>Pista del libro:</strong> {selectedPuzzle.loreHint}
            </aside>
          ) : null}
        </article>
      </div>
    </section>
  );
}
