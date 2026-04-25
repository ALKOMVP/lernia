import type { ReactNode } from "react";

export type Difficulty = "base" | "intermedio" | "avanzado";

export interface ExerciseMeta {
  slug: string;
  title: string;
  /** Una línea para la tarjeta del listado */
  teaser: string;
  tags: string[];
  difficulty: Difficulty;
  minutes: number;
  /** Por qué importa para un rol chat/portal/real-time */
  whyItMatters: string;
}

export interface ExerciseModule {
  meta: ExerciseMeta;
  /** Enunciado claro */
  statement: ReactNode;
  /** Explicación + código comentado */
  walkthrough: ReactNode;
  /** Qué deberías lograr al terminar la lección */
  learningObjectives?: string[];
  /** Checklist concreto para validar dominio */
  masteryChecklist?: string[];
  /** Errores típicos de entrevista/implementación */
  commonMistakes?: string[];
  /** Mini-reto para practicar recuerdo activo */
  miniChallenge?: ReactNode;
  /** Pasos recomendados para usar el laboratorio */
  labSteps?: string[];
  /** Demo opcional (interactivo) */
  demo?: ReactNode;
}
