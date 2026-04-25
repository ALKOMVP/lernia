import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

loadDotEnv(path.join(rootDir, ".env"));

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = Number(process.env.API_PORT || 8787);
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const API_TIMEOUT_MS = Number(process.env.API_TIMEOUT_MS || 45000);

/** @type {Map<string, {count: number, resetAt: number}>} */
const rateLimitStore = new Map();
/** @type {Map<string, {solutionCode: string, rubric: {mustHave: string[], edgeCases: string[], tests: string[]}}>} */
const idealSolutionStore = new Map();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, model: OPENAI_MODEL, baseUrl: OPENAI_BASE_URL });
});

app.post("/api/evaluate", async (req, res) => {
  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.ok) {
    return res.status(429).json({
      error: "Demasiadas solicitudes. Espera unos minutos e intenta de nuevo.",
      retryAfterMs: rateCheck.retryAfterMs,
    });
  }

  if (!OPENAI_API_KEY) {
    return res.status(500).json({
      error:
        "Falta OPENAI_API_KEY en el backend. Crea un archivo .env basado en .env.example para habilitar la evaluación.",
    });
  }

  const body = req.body ?? {};
  const parsed = parsePayload(body);
  if (!parsed.ok) {
    return res.status(400).json({ error: parsed.error });
  }

  try {
    const idealProfile = await getOrCreateIdealSolutionProfile(parsed.value);
    const text = await askModel({
      systemPrompt: buildSystemPrompt(),
      userPrompt: buildUserPrompt(parsed.value, idealProfile),
      temperature: 0.1,
    });

    const parsedJson = safeParseJsonFromText(text);
    if (!parsedJson.ok) {
      return res.status(502).json({
        error: "No se pudo interpretar la salida del LLM como JSON.",
        detail: truncate(text, 600),
      });
    }

    const normalized = normalizeEvaluationResponse(parsedJson.value);
    return res.json(normalized);
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ error: error.message, detail: error.detail });
    }
    return res.status(500).json({ error: "Error inesperado en el servidor de evaluación." });
  }
});

app.post("/api/wand", async (req, res) => {
  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.ok) {
    return res.status(429).json({
      error: "Demasiadas solicitudes. Espera unos minutos e intenta de nuevo.",
      retryAfterMs: rateCheck.retryAfterMs,
    });
  }

  if (!OPENAI_API_KEY) {
    return res.status(500).json({
      error:
        "Falta OPENAI_API_KEY en el backend. Crea un archivo .env basado en .env.example para habilitar la evaluación.",
    });
  }

  const body = req.body ?? {};
  const parsed = parseWandPayload(body);
  if (!parsed.ok) {
    return res.status(400).json({ error: parsed.error });
  }
  const closureMode = shouldEnterClosureMode(parsed.value);

  try {
    const idealProfile = await getOrCreateIdealSolutionProfile(parsed.value);
    let text = await askModel({
      systemPrompt: buildWandSystemPrompt({ closureMode }),
      userPrompt: buildWandUserPrompt(parsed.value, { closureMode, idealProfile }),
      temperature: closureMode ? 0.45 : 0.3,
    });
    let parsedJson = safeParseJsonFromText(text);
    if (!parsedJson.ok) {
      return res.status(502).json({
        error: "No se pudo interpretar la salida de la varita como JSON.",
        detail: truncate(text, 600),
      });
    }

    // Si la varita no produce avance real, forzamos intentos más directivos.
    const minChanged = minRequiredChangedLines(parsed.value.iteration);
    let changedLines = countChangedLines(parsed.value.candidateAnswer, parsedJson.value?.improvedAnswer || "");
    let functionalChangedLines = countFunctionalChangedLines(parsed.value.candidateAnswer, parsedJson.value?.improvedAnswer || "");
    let semanticallyEquivalent = isSemanticallyEquivalent(parsed.value.candidateAnswer, parsedJson.value?.improvedAnswer || "");
    const currentScore = Number(parsed.value.lastEvaluationScore || 0);
    const minGain = minExpectedScoreGain(currentScore, parsed.value.iteration);
    let expectedAfter = Number(parsedJson.value?.expectedScoreAfter || currentScore);
    let addressedCount = Array.isArray(parsedJson.value?.addressedItems) ? parsedJson.value.addressedItems.length : 0;
    let focusedItemCovered = isFocusedItemCovered(parsed.value.focusImprovementItem, parsedJson.value?.addressedItems || []);
    let estimatedScore = await estimateScoreFromAnswer(parsed.value, parsedJson.value?.improvedAnswer || "");
    if (!Number.isFinite(estimatedScore)) estimatedScore = currentScore;
    let attempts = 0;
    const maxAttempts = closureMode ? 3 : 2;
    while (
      (isSameAnswer(parsed.value.candidateAnswer, parsedJson.value?.improvedAnswer || "") ||
        semanticallyEquivalent ||
        changedLines < minChanged ||
        functionalChangedLines < 1 ||
        estimatedScore < currentScore + minGain ||
        addressedCount < 1 ||
        !focusedItemCovered) &&
      attempts < maxAttempts
    ) {
      attempts += 1;
      text = await askModel({
        systemPrompt: `${buildWandSystemPrompt({ closureMode })}\n\nObligatorio: introduce cambios funcionales reales (no solo comentarios/renombres cosméticos) y progresa hacia la solución correcta de forma más decidida.`,
        userPrompt: `${buildWandUserPrompt(parsed.value, { closureMode, idealProfile })}\n\nTu respuesta anterior no avanzó lo suficiente. Necesitas cambiar al menos ${minChanged} líneas útiles, con al menos 1 línea funcional real, y cubrir más requisitos del enunciado. El nuevo código debe mejorar el score real al menos en +${minGain} puntos respecto al actual (${currentScore}/100) y no puede ser equivalente semántico.${parsed.value.focusImprovementItem ? ` Debes atacar explícitamente este aspecto: "${parsed.value.focusImprovementItem}".` : ""}${closureMode ? " Ya estás en modo cierre: busca solución casi final (95-100)." : ""}`,
        temperature: closureMode ? 0.5 : 0.4,
      });
      parsedJson = safeParseJsonFromText(text);
      if (!parsedJson.ok) {
        return res.status(502).json({
          error: "No se pudo interpretar la salida de la varita como JSON.",
          detail: truncate(text, 600),
        });
      }
      changedLines = countChangedLines(parsed.value.candidateAnswer, parsedJson.value?.improvedAnswer || "");
      functionalChangedLines = countFunctionalChangedLines(parsed.value.candidateAnswer, parsedJson.value?.improvedAnswer || "");
      semanticallyEquivalent = isSemanticallyEquivalent(parsed.value.candidateAnswer, parsedJson.value?.improvedAnswer || "");
      expectedAfter = Number(parsedJson.value?.expectedScoreAfter || currentScore);
      addressedCount = Array.isArray(parsedJson.value?.addressedItems) ? parsedJson.value.addressedItems.length : 0;
      focusedItemCovered = isFocusedItemCovered(parsed.value.focusImprovementItem, parsedJson.value?.addressedItems || []);
      estimatedScore = await estimateScoreFromAnswer(parsed.value, parsedJson.value?.improvedAnswer || "");
      if (!Number.isFinite(estimatedScore)) estimatedScore = currentScore;
    }
    // Valor final de "puntaje esperado" basado en evaluación real del código propuesto.
    if (semanticallyEquivalent && parsed.value.iteration >= 2) {
      // Fallback útil: si no hubo avance real tras reintentos, devolver versión canónica para desbloquear.
      parsedJson.value.improvedAnswer = idealProfile.solutionCode;
      parsedJson.value.revisedSnippet = (idealProfile.solutionCode || "")
        .split(/\r?\n/)
        .slice(0, 12)
        .join("\n");
      parsedJson.value.focusArea = "Bloqueo por mejora cosmética";
      parsedJson.value.tinyUpgrade = "Se reemplaza por un enfoque canónico para asegurar avance funcional real.";
      parsedJson.value.whatImproved = [
        "Se elimina una sugerencia superficial sin impacto lógico.",
        "Se propone una base funcional completa para el problema.",
      ];
      parsedJson.value.whatToImprove = [
        "Explicar en voz alta decisiones de modelado y complejidad.",
        "Añadir tests de edge cases según el enunciado.",
      ];
      parsedJson.value.codingSuggestions = [
        "Ejecuta primero los casos base y luego los de override por timestamp.",
        "Valida explícitamente eventos fuera de orden y campos faltantes.",
        "Usa una estructura por conversationId (Map/Record) y mutaciones controladas.",
      ];
      parsedJson.value.addressedItems = [
        "Evitar cambios cosméticos sin efecto en la lógica.",
        "Aumentar correctitud funcional de la solución propuesta.",
      ];
      estimatedScore = await estimateScoreFromAnswer(parsed.value, parsedJson.value.improvedAnswer || "");
      if (!Number.isFinite(estimatedScore)) estimatedScore = currentScore;
    }
    parsedJson.value.expectedScoreAfter = estimatedScore;
    return res.json(parsedJson.value);
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ error: error.message, detail: error.detail });
    }
    console.error("[wand] unexpected error", error);
    return res.status(500).json({ error: "Error inesperado al generar ayuda incremental." });
  }
});

