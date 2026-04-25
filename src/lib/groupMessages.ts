export interface ChatMessage {
  id: string;
  authorId: string;
  body: string;
  /** epoch ms */
  ts: number;
}

/**
 * Agrupa mensajes consecutivos del mismo autor si están dentro de `gapMs`.
 * Patrón típico en hilos de chat / portal de soporte.
 */
export function groupMessagesByAuthor(
  messages: ChatMessage[],
  gapMs: number
): { authorId: string; messages: ChatMessage[] }[] {
  if (messages.length === 0) return [];
  const sorted = [...messages].sort((a, b) => a.ts - b.ts);
  const groups: { authorId: string; messages: ChatMessage[] }[] = [];
  let current = { authorId: sorted[0]!.authorId, messages: [sorted[0]!] };

  for (let i = 1; i < sorted.length; i++) {
    const m = sorted[i]!;
    const prev = current.messages[current.messages.length - 1]!;
    const sameAuthor = m.authorId === prev.authorId;
    const closeInTime = m.ts - prev.ts <= gapMs;
    if (sameAuthor && closeInTime) {
      current.messages.push(m);
    } else {
      groups.push(current);
      current = { authorId: m.authorId, messages: [m] };
    }
  }
  groups.push(current);
  return groups;
}
