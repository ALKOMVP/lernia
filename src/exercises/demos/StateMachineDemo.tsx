import { useState } from "react";

type ChatState = "idle" | "typing" | "sending" | "delivered" | "failed";

const transitions: Record<ChatState, ChatState[]> = {
  idle: ["typing"],
  typing: ["sending", "idle"],
  sending: ["delivered", "failed"],
  delivered: ["typing"],
  failed: ["typing", "sending"],
};

const stateEmoji: Record<ChatState, string> = {
  idle: "🫧",
  typing: "⌨️",
  sending: "📡",
  delivered: "✅",
  failed: "❌",
};

export function StateMachineDemo() {
  const [state, setState] = useState<ChatState>("idle");
  const [history, setHistory] = useState<ChatState[]>(["idle"]);

  function go(next: ChatState) {
    if (!transitions[state].includes(next)) return;
    setState(next);
    setHistory((h) => [...h, next].slice(-10));
  }

  return (
    <div>
      <p style={{ marginTop: 0, color: "var(--text-secondary)" }}>
        Juega a romper el flujo de envío: la máquina de estados permite solo transiciones válidas.
      </p>
      <div style={{ marginBottom: "0.75rem" }}>
        Estado actual:{" "}
        <strong>
          {stateEmoji[state]} {state}
        </strong>
      </div>
      <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
        {transitions[state].map((next) => (
          <button key={next} type="button" className="btn" onClick={() => go(next)}>
            Ir a {next}
          </button>
        ))}
      </div>
      <pre
        style={{
          marginTop: "0.8rem",
          marginBottom: 0,
          padding: "0.75rem",
          background: "#0a0f1a",
          borderRadius: "8px",
          fontFamily: "var(--font-mono)",
          fontSize: "0.8rem",
          color: "#e2e8f0",
        }}
      >
        {history.join(" -> ")}
      </pre>
    </div>
  );
}