app.post("/api/reveal-solution", async (req, res) => {
  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.ok) {
    return res.status(429).json({
      error: "Demasiadas solicitudes. Espera unos minutos e intenta de nuevo.",
      retryAfterMs: rateCheck.retryAfterMs,
    });
  }

  if (!OPENAI_API_KEY) {
    return res.status(500).json({
      error:
        "Falta OPENAI_API_KEY en el backend. Crea un archivo .env basado en .env.example para habilitar la evaluación.",
    });
  }

  const body = req.body ?? {};
  const parsed = parsePayload(body);
  if (!parsed.ok) {
    return res.status(400).json({ error: parsed.error });
  }

  try {
    const idealProfile = await getOrCreateIdealSolutionProfile(parsed.value);
    return res.json({ solutionCode: idealProfile.solutionCode });
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ error: error.message, detail: error.detail });
    }
    return res.status(500).json({ error: "Error inesperado al revelar la solución final." });
  }
});

app.post("/api/camino-js/review", async (req, res) => {
  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.ok) {
    return res.status(429).json({
      error: "Demasiadas solicitudes. Espera unos minutos e intenta de nuevo.",
      retryAfterMs: rateCheck.retryAfterMs,
    });
  }

  if (!OPENAI_API_KEY) {
    return res.status(500).json({
      error:
        "Falta OPENAI_API_KEY en el backend. Crea un archivo .env basado en .env.example para habilitar la evaluación.",
    });
  }

  const parsed = parseKnowledgePuzzleReviewPayload(req.body ?? {});
  if (!parsed.ok) {
    return res.status(400).json({ error: parsed.error });
  }

  try {
    const idealSeedPayload = toIdealSeedPayload(parsed.value);
    const idealProfile = await getOrCreateIdealSolutionProfile(idealSeedPayload);
    const text = await askModel({
      systemPrompt: buildKnowledgeReviewSystemPrompt(),
      userPrompt: buildKnowledgeReviewUserPrompt(parsed.value, idealProfile),
      temperature: 0.2,
    });
    const parsedJson = safeParseJsonFromText(text);
    if (!parsedJson.ok) {
      return res.status(502).json({
        error: "No se pudo interpretar la salida de revision del puzzle.",
        detail: truncate(text, 600),
      });
    }
    return res.json(normalizeKnowledgeReviewResponse(parsedJson.value));
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ error: error.message, detail: error.detail });
    }
    console.error("[camino-js/review] unexpected error", error);
    return res.status(500).json({ error: "Error inesperado revisando el puzzle." });
  }
});

