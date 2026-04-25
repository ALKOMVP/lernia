import type {
  EvaluationRequest,
  EvaluationResponse,
  RevealRequest,
  RevealResponse,
  WandRequest,
  WandResponse,
} from "../types/evaluator";
import type {
  KnowledgeApplyGuidanceRequest,
  KnowledgeApplyGuidanceResponse,
  KnowledgePuzzleReviewRequest,
  KnowledgePuzzleReviewResponse,
} from "../types/knowledgePath";

export async function evaluateAnswer(payload: EvaluationRequest): Promise<EvaluationResponse> {
  const res = await fetch("/api/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || "No se pudo evaluar la respuesta.");
  }
  return data as EvaluationResponse;
}

export async function requestWandHelp(payload: WandRequest): Promise<WandResponse> {
  const res = await fetch("/api/wand", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || "No se pudo obtener ayuda de la varita.");
  }
  return data as WandResponse;
}

export async function revealIdealSolution(payload: RevealRequest): Promise<RevealResponse> {
  const res = await fetch("/api/reveal-solution", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || "No se pudo revelar una solución final.");
  }
  return data as RevealResponse;
}

export async function reviewKnowledgePuzzle(
  payload: KnowledgePuzzleReviewRequest
): Promise<KnowledgePuzzleReviewResponse> {
  const res = await fetch("/api/camino-js/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || "No se pudo revisar el puzzle.");
  }
  return data as KnowledgePuzzleReviewResponse;
}

export async function applyKnowledgeGuidance(
  payload: KnowledgeApplyGuidanceRequest
): Promise<KnowledgeApplyGuidanceResponse> {
  const res = await fetch("/api/camino-js/apply-guidance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || "No se pudo aplicar la mejora sugerida.");
  }
  return data as KnowledgeApplyGuidanceResponse;
}
