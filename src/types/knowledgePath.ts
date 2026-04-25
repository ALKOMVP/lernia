export type PuzzleDifficulty = "medio" | "medio-alto" | "avanzado";

export interface KnowledgePuzzle {
  id: string;
  chapter: string;
  title: string;
  difficulty: PuzzleDifficulty;
  narrative: string;
  prompt: string;
  learningGoals: string[];
  completionCriteria: string[];
  starterCode: string;
  loreHint: string;
}

export interface KnowledgePuzzleReviewRequest {
  puzzleId: string;
  puzzleTitle: string;
  puzzleDifficulty: PuzzleDifficulty;
  puzzleNarrative: string;
  puzzlePrompt: string;
  learningGoals: string[];
  completionCriteria: string[];
  starterCode: string;
  candidateCode: string;
  attempt: number;
}

export interface KnowledgePuzzleReviewResponse {
  approved: boolean;
  score: number;
  verdict: string;
  strengths: string[];
  gaps: string[];
  guidance: string[];
  guidanceExamples: string[];
  nextHint: string;
  interviewAngle: string;
}

export interface KnowledgeApplyGuidanceRequest {
  puzzleId: string;
  puzzleTitle: string;
  puzzleDifficulty: PuzzleDifficulty;
  puzzlePrompt: string;
  learningGoals: string[];
  completionCriteria: string[];
  candidateCode: string;
  guidanceItem: string;
  guidanceExample?: string;
}

export interface KnowledgeApplyGuidanceResponse {
  improvedCode: string;
  appliedChange: string;
}