app.post("/api/camino-js/apply-guidance", async (req, res) => {
  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.ok) {
    return res.status(429).json({
      error: "Demasiadas solicitudes. Espera unos minutos e intenta de nuevo.",
      retryAfterMs: rateCheck.retryAfterMs,
    });
  }

  if (!OPENAI_API_KEY) {
    return res.status(500).json({
      error:
        "Falta OPENAI_API_KEY en el backend. Crea un archivo .env basado en .env.example para habilitar la evaluación.",
    });
  }

  const parsed = parseKnowledgeGuidanceApplyPayload(req.body ?? {});
  if (!parsed.ok) {
    return res.status(400).json({ error: parsed.error });
  }

  try {
    const payload = parsed.value;
    const idealSeedPayload = toIdealSeedPayload({
      puzzleId: payload.puzzleId,
      puzzleTitle: payload.puzzleTitle,
      puzzleDifficulty: payload.puzzleDifficulty,
      puzzleNarrative: "",
      puzzlePrompt: payload.puzzlePrompt,
      learningGoals: payload.learningGoals,
      completionCriteria: payload.completionCriteria,
      starterCode: payload.candidateCode,
      candidateCode: payload.candidateCode,
      attempt: 1,
    });
    const idealProfile = await getOrCreateIdealSolutionProfile(idealSeedPayload);

    let text = await askModel({
      systemPrompt: buildKnowledgeApplySystemPrompt(),
      userPrompt: buildKnowledgeApplyUserPrompt(payload, idealProfile),
      temperature: 0.2,
    });
    let parsedJson = safeParseJsonFromText(text);
    if (!parsedJson.ok) {
      return res.status(502).json({
        error: "No se pudo interpretar la salida al aplicar la recomendacion.",
        detail: truncate(text, 600),
      });
    }

    let normalized = normalizeKnowledgeApplyResponse(parsedJson.value, payload.candidateCode);
    if (
      isSameAnswer(payload.candidateCode, normalized.improvedCode) ||
      isSemanticallyEquivalent(payload.candidateCode, normalized.improvedCode)
    ) {
      text = await askModel({
        systemPrompt: `${buildKnowledgeApplySystemPrompt()}\n\nObligatorio: devuelve codigo mejorado con cambios funcionales reales enfocados en la recomendacion seleccionada.`,
        userPrompt: `${buildKnowledgeApplyUserPrompt(payload, idealProfile)}\n\nTu respuesta anterior no cambio la logica de forma util. Corrige el codigo con cambios funcionales claros.`,
        temperature: 0.28,
      });
      parsedJson = safeParseJsonFromText(text);
      if (!parsedJson.ok) {
        return res.status(502).json({
          error: "No se pudo interpretar la salida al aplicar la recomendacion.",
          detail: truncate(text, 600),
        });
      }
      normalized = normalizeKnowledgeApplyResponse(parsedJson.value, payload.candidateCode);
    }

    return res.json(normalized);
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ error: error.message, detail: error.detail });
    }
    console.error("[camino-js/apply-guidance] unexpected error", error);
    return res.status(500).json({ error: "Error inesperado aplicando la recomendacion." });
  }
});

app.listen(PORT, () => {
  console.log(`[llm-evaluator] API lista en http://localhost:${PORT}`);
});

function buildSystemPrompt() {
  return `
Eres evaluador técnico de entrevistas de programación tipo live coding (60 minutos, problema en dos partes).
Tu misión es evaluar la respuesta de una persona y dar feedback didáctico, concreto y accionable.
No seas agresivo ni vendedor. Sé honesto y útil.

Responde SOLO JSON válido con esta forma exacta:
{
  "score": number,
  "verdict": string,
  "strengths": string[],
  "issues": string[],
  "improvements": string[],
  "missingTests": string[],
  "interviewScript": string,
  "scoreBreakdown": {
    "correctness": number,
    "edgeCases": number,
    "codeClarity": number,
    "communication": number,
    "maxPerCategory": number
  },
  "improvementImpact": Array<{
    "item": string,
    "estimatedPoints": number
  }>
}

Reglas:
- score entre 0 y 100.
- verdict corto (1 frase).
- Cada lista con 3-6 items, precisos.
- interviewScript: guion de 5-8 líneas que el candidato podría decir en voz alta.
- Evalúa: claridad, correctitud, edge cases, complejidad, comunicación colaborativa.
- scoreBreakdown usa 4 categorías con maxPerCategory=25.
- improvementImpact: estima cuánto puede sumar cada mejora (1..20), máximo 5 items.
`.trim();
}

function buildUserPrompt(payload, idealProfile) {
  const mustHave = idealProfile?.rubric?.mustHave?.length
    ? idealProfile.rubric.mustHave.map((x, i) => `${i + 1}. ${x}`).join("\n")
    : "Sin checklist.";
  const edgeCases = idealProfile?.rubric?.edgeCases?.length
    ? idealProfile.rubric.edgeCases.map((x, i) => `${i + 1}. ${x}`).join("\n")
    : "Sin edge cases definidos.";
  const tests = idealProfile?.rubric?.tests?.length
    ? idealProfile.rubric.tests.map((x, i) => `${i + 1}. ${x}`).join("\n")
    : "Sin tests definidos.";
  return `
Tipo de ejercicio: ${payload.exerciseType}

Enunciado:
${payload.question}

Respuesta del candidato:
${payload.candidateAnswer}

Solución ideal de referencia (canónica para este enunciado):
${idealProfile?.solutionCode || "No disponible."}

Checklist obligatorio esperado:
${mustHave}

Casos borde esperados:
${edgeCases}

Pruebas mínimas esperadas:
${tests}
`.trim();
}

function buildWandSystemPrompt({ closureMode }) {
  return `
Eres una "varita didáctica" para entrevistas de programación.
Tu objetivo es DESTRABAR al alumno con mejoras personalizadas sobre su texto actual.
La ayuda debe avanzar por etapas hasta acercarse a una solución final correcta.

Responde SOLO JSON válido con esta forma exacta:
{
  "iteration": number,
  "focusArea": string,
  "tinyUpgrade": string,
  "whatImproved": string[],
  "whatToImprove": string[],
  "codingSuggestions": string[],
  "addressedItems": string[],
  "expectedScoreAfter": number,
  "nextStep": string,
  "checkpointQuestion": string,
  "revisedSnippet": string,
  "improvedAnswer": string
}

Reglas estrictas:
- La respuesta DEBE avanzar respecto al código actual del alumno.
- Iteración 1-2: mejora pequeña (estructura/base).
- Iteración 3-4: mejora intermedia (más lógica funcional y edge cases).
- Iteración 5+: mejora sustancial (puedes agregar funciones y cerrar huecos importantes).
- Iteración 7+: ya puedes acercarte mucho a una solución final correcta y completa.
- ${closureMode ? "MODO CIERRE ACTIVO: debes priorizar una solución casi final, completa y correcta." : "Aún no está en modo cierre; mantén progresión."}
- Si hay mejoras sugeridas por evaluación, implementa explícitamente al menos 2 de ellas en improvedAnswer (o 1 si solo hay una disponible).
- revisedSnippet: máximo 12 líneas, puede ser pseudocódigo o fragmento parcial.
- improvedAnswer: debe ser el código completo del alumno con cambios mínimos aplicados.
- Mantén continuidad con el código del alumno, pero NO te quedes en cambios cosméticos.
- No uses "quitar/agregar comentarios" como mejora principal: los cambios deben afectar la lógica/comportamiento.
- whatImproved: 2-4 bullets específicos.
- whatToImprove: 2-4 huecos concretos que el alumno aún debe resolver.
- codingSuggestions: 3-5 sugerencias accionables para que el alumno programe por su cuenta.
- addressedItems: 2-4 mejoras del evaluador que sí estás corrigiendo ahora.
- expectedScoreAfter: score estimado (0..100), y debe subir respecto al score actual.
- checkpointQuestion: pregunta para que el alumno piense el siguiente paso.
- Tono de mentor técnico cercano, sin marketing.
- Si no puedes mejorar lógica/comportamiento, rehace tu propuesta internamente antes de responder.
- Prohibido considerar "limpiar comentarios", "renombrar variables", "compactar formato" como mejora principal.
`.trim();
}

