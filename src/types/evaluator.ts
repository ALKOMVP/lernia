export interface EvaluationRequest {
  exerciseType: string;
  question: string;
  candidateAnswer: string;
}

export interface EvaluationResponse {
  score: number;
  verdict: string;
  strengths: string[];
  issues: string[];
  improvements: string[];
  missingTests: string[];
  interviewScript: string;
  scoreBreakdown?: {
    correctness: number;
    edgeCases: number;
    codeClarity: number;
    communication: number;
    maxPerCategory: number;
  };
  improvementImpact?: Array<{
    item: string;
    estimatedPoints: number;
  }>;
}

export interface WandRequest {
  exerciseType: string;
  question: string;
  candidateAnswer: string;
  iteration: number;
  previousHints: string[];
  previousImprovedAnswer?: string;
  focusImprovementItem?: string;
  lastEvaluationScore?: number;
  lastEvaluationStrengths?: string[];
  lastEvaluationIssues?: string[];
  lastEvaluationImprovements?: string[];
  lastEvaluationMissingTests?: string[];
  lastScoreBreakdown?: {
    correctness: number;
    edgeCases: number;
    codeClarity: number;
    communication: number;
    maxPerCategory: number;
  };
  lastImprovementImpact?: Array<{
    item: string;
    estimatedPoints: number;
  }>;
}

export interface WandResponse {
  iteration: number;
  focusArea: string;
  tinyUpgrade: string;
  whatImproved: string[];
  whatToImprove: string[];
  codingSuggestions: string[];
  addressedItems: string[];
  expectedScoreAfter: number;
  nextStep: string;
  checkpointQuestion: string;
  revisedSnippet: string;
  improvedAnswer: string;
}

export interface RevealRequest {
  exerciseType: string;
  question: string;
  candidateAnswer: string;
}

export interface RevealResponse {
  solutionCode: string;
}
