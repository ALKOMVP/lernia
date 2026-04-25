import { useMemo, useState } from "react";

type AttemptLog = {
  requestId: number;
  attempt: number;
  waitMs: number;
  ok: boolean;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function BackoffDemo() {
  const [failureRate, setFailureRate] = useState(0.6);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<AttemptLog[]>([]);
  const [summary, setSummary] = useState<string>("Listo para lanzar simulación.");

  const emoji = useMemo(() => {
    if (failureRate <= 0.3) return "😌";
    if (failureRate <= 0.6) return "😬";
    return "🔥";
  }, [failureRate]);

  const append = (line: AttemptLog) => setLogs((prev) => [line, ...prev].slice(0, 18));

  async function flakyRequest(requestId: number): Promise<void> {
    await sleep(120);
    if (Math.random() < failureRate) {
      throw new Error(`fallo req-${requestId}`);
    }
  }

  async function runOne(requestId: number, maxRetries = 4, baseMs = 120) {
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      const waitMs = attempt === 1 ? 0 : baseMs * 2 ** (attempt - 2);
      if (waitMs > 0) await sleep(waitMs);
      try {
        await flakyRequest(requestId);
        append({ requestId, attempt, waitMs, ok: true });
        return true;
      } catch {
        append({ requestId, attempt, waitMs, ok: false });
      }
    }
    return false;
  }

  const runSimulation = async () => {
    setRunning(true);
    setLogs([]);
    let okCount = 0;
    for (let req = 1; req <= 5; req++) {
      const ok = await runOne(req);
      if (ok) okCount += 1;
    }
    setSummary(`Completadas 5 requests. Exitosas: ${okCount}. Fallidas finales: ${5 - okCount}.`);
    setRunning(false);
  };

  return (
    <div>
      <p style={{ marginTop: 0, color: "var(--text-secondary)" }}>
        Simula una API inestable y mira cómo el backoff exponencial evita bombardear cuando hay errores. Estado actual:{" "}
        <strong>{Math.round(failureRate * 100)}% de fallos</strong> {emoji}
      </p>
      <label style={{ display: "block", marginBottom: "0.6rem", color: "var(--text-muted)" }}>
        Tasa de fallo (0 a 90%)
      </label>
      <input
        type="range"
        min={0}
        max={90}
        step={5}
        value={Math.round(failureRate * 100)}
        onChange={(e) => setFailureRate(Number(e.target.value) / 100)}
      />
      <div style={{ marginTop: "0.7rem" }}>
        <button type="button" className="btn" disabled={running} onClick={() => void runSimulation()}>
          {running ? "Corriendo..." : "Lanzar 5 requests con retry"}
        </button>
      </div>
      <p style={{ color: "var(--text-secondary)", marginBottom: "0.45rem" }}>{summary}</p>
      <pre
        style={{
          margin: 0,
          padding: "0.75rem",
          background: "#0a0f1a",
          borderRadius: "8px",
          fontFamily: "var(--font-mono)",
          fontSize: "0.78rem",
          color: "#e2e8f0",
          minHeight: "220px",
        }}
      >
        {logs.length
          ? logs
              .map((l) =>
                `${l.ok ? "OK " : "ERR"} req=${l.requestId} intent=${l.attempt} wait=${l.waitMs.toString().padStart(3, " ")}ms`
              )
              .join("\n")
          : "Todavía no hay eventos."}
      </pre>
    </div>
  );
}