function buildWandUserPrompt(payload, { closureMode, idealProfile }) {
  const history = payload.previousHints.length
    ? payload.previousHints.map((h, i) => `${i + 1}. ${h}`).join("\n")
    : "Sin ayudas previas.";
  const prevImproved = payload.previousImprovedAnswer?.trim()
    ? payload.previousImprovedAnswer
    : "No hay código sugerido anterior.";
  const scoreInfo = Number.isFinite(payload.lastEvaluationScore)
    ? `Score de la última evaluación: ${payload.lastEvaluationScore}/100`
    : "Sin score previo de evaluación.";
  const evalStrengths = Array.isArray(payload.lastEvaluationStrengths) && payload.lastEvaluationStrengths.length
    ? payload.lastEvaluationStrengths.map((x, i) => `${i + 1}. ${x}`).join("\n")
    : "Sin fortalezas previas.";
  const evalIssues = Array.isArray(payload.lastEvaluationIssues) && payload.lastEvaluationIssues.length
    ? payload.lastEvaluationIssues.map((x, i) => `${i + 1}. ${x}`).join("\n")
    : "Sin issues previos.";
  const evalImprovements = Array.isArray(payload.lastEvaluationImprovements) && payload.lastEvaluationImprovements.length
    ? payload.lastEvaluationImprovements.map((x, i) => `${i + 1}. ${x}`).join("\n")
    : "Sin recomendaciones previas.";
  const evalMissingTests = Array.isArray(payload.lastEvaluationMissingTests) && payload.lastEvaluationMissingTests.length
    ? payload.lastEvaluationMissingTests.map((x, i) => `${i + 1}. ${x}`).join("\n")
    : "Sin tests faltantes previos.";
  const scoreBreakdown = payload.lastScoreBreakdown
    ? `Correctitud ${payload.lastScoreBreakdown.correctness}/${payload.lastScoreBreakdown.maxPerCategory}, Casos borde ${payload.lastScoreBreakdown.edgeCases}/${payload.lastScoreBreakdown.maxPerCategory}, Claridad ${payload.lastScoreBreakdown.codeClarity}/${payload.lastScoreBreakdown.maxPerCategory}, Comunicación ${payload.lastScoreBreakdown.communication}/${payload.lastScoreBreakdown.maxPerCategory}`
    : "Sin breakdown previo.";
  const impactList = Array.isArray(payload.lastImprovementImpact) && payload.lastImprovementImpact.length
    ? payload.lastImprovementImpact.map((x, i) => `${i + 1}. (+${x.estimatedPoints}) ${x.item}`).join("\n")
    : "Sin impacto estimado.";
  const focusItem = payload.focusImprovementItem?.trim()
    ? `Debes priorizar explícitamente este aspecto seleccionado por el usuario:\n${payload.focusImprovementItem}`
    : "No hay un aspecto puntual seleccionado.";
  const idealSummary = idealProfile?.rubric?.mustHave?.length
    ? idealProfile.rubric.mustHave.map((x, i) => `${i + 1}. ${x}`).join("\n")
    : "Sin resumen ideal.";
  return `
Iteración de ayuda solicitada: ${payload.iteration}
Tipo de ejercicio: ${payload.exerciseType}

Enunciado:
${payload.question}

Texto actual del alumno:
${payload.candidateAnswer}

Ayudas anteriores:
${history}

Último código sugerido por la varita:
${prevImproved}

Estado de la evaluación LLM:
${scoreInfo}

Fortalezas detectadas:
${evalStrengths}

Issues detectados:
${evalIssues}

Mejoras sugeridas por evaluación:
${evalImprovements}

Tests faltantes:
${evalMissingTests}

Desglose del puntaje:
${scoreBreakdown}

Impacto estimado por mejora:
${impactList}

Foco obligatorio para esta iteración:
${focusItem}

Referencia ideal de solución (objetivo):
${idealProfile?.solutionCode || "No disponible."}

Resumen de requisitos clave de la solución ideal:
${idealSummary}

Modo de trabajo:
${closureMode ? "Cierre de solución: apunta a una versión casi final con score 95-100." : "Progresión incremental: mejora sustancial pero aún guiada."}
`.trim();
}

function buildRevealSystemPrompt() {
  return `
Eres un ingeniero senior que entrega la solución final de un ejercicio de live coding.
Debes producir una solución correcta y completa en JavaScript, limpia y lista para pegar en CoderPad.
Incluye la lógica de la parte 1 y parte 2 cuando aplique.
Puedes proponer una solución completamente distinta a la del usuario si eso aumenta la calidad y la cobertura.
No des explicación; solo devuelve JSON válido con:
{
  "solutionCode": string
}
solutionCode debe contener exclusivamente código JavaScript (sin markdown).
`.trim();
}

function buildRevealUserPrompt(payload) {
  return `
Tipo de ejercicio: ${payload.exerciseType}

Enunciado:
${payload.question}

Código actual del usuario (puede estar incompleto):
${payload.candidateAnswer}

Si este codigo limita llegar a una solucion ideal, reemplazalo por un enfoque superior.
`.trim();
}

function parsePayload(body) {
  const exerciseType = String(body.exerciseType || "").trim();
  const question = String(body.question || "").trim();
  const candidateAnswer = String(body.candidateAnswer || "").trim();

  if (!exerciseType) return { ok: false, error: "Falta exerciseType." };
  if (question.length < 10) return { ok: false, error: "El enunciado es demasiado corto." };
  if (candidateAnswer.length < 20) return { ok: false, error: "La respuesta del candidato es demasiado corta." };
  if (candidateAnswer.length > 12000) return { ok: false, error: "La respuesta es demasiado larga (máx 12k chars)." };

  return {
    ok: true,
    value: { exerciseType, question, candidateAnswer },
  };
}

