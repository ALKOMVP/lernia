import { useMemo, useState } from "react";
import { debounce } from "../../lib/debounce";

export function DebounceDemo() {
  const [raw, setRaw] = useState("");
  const [debounced, setDebounced] = useState("");
  const [fires, setFires] = useState(0);

  const onDebounced = useMemo(
    () =>
      debounce((value: string) => {
        setDebounced(value);
        setFires((n) => n + 1);
      }, 400),
    []
  );

  return (
    <div>
      <label htmlFor="deb-input" style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)" }}>
        Escribe rápido — el valor “estable” solo cambia tras pausa
      </label>
      <input
        id="deb-input"
        type="search"
        placeholder="Ej: estado del ticket, búsqueda en portal…"
        value={raw}
        onChange={(e) => {
          const v = e.target.value;
          setRaw(v);
          onDebounced(v);
        }}
      />
      <div style={{ marginTop: "1rem", display: "grid", gap: "0.35rem", fontSize: "0.95rem" }}>
        <div>
          <strong>Valor en vivo:</strong> <span style={{ color: "var(--accent)" }}>{raw || "—"}</span>
        </div>
        <div>
          <strong>Tras debounce (400ms):</strong>{" "}
          <span style={{ color: "var(--success)" }}>{debounced || "—"}</span>
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Llamadas efectivas al “handler”: {fires} (debería ser mucho menor que tus pulsaciones)
        </div>
      </div>
    </div>
  );
}
