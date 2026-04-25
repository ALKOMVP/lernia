import type { ExerciseModule } from "../types/exercise";
import { binarySearchExercise } from "./binarySearch";
import { groupMessagesExercise } from "./groupMessages";
import { debounceExercise } from "./debounce";
import { eventEmitterExercise } from "./eventEmitter";
import { interviewMetaExercise } from "./interviewMeta";
import { jsFundamentalsExercise } from "./jsFundamentals";
import { lruCacheExercise } from "./lruCache";
import { mergeIntervalsExercise } from "./mergeIntervals";
import { promisePoolExercise } from "./promisePool";
import { reactPatternsExercise } from "./reactPatterns";
import { reactReducerExercise } from "./reactReducer";
import { retryBackoffExercise } from "./retryBackoff";
import { slidingWindowExercise } from "./slidingWindow";
import { stateMachineChatExercise } from "./stateMachineChat";
import { throttleExercise } from "./throttle";
import { twoPointersPalindromeExercise } from "./twoPointersPalindrome";

/** Orden pedagógico: de base a más específico del dominio */
const ordered: ExerciseModule[] = [
  interviewMetaExercise,
  jsFundamentalsExercise,
  twoPointersPalindromeExercise,
  binarySearchExercise,
  debounceExercise,
  throttleExercise,
  slidingWindowExercise,
  reactPatternsExercise,
  reactReducerExercise,
  promisePoolExercise,
  retryBackoffExercise,
  mergeIntervalsExercise,
  stateMachineChatExercise,
  eventEmitterExercise,
  groupMessagesExercise,
  lruCacheExercise,
];

export const exerciseList = ordered.map((m) => m.meta);

export const exercisesBySlug: Record<string, ExerciseModule> = Object.fromEntries(
  ordered.map((m) => [m.meta.slug, m])
);

export function getExercise(slug: string | undefined): ExerciseModule | undefined {
  if (!slug) return undefined;
  return exercisesBySlug[slug];
}