function parseWandPayload(body) {
  const exerciseType = String(body.exerciseType || "").trim();
  const question = String(body.question || "").trim();
  const candidateAnswer = String(body.candidateAnswer || "").trim();
  const iteration = Number(body.iteration || 1);
  const previousHints = Array.isArray(body.previousHints)
    ? body.previousHints.map((x) => String(x)).slice(0, 20)
    : [];
  const previousImprovedAnswer = String(body.previousImprovedAnswer || "").trim();
  const focusImprovementItem = String(body.focusImprovementItem || "").trim();
  const lastEvaluationScore =
    body.lastEvaluationScore === undefined || body.lastEvaluationScore === null
      ? undefined
      : Number(body.lastEvaluationScore);
  const lastEvaluationStrengths = Array.isArray(body.lastEvaluationStrengths)
    ? body.lastEvaluationStrengths.map((x) => String(x)).slice(0, 20)
    : [];
  const lastEvaluationIssues = Array.isArray(body.lastEvaluationIssues)
    ? body.lastEvaluationIssues.map((x) => String(x)).slice(0, 20)
    : [];
  const lastEvaluationImprovements = Array.isArray(body.lastEvaluationImprovements)
    ? body.lastEvaluationImprovements.map((x) => String(x)).slice(0, 20)
    : [];
  const lastEvaluationMissingTests = Array.isArray(body.lastEvaluationMissingTests)
    ? body.lastEvaluationMissingTests.map((x) => String(x)).slice(0, 20)
    : [];
  const lastScoreBreakdown =
    body.lastScoreBreakdown && typeof body.lastScoreBreakdown === "object"
      ? {
          correctness: Number(body.lastScoreBreakdown.correctness || 0),
          edgeCases: Number(body.lastScoreBreakdown.edgeCases || 0),
          codeClarity: Number(body.lastScoreBreakdown.codeClarity || 0),
          communication: Number(body.lastScoreBreakdown.communication || 0),
          maxPerCategory: Number(body.lastScoreBreakdown.maxPerCategory || 25),
        }
      : undefined;
  const lastImprovementImpact = Array.isArray(body.lastImprovementImpact)
    ? body.lastImprovementImpact
        .map((x) => ({
          item: String(x?.item || "").trim(),
          estimatedPoints: Number(x?.estimatedPoints || 0),
        }))
        .filter((x) => x.item)
        .slice(0, 20)
    : [];

  if (!exerciseType) return { ok: false, error: "Falta exerciseType." };
  if (question.length < 10) return { ok: false, error: "El enunciado es demasiado corto." };
  if (candidateAnswer.length < 10) return { ok: false, error: "Escribe más contexto antes de usar la varita." };
  if (!Number.isFinite(iteration) || iteration < 1 || iteration > 12) {
    return { ok: false, error: "iteration inválida (1..12)." };
  }

  return {
    ok: true,
    value: {
      exerciseType,
      question,
      candidateAnswer,
      iteration,
      previousHints,
      previousImprovedAnswer,
      focusImprovementItem,
      lastEvaluationScore,
      lastEvaluationStrengths,
      lastEvaluationIssues,
      lastEvaluationImprovements,
      lastEvaluationMissingTests,
      lastScoreBreakdown,
      lastImprovementImpact,
    },
  };
}

function parseKnowledgePuzzleReviewPayload(body) {
  const puzzleId = String(body.puzzleId || "").trim();
  const puzzleTitle = String(body.puzzleTitle || "").trim();
  const puzzleDifficulty = String(body.puzzleDifficulty || "medio").trim();
  const puzzleNarrative = String(body.puzzleNarrative || "").trim();
  const puzzlePrompt = String(body.puzzlePrompt || "").trim();
  const learningGoals = Array.isArray(body.learningGoals) ? body.learningGoals.map((x) => String(x).trim()).filter(Boolean) : [];
  const completionCriteria = Array.isArray(body.completionCriteria)
    ? body.completionCriteria.map((x) => String(x).trim()).filter(Boolean)
    : [];
  const starterCode = String(body.starterCode || "").trim();
  const candidateCode = String(body.candidateCode || "").trim();
  const attempt = Number(body.attempt || 1);

  if (!puzzleId) return { ok: false, error: "Falta puzzleId." };
  if (puzzlePrompt.length < 20) return { ok: false, error: "El enunciado del puzzle es demasiado corto." };
  if (starterCode.length < 10) return { ok: false, error: "Falta starterCode del puzzle." };
  if (candidateCode.length < 20) return { ok: false, error: "Escribe mas codigo antes de analizar." };
  if (!Number.isFinite(attempt) || attempt < 1 || attempt > 50) {
    return { ok: false, error: "attempt invalido (1..50)." };
  }

  return {
    ok: true,
    value: {
      puzzleId,
      puzzleTitle,
      puzzleDifficulty,
      puzzleNarrative,
      puzzlePrompt,
      learningGoals: learningGoals.slice(0, 12),
      completionCriteria: completionCriteria.slice(0, 12),
      starterCode,
      candidateCode,
      attempt,
    },
  };
}

function parseKnowledgeGuidanceApplyPayload(body) {
  const puzzleId = String(body.puzzleId || "").trim();
  const puzzleTitle = String(body.puzzleTitle || "").trim();
  const puzzleDifficulty = String(body.puzzleDifficulty || "medio").trim();
  const puzzlePrompt = String(body.puzzlePrompt || "").trim();
  const learningGoals = Array.isArray(body.learningGoals) ? body.learningGoals.map((x) => String(x).trim()).filter(Boolean) : [];
  const completionCriteria = Array.isArray(body.completionCriteria)
    ? body.completionCriteria.map((x) => String(x).trim()).filter(Boolean)
    : [];
  const candidateCode = String(body.candidateCode || "").trim();
  const guidanceItem = String(body.guidanceItem || "").trim();
  const guidanceExample = String(body.guidanceExample || "").trim();

  if (!puzzleId) return { ok: false, error: "Falta puzzleId." };
  if (!puzzlePrompt) return { ok: false, error: "Falta puzzlePrompt." };
  if (candidateCode.length < 20) return { ok: false, error: "Codigo del alumno demasiado corto para aplicar mejoras." };
  if (!guidanceItem) return { ok: false, error: "Falta guidanceItem." };

  return {
    ok: true,
    value: {
      puzzleId,
      puzzleTitle,
      puzzleDifficulty,
      puzzlePrompt,
      learningGoals: learningGoals.slice(0, 12),
      completionCriteria: completionCriteria.slice(0, 12),
      candidateCode,
      guidanceItem,
      guidanceExample,
    },
  };
}

function toIdealSeedPayload(puzzleReviewPayload) {
  const goals = puzzleReviewPayload.learningGoals.length
    ? puzzleReviewPayload.learningGoals.map((x, i) => `${i + 1}. ${x}`).join("\n")
    : "Sin objetivos explicitos.";
  const criteria = puzzleReviewPayload.completionCriteria.length
    ? puzzleReviewPayload.completionCriteria.map((x, i) => `${i + 1}. ${x}`).join("\n")
    : "Sin criterios explicitos.";

  return {
    exerciseType: `camino-js:${puzzleReviewPayload.puzzleId}`,
    question: [
      `Puzzle: ${puzzleReviewPayload.puzzleTitle}`,
      `Dificultad: ${puzzleReviewPayload.puzzleDifficulty}`,
      `Narrativa: ${puzzleReviewPayload.puzzleNarrative}`,
      "Enunciado:",
      puzzleReviewPayload.puzzlePrompt,
      "Objetivos de aprendizaje:",
      goals,
      "Criterios de aprobacion:",
      criteria,
      "Starter code de referencia:",
      puzzleReviewPayload.starterCode,
    ].join("\n\n"),
    candidateAnswer: puzzleReviewPayload.starterCode,
  };
}

