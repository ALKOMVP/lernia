import { useState } from "react";
import { LRUCache } from "../../lib/lruCache";

export function LruDemo() {
  const [cache] = useState(() => new LRUCache<string, string>(3));
  const [log, setLog] = useState<string[]>([]);

  const pushLog = (line: string) => setLog((l) => [line, ...l].slice(0, 8));

  const setKV = (k: string, v: string) => {
    cache.set(k, v);
    pushLog(`set(${k}, "${v}")`);
  };

  const getK = (k: string) => {
    const v = cache.get(k);
    pushLog(`get(${k}) → ${v === undefined ? "undefined" : `"${v}"`}`);
  };

  return (
    <div>
      <p style={{ marginTop: 0, color: "var(--text-secondary)" }}>
        Capacidad 3. Al añadir un cuarto par distinto, expulsa el menos usado recientemente.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <button type="button" className="btn" onClick={() => setKV("a", "1")}>
          set a=1
        </button>
        <button type="button" className="btn" onClick={() => setKV("b", "2")}>
          set b=2
        </button>
        <button type="button" className="btn" onClick={() => setKV("c", "3")}>
          set c=3
        </button>
        <button type="button" className="btn" onClick={() => setKV("d", "4")}>
          set d=4 (evicción)
        </button>
        <button type="button" className="btn" onClick={() => getK("a")}>
          get a
        </button>
        <button type="button" className="btn" onClick={() => getK("b")}>
          get b
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: "0.75rem",
          background: "#0a0f1a",
          borderRadius: "8px",
          fontFamily: "var(--font-mono)",
          fontSize: "0.82rem",
          color: "#e2e8f0",
        }}
      >
        {log.length ? log.join("\n") : "Toca los botones para ver el historial."}
      </pre>
    </div>
  );
}
