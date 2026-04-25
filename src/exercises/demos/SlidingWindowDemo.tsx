import { useMemo, useState } from "react";

type WindowState = {
  left: number;
  right: number;
  bestLen: number;
  bestRange: [number, number];
  current: string;
  char: string;
};

function computeStates(input: string): WindowState[] {
  const states: WindowState[] = [];
  const lastPos = new Map<string, number>();
  let left = 0;
  let bestLen = 0;
  let bestRange: [number, number] = [0, -1];

  for (let right = 0; right < input.length; right++) {
    const ch = input[right]!;
    const seen = lastPos.get(ch);
    if (seen !== undefined && seen >= left) {
      left = seen + 1;
    }
    lastPos.set(ch, right);
    const len = right - left + 1;
    if (len > bestLen) {
      bestLen = len;
      bestRange = [left, right];
    }
    states.push({
      left,
      right,
      bestLen,
      bestRange,
      current: input.slice(left, right + 1),
      char: ch,
    });
  }
  return states;
}

export function SlidingWindowDemo() {
  const [text, setText] = useState("abracadabra");
  const [step, setStep] = useState(0);
  const states = useMemo(() => computeStates(text), [text]);
  const current = states[Math.min(step, Math.max(0, states.length - 1))];

  return (
    <div>
      <p style={{ marginTop: 0, color: "var(--text-secondary)" }}>
        Modo detective: avanza paso a paso y observa cómo se mueve la ventana al encontrar repetidos.
      </p>
      <input
        type="text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setStep(0);
        }}
        placeholder="Escribe un texto"
      />
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.7rem", flexWrap: "wrap" }}>
        <button type="button" className="btn" onClick={() => setStep((s) => Math.max(0, s - 1))}>
          Paso -
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => setStep((s) => Math.min(states.length > 0 ? states.length - 1 : 0, s + 1))}
        >
          Paso +
        </button>
        <button type="button" className="btn" onClick={() => setStep(states.length > 0 ? states.length - 1 : 0)}>
          Ir al final
        </button>
      </div>
      <div style={{ marginTop: "0.9rem", color: "var(--text-secondary)" }}>
        {states.length === 0 ? (
          "Sin caracteres."
        ) : (
          <>
            <div>
              Paso {Math.min(step + 1, states.length)}/{states.length} · char actual: <strong>{current?.char}</strong>
            </div>
            <div>
              Ventana actual [{current?.left}, {current?.right}] ={" "}
              <code style={{ color: "var(--accent)" }}>{current?.current}</code>
            </div>
            <div>
              Mejor longitud: <strong>{current?.bestLen}</strong> (rango [{current?.bestRange[0]},{" "}
              {current?.bestRange[1]}])
            </div>
          </>
        )}
      </div>
    </div>
  );
}