function buildKnowledgeReviewSystemPrompt() {
  return `
Eres mentor tecnico para una plataforma de puzzles de JavaScript (nivel medio a avanzado).
Debes revisar la solucion del alumno y decidir si aprueba el puzzle.

Responde SOLO JSON valido con esta forma exacta:
{
  "approved": boolean,
  "score": number,
  "verdict": string,
  "strengths": string[],
  "gaps": string[],
  "guidance": string[],
  "guidanceExamples": string[],
  "nextHint": string,
  "interviewAngle": string
}

Reglas:
- score entre 0 y 100.
- approved=true solo si cumple criterios clave de correctitud y robustez.
- verdict: una frase corta y concreta.
- strengths: 2-5 bullets.
- gaps: 2-5 bullets accionables.
- guidance: 3-6 pasos concretos para avanzar sin regalar toda la solucion.
- guidanceExamples: 1 ejemplo corto de codigo por cada guidance (4-10 lineas, JavaScript puro, sin markdown).
- nextHint: una pista puntual para el proximo cambio de codigo.
- interviewAngle: 2-4 frases de como explicarlo en entrevista.
- Tono didactico, directo y exigente con calidad.
`.trim();
}

function buildKnowledgeApplySystemPrompt() {
  return `
Eres un asistente de refactor/aprendizaje para puzzles de JavaScript.
Debes aplicar una recomendacion puntual sobre codigo del alumno y devolver codigo corregido.

Responde SOLO JSON valido con:
{
  "improvedCode": string,
  "appliedChange": string
}

Reglas:
- improvedCode debe ser el codigo completo resultante (no fragmento).
- Debe mantener estilo JavaScript claro y coherente.
- Aplica la recomendacion seleccionada con cambios funcionales, no cosmeticos.
- No uses markdown.
- appliedChange: frase corta explicando que se aplico.
`.trim();
}

function buildKnowledgeReviewUserPrompt(payload, idealProfile) {
  const goals = payload.learningGoals.length
    ? payload.learningGoals.map((x, i) => `${i + 1}. ${x}`).join("\n")
    : "Sin objetivos definidos.";
  const criteria = payload.completionCriteria.length
    ? payload.completionCriteria.map((x, i) => `${i + 1}. ${x}`).join("\n")
    : "Sin criterios definidos.";
  const mustHave = idealProfile?.rubric?.mustHave?.length
    ? idealProfile.rubric.mustHave.map((x, i) => `${i + 1}. ${x}`).join("\n")
    : "Sin checklist de referencia.";
  const edgeCases = idealProfile?.rubric?.edgeCases?.length
    ? idealProfile.rubric.edgeCases.map((x, i) => `${i + 1}. ${x}`).join("\n")
    : "Sin edge cases de referencia.";
  const tests = idealProfile?.rubric?.tests?.length
    ? idealProfile.rubric.tests.map((x, i) => `${i + 1}. ${x}`).join("\n")
    : "Sin tests de referencia.";

  return `
Puzzle ID: ${payload.puzzleId}
Titulo: ${payload.puzzleTitle}
Dificultad: ${payload.puzzleDifficulty}
Intento del alumno: ${payload.attempt}

Narrativa:
${payload.puzzleNarrative}

Enunciado del puzzle:
${payload.puzzlePrompt}

Objetivos:
${goals}

Criterios de aprobacion:
${criteria}

Starter code:
${payload.starterCode}

Codigo actual del alumno:
${payload.candidateCode}

Solucion ideal canonicamente definida:
${idealProfile?.solutionCode || "No disponible."}

Rubrica de referencia (must-have):
${mustHave}

Edge cases clave:
${edgeCases}

Pruebas sugeridas:
${tests}
`.trim();
}

function buildKnowledgeApplyUserPrompt(payload, idealProfile) {
  const goals = payload.learningGoals.length
    ? payload.learningGoals.map((x, i) => `${i + 1}. ${x}`).join("\n")
    : "Sin objetivos.";
  const criteria = payload.completionCriteria.length
    ? payload.completionCriteria.map((x, i) => `${i + 1}. ${x}`).join("\n")
    : "Sin criterios.";
  const mustHave = idealProfile?.rubric?.mustHave?.length
    ? idealProfile.rubric.mustHave.map((x, i) => `${i + 1}. ${x}`).join("\n")
    : "Sin must-have.";
  return `
Puzzle: ${payload.puzzleTitle}
ID: ${payload.puzzleId}
Dificultad: ${payload.puzzleDifficulty}

Enunciado:
${payload.puzzlePrompt}

Objetivos:
${goals}

Criterios:
${criteria}

Recomendacion seleccionada para aplicar:
${payload.guidanceItem}

Ejemplo orientativo de esa recomendacion:
${payload.guidanceExample || "No disponible."}

Codigo actual del alumno:
${payload.candidateCode}

Solucion ideal de referencia:
${idealProfile?.solutionCode || "No disponible."}

Must-have de referencia:
${mustHave}
`.trim();
}

function normalizeKnowledgeReviewResponse(value) {
  const score = clampInt(Number(value?.score || 0), 0, 100);
  const approvedByScore = score >= 86;
  const approved = Boolean(value?.approved) || approvedByScore;
  const guidance = normalizeStringArray(value?.guidance, 3).slice(0, 6);
  return {
    approved,
    score,
    verdict: String(value?.verdict || (approved ? "Buen nivel tecnico para este portal." : "Aun faltan piezas clave.")),
    strengths: normalizeStringArray(value?.strengths, 2).slice(0, 5),
    gaps: normalizeStringArray(value?.gaps, 2).slice(0, 5),
    guidance,
    guidanceExamples: normalizeGuidanceExamples(value?.guidanceExamples, guidance),
    nextHint: String(value?.nextHint || "Refuerza el caso borde mas critico y vuelve a medir."),
    interviewAngle: String(value?.interviewAngle || "Explica decisiones de estructura, complejidad y trade-offs."),
  };
}

function normalizeKnowledgeApplyResponse(value, fallbackCode) {
  const improvedCodeRaw = String(value?.improvedCode || "").trim();
  const improvedCode = stripMarkdownCodeFence(improvedCodeRaw) || fallbackCode;
  return {
    improvedCode,
    appliedChange: String(value?.appliedChange || "Se aplico la recomendacion sobre el codigo actual."),
  };
}

