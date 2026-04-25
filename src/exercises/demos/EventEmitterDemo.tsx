import { useEffect, useState } from "react";
import { EventEmitter } from "../../lib/eventEmitter";

export function EventEmitterDemo() {
  const [lines, setLines] = useState<string[]>([]);
  const [emitter] = useState(() => new EventEmitter());

  useEffect(() => {
    const u1 = emitter.on("message", (body) => {
      setLines((l) => [`Widget A recibió: ${String(body)}`, ...l].slice(0, 10));
    });
    const u2 = emitter.on("message", (body) => {
      setLines((l) => [`Widget B recibió: ${String(body)}`, ...l].slice(0, 10));
    });
    return () => {
      u1();
      u2();
    };
  }, [emitter]);

  return (
    <div>
      <p style={{ marginTop: 0, color: "var(--text-secondary)" }}>
        Dos “widgets” escuchan el mismo evento <code>message</code>, típico de capas de UI desacopladas.
      </p>
      <button
        type="button"
        className="btn"
        onClick={() => emitter.emit("message", `hola ${new Date().toLocaleTimeString()}`)}
      >
        emit(&quot;message&quot;, …)
      </button>
      <pre
        style={{
          marginTop: "1rem",
          marginBottom: 0,
          padding: "0.75rem",
          background: "#0a0f1a",
          borderRadius: "8px",
          fontFamily: "var(--font-mono)",
          fontSize: "0.82rem",
          color: "#e2e8f0",
          minHeight: "140px",
        }}
      >
        {lines.length ? lines.join("\n") : "Pulsa emit para ver fan-out a listeners."}
      </pre>
    </div>
  );
}
