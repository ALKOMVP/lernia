import { useMemo } from "react";
import type { ChatMessage } from "../../lib/groupMessages";
import { groupMessagesByAuthor } from "../../lib/groupMessages";

const seed: ChatMessage[] = [
  { id: "1", authorId: "agent", body: "Hola, ¿en qué puedo ayudarte?", ts: 0 },
  { id: "2", authorId: "user", body: "No puedo acceder al portal.", ts: 15_000 },
  { id: "3", authorId: "user", body: "Me sale error 403.", ts: 18_000 },
  { id: "4", authorId: "agent", body: "Vale, revisemos permisos del workspace.", ts: 120_000 },
];

export function GroupMessagesDemo() {
  const groups = useMemo(() => groupMessagesByAuthor(seed, 60_000), []);

  return (
    <div>
      <p style={{ marginTop: 0, color: "var(--text-secondary)" }}>
        Ventana 60s: el usuario mandó dos burbujas seguidas → un solo grupo. El agente más tarde → grupo nuevo.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {groups.map((g) => (
          <div
            key={g.authorId + g.messages[0]!.id}
            style={{
              alignSelf: g.authorId === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
            }}
          >
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
              {g.authorId === "user" ? "Cliente" : "Agente"} · {g.messages.length} msg agrupadas
            </div>
            <div
              style={{
                padding: "0.65rem 0.85rem",
                borderRadius: "14px",
                background: g.authorId === "user" ? "rgba(56,189,248,0.18)" : "rgba(99,102,241,0.22)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {g.messages.map((m) => (
                <div key={m.id} style={{ marginBottom: m.id !== g.messages[g.messages.length - 1]!.id ? "0.35rem" : 0 }}>
                  {m.body}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