function normalizeGuidanceExamples(raw, guidance) {
  if (Array.isArray(raw) && raw.length) {
    const cleaned = raw
      .map((x) => String(x || "").trim())
      .map(stripMarkdownCodeFence)
      .filter(Boolean)
      .slice(0, guidance.length);
    if (cleaned.length === guidance.length) return cleaned;
  }
  return guidance.map((item) => buildFallbackGuidanceExample(item));
}

function stripMarkdownCodeFence(value) {
  const text = String(value || "").trim();
  if (!text.startsWith("```")) return text;
  return text.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "").trim();
}

function buildFallbackGuidanceExample(hint) {
  const text = String(hint || "").toLowerCase();
  if (text.includes("array") || text.includes("bucle") || text.includes("recorrer")) {
    return `for (const item of input) {
  if (typeof item !== "string") continue;
  const token = item.trim().toLowerCase();
  if (!token) continue;
}`;
  }
  if (text.includes("set") || text.includes("duplic")) {
    return `const seen = new Set();
const output = [];
if (!seen.has(token)) {
  seen.add(token);
  output.push(token);
}`;
  }
  if (text.includes("valid") || text.includes("input")) {
    return `if (!Array.isArray(input)) {
  return [];
}`;
  }
  if (text.includes("async") || text.includes("retry")) {
    return `for (let attempt = 0; attempt <= maxRetries; attempt++) {
  try {
    return await task();
  } catch (error) {
    if (attempt === maxRetries) throw error;
  }
}`;
  }
  return `function solveStep(value) {
  // aplica esta recomendacion en un bloque pequeno y verificable
  return value;
}`;
}

async function getOrCreateIdealSolutionProfile(payload) {
  const cacheKey = getIdealCacheKey(payload);
  const cached = idealSolutionStore.get(cacheKey);
  if (cached) return cached;

  const text = await askModel({
    systemPrompt: buildIdealSolutionSystemPrompt(),
    userPrompt: buildIdealSolutionUserPrompt(payload),
    temperature: 0.15,
  });
  const parsed = safeParseJsonFromText(text);
  if (!parsed.ok) {
    throw {
      status: 502,
      message: "No se pudo construir la solución ideal de referencia.",
      detail: truncate(text, 500),
    };
  }
  const normalized = normalizeIdealSolutionProfile(parsed.value);
  idealSolutionStore.set(cacheKey, normalized);
  return normalized;
}

function getIdealCacheKey(payload) {
  return `${payload.exerciseType}::${normalizeForCompare(String(payload.question || ""))}`;
}

function buildIdealSolutionSystemPrompt() {
  return `
Eres un evaluador técnico senior que debe definir una solución canónica de referencia para un ejercicio de live coding.
Responde SOLO JSON válido con esta forma exacta:
{
  "solutionCode": string,
  "rubric": {
    "mustHave": string[],
    "edgeCases": string[],
    "tests": string[]
  }
}

Reglas:
- solutionCode debe ser JavaScript ejecutable, completo y limpio.
- rubric.mustHave: 4-8 puntos de correctitud funcional obligatoria.
- rubric.edgeCases: 3-6 casos límite concretos.
- rubric.tests: 4-8 casos de test claros.
- Sin markdown, sin explicación adicional.
`.trim();
}

function buildIdealSolutionUserPrompt(payload) {
  return `
Tipo de ejercicio: ${payload.exerciseType}

Enunciado:
${payload.question}

Contexto del usuario (puede estar incompleto):
${payload.candidateAnswer}

Necesito la solución canónica ideal y una rúbrica objetiva para comparar respuestas.
`.trim();
}

function normalizeIdealSolutionProfile(value) {
  const fallback = {
    solutionCode: "function solve() {\n  throw new Error('Ideal solution unavailable');\n}",
    rubric: {
      mustHave: ["Cubrir requerimientos principales del enunciado."],
      edgeCases: ["Entradas vacías o inválidas."],
      tests: ["Caso base funcional."],
    },
  };
  if (!value || typeof value !== "object") return fallback;
  const solutionCode = String(value.solutionCode || "").trim() || fallback.solutionCode;
  const rubricRaw = value.rubric && typeof value.rubric === "object" ? value.rubric : {};
  const mustHave = normalizeStringArray(rubricRaw.mustHave, 1).slice(0, 8);
  const edgeCases = normalizeStringArray(rubricRaw.edgeCases, 1).slice(0, 6);
  const tests = normalizeStringArray(rubricRaw.tests, 1).slice(0, 8);
  return {
    solutionCode,
    rubric: {
      mustHave: mustHave.length ? mustHave : fallback.rubric.mustHave,
      edgeCases: edgeCases.length ? edgeCases : fallback.rubric.edgeCases,
      tests: tests.length ? tests : fallback.rubric.tests,
    },
  };
}

function normalizeEvaluationResponse(value) {
  const scoreBreakdown = normalizeBreakdown(value?.scoreBreakdown);
  const scoreFromBreakdown =
    scoreBreakdown.correctness +
    scoreBreakdown.edgeCases +
    scoreBreakdown.codeClarity +
    scoreBreakdown.communication;

  return {
    score: clampInt(Number(value?.score ?? scoreFromBreakdown), 0, 100),
    verdict: String(value?.verdict || "Evaluación generada."),
    strengths: normalizeStringArray(value?.strengths, 3),
    issues: normalizeStringArray(value?.issues, 3),
    improvements: normalizeStringArray(value?.improvements, 3),
    missingTests: normalizeStringArray(value?.missingTests, 3),
    interviewScript: String(value?.interviewScript || ""),
    scoreBreakdown,
    improvementImpact: normalizeImpact(value?.improvementImpact, normalizeStringArray(value?.improvements, 3)),
  };
}

function normalizeBreakdown(raw) {
  const maxPerCategory = 25;
  const fallback = {
    correctness: 15,
    edgeCases: 15,
    codeClarity: 15,
    communication: 15,
    maxPerCategory,
  };
  if (!raw || typeof raw !== "object") return fallback;
  return {
    correctness: clampInt(Number(raw.correctness ?? fallback.correctness), 0, maxPerCategory),
    edgeCases: clampInt(Number(raw.edgeCases ?? fallback.edgeCases), 0, maxPerCategory),
    codeClarity: clampInt(Number(raw.codeClarity ?? fallback.codeClarity), 0, maxPerCategory),
    communication: clampInt(Number(raw.communication ?? fallback.communication), 0, maxPerCategory),
    maxPerCategory,
  };
}

