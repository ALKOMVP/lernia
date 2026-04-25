import { useMemo, useState } from "react";

type Interval = { start: number; end: number };

function mergeIntervals(input: Interval[]): Interval[] {
  if (input.length === 0) return [];
  const sorted = [...input].sort((a, b) => a.start - b.start);
  const out: Interval[] = [sorted[0]!];
  for (let i = 1; i < sorted.length; i++) {
    const top = out[out.length - 1]!;
    const cur = sorted[i]!;
    if (cur.start <= top.end) {
      top.end = Math.max(top.end, cur.end);
    } else {
      out.push({ ...cur });
    }
  }
  return out;
}

function randomIntervals(): Interval[] {
  return Array.from({ length: 7 }, () => {
    const start = Math.floor(Math.random() * 20);
    const end = start + 1 + Math.floor(Math.random() * 6);
    return { start, end };
  });
}

export function MergeIntervalsDemo() {
  const [intervals, setIntervals] = useState<Interval[]>(randomIntervals);
  const merged = useMemo(() => mergeIntervals(intervals), [intervals]);

  return (
    <div>
      <p style={{ marginTop: 0, color: "var(--text-secondary)" }}>
        Agenda caótica: intervalos solapados de soporte. Tu algoritmo los compacta en bloques limpios.
      </p>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.8rem" }}>
        <button type="button" className="btn" onClick={() => setIntervals(randomIntervals())}>
          Generar caos nuevo
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => setIntervals((prev) => [...prev, { start: 4, end: 10 }])}
        >
          Inyectar [4,10]
        </button>
      </div>
      <div style={{ color: "var(--text-secondary)" }}>
        <div>
          <strong>Original:</strong>{" "}
          <code>{intervals.map((x) => `[${x.start},${x.end}]`).join(" ")}</code>
        </div>
        <div>
          <strong>Merge:</strong> <code style={{ color: "var(--success)" }}>{merged.map((x) => `[${x.start},${x.end}]`).join(" ")}</code>
        </div>
      </div>
    </div>
  );
}
