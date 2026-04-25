import { useState } from "react";
import { promisePool } from "../../lib/promisePool";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function PromisePoolDemo() {
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const run = async () => {
    setRunning(true);
    setLog([]);
    const urls = ["A", "B", "C", "D", "E", "F"];
    const t0 = performance.now();
    await promisePool(urls, 2, async (u) => {
      setLog((l) => [...l, `start ${u}`].slice(-20));
      await sleep(400);
      setLog((l) => [...l, `done  ${u}`].slice(-20));
      return u.toLowerCase();
    });
    const dt = Math.round(performance.now() - t0);
    setLog((l) => [...l, `TOTAL ~${dt}ms (con currency=2 sobre 6 tareas)`]);
    setRunning(false);
  };

  return (
    <div>
      <p style={{ marginTop: 0, color: "var(--text-secondary)" }}>
        Simula peticiones lentas. Concurrency=2: como mucho dos en vuelo a la vez.
      </p>
      <button type="button" className="btn" disabled={running} onClick={() => void run()}>
        {running ? "Ejecutando…" : "Lanzar pool (concurrencia 2)"}
      </button>
      <pre
        style={{
          marginTop: "1rem",
          marginBottom: 0,
          padding: "0.75rem",
          background: "#0a0f1a",
          borderRadius: "8px",
          fontFamily: "var(--font-mono)",
          fontSize: "0.78rem",
          color: "#e2e8f0",
          minHeight: "200px",
        }}
      >
        {log.length ? log.join("\n") : "Pulsa el botón para ver entrelazado de starts/dones."}
      </pre>
    </div>
  );
}