function normalizeImpact(raw, improvements) {
  if (Array.isArray(raw)) {
    const cleaned = raw
      .map((it) => ({
        item: String(it?.item || "").trim(),
        estimatedPoints: clampInt(Number(it?.estimatedPoints || 0), 1, 20),
      }))
      .filter((it) => it.item);
    if (cleaned.length) return cleaned.slice(0, 5);
  }
  return improvements.slice(0, 5).map((item, i) => ({
    item,
    estimatedPoints: Math.max(3, 12 - i * 2),
  }));
}

function normalizeStringArray(value, minItems) {
  if (!Array.isArray(value)) return [];
  const out = value.map((x) => String(x).trim()).filter(Boolean);
  return out.slice(0, Math.max(minItems, out.length));
}

function clampInt(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function isSameAnswer(currentAnswer, improvedAnswer) {
  if (!improvedAnswer?.trim()) return true;
  const normA = currentAnswer.replace(/\r\n/g, "\n").trim();
  const normB = improvedAnswer.replace(/\r\n/g, "\n").trim();
  return normA === normB;
}

function minRequiredChangedLines(iteration) {
  if (iteration >= 9) return 8;
  if (iteration >= 7) return 6;
  if (iteration >= 5) return 4;
  if (iteration >= 3) return 2;
  return 1;
}

function minExpectedScoreGain(currentScore, iteration) {
  if (!Number.isFinite(currentScore)) return 5;
  if (currentScore >= 95) return 0;
  if (iteration >= 7) return Math.max(2, 100 - currentScore);
  if (currentScore >= 85) return 3;
  if (currentScore >= 70) return 6;
  return 8;
}

function countChangedLines(oldText, newText) {
  const oldLines = oldText.replace(/\r\n/g, "\n").split("\n");
  const newLines = newText.replace(/\r\n/g, "\n").split("\n");
  const lcs = buildLcsTable(oldLines, newLines);
  const unchanged = lcs[oldLines.length][newLines.length];
  return oldLines.length + newLines.length - 2 * unchanged;
}

function countFunctionalChangedLines(oldText, newText) {
  const oldLines = oldText.replace(/\r\n/g, "\n").split("\n");
  const newLines = newText.replace(/\r\n/g, "\n").split("\n");
  const lcs = buildLcsTable(oldLines, newLines);
  let i = oldLines.length;
  let j = newLines.length;
  let changed = 0;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      i -= 1;
      j -= 1;
      continue;
    }
    if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      if (isFunctionalCodeLine(newLines[j - 1])) changed += 1;
      j -= 1;
      continue;
    }
    if (i > 0) {
      if (isFunctionalCodeLine(oldLines[i - 1])) changed += 1;
      i -= 1;
    }
  }

  return changed;
}

function isFunctionalCodeLine(line) {
  const clean = String(line || "").trim();
  if (!clean) return false;
  if (clean.startsWith("//")) return false;
  if (clean.startsWith("/*") || clean.startsWith("*") || clean.endsWith("*/")) return false;
  return true;
}

function isFocusedItemCovered(focusImprovementItem, addressedItems) {
  const focus = String(focusImprovementItem || "").trim().toLowerCase();
  if (!focus) return true;
  if (!Array.isArray(addressedItems) || !addressedItems.length) return false;
  const compactFocus = normalizeForCompare(focus);
  const focusTokens = compactFocus
    .split(" ")
    .filter((t) => t.length >= 4)
    .slice(0, 8);
  return addressedItems.some((item) => {
    const text = normalizeForCompare(String(item || "").toLowerCase());
    if (text.includes(compactFocus) || compactFocus.includes(text)) return true;
    if (!focusTokens.length) return false;
    let hits = 0;
    for (const token of focusTokens) {
      if (text.includes(token)) hits += 1;
    }
    return hits >= Math.min(2, focusTokens.length);
  });
}

function normalizeForCompare(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripJsComments(code) {
  const input = String(code || "");
  const noBlock = input.replace(/\/\*[\s\S]*?\*\//g, "");
  return noBlock.replace(/\/\/.*$/gm, "");
}

function normalizeCodeForSemanticCompare(code) {
  return stripJsComments(code)
    .replace(/\s+/g, "")
    .replace(/;+/g, ";")
    .trim();
}

function isSemanticallyEquivalent(currentAnswer, improvedAnswer) {
  if (!improvedAnswer?.trim()) return true;
  return normalizeCodeForSemanticCompare(currentAnswer) === normalizeCodeForSemanticCompare(improvedAnswer);
}

function buildLcsTable(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
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

function shouldEnterClosureMode(payload) {
  const score = Number(payload.lastEvaluationScore || 0);
  return payload.iteration >= 6 || score >= 70;
}

async function estimateScoreFromAnswer(payload, improvedAnswer) {
  if (!improvedAnswer?.trim()) return 0;
  try {
    const text = await askModel({
      systemPrompt: buildSystemPrompt(),
      userPrompt: buildUserPrompt({
        exerciseType: payload.exerciseType,
        question: payload.question,
        candidateAnswer: improvedAnswer,
      }),
      temperature: 0.1,
    });
    const parsed = safeParseJsonFromText(text);
    if (!parsed.ok) return 0;
    const score = Number(parsed.value?.score || 0);
    return Number.isFinite(score) ? score : 0;
  } catch {
    return 0;
  }
}

function safeParseJsonFromText(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return { ok: true, value: JSON.parse(text.slice(start, end + 1)) };
      } catch {
        return { ok: false };
      }
    }
    return { ok: false };
  }
}

function truncate(value, max) {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function checkRateLimit(key) {
  const now = Date.now();
  const current = rateLimitStore.get(key);
  if (!current || current.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }
  if (current.count >= MAX_REQUESTS_PER_WINDOW) {
    return { ok: false, retryAfterMs: current.resetAt - now };
  }
  current.count += 1;
  return { ok: true };
}

async function askModel({ systemPrompt, userPrompt, temperature }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const completion = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!completion.ok) {
      const errText = await completion.text();
      throw {
        status: 502,
        message: "El proveedor LLM devolvió un error.",
        detail: truncate(errText, 500),
      };
    }
    const raw = await completion.json();
    const text = raw?.choices?.[0]?.message?.content;
    if (typeof text !== "string") {
      throw { status: 502, message: "Respuesta inválida del proveedor LLM." };
    }
    return text;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw { status: 504, message: `Timeout consultando el LLM (${Math.round(API_TIMEOUT_MS / 1000)}s).` };
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const clean = line.trim();
    if (!clean || clean.startsWith("#")) continue;
    const idx = clean.indexOf("=");
    if (idx === -1) continue;
    const k = clean.slice(0, idx).trim();
    const v = clean.slice(idx + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}
