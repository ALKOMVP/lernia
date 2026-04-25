import { useEffect, useState } from "react";

export function BinarySearchGameDemo() {
  const [target, setTarget] = useState(() => 1 + Math.floor(Math.random() * 100));
  const [low, setLow] = useState(1);
  const [high, setHigh] = useState(100);
  const [guess, setGuess] = useState("");
  const [msg, setMsg] = useState("Adivina un número de 1 a 100.");
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    if (low > high) {
      setMsg("Tus límites están cruzados. Reinicia.");
    }
  }, [low, high]);

  function reset() {
    setTarget(1 + Math.floor(Math.random() * 100));
    setLow(1);
    setHigh(100);
    setGuess("");
    setMoves(0);
    setMsg("Nuevo número oculto. Vamos.");
  }

  function submit() {
    const n = Number(guess);
    if (!Number.isInteger(n) || n < 1 || n > 100) {
      setMsg("Ingresa entero 1..100.");
      return;
    }
    setMoves((m) => m + 1);
    if (n === target) {
      setMsg(`¡Exacto! Lo lograste en ${moves + 1} intentos.`);
    } else if (n < target) {
      setMsg("Demasiado bajo.");
      setLow((l) => Math.max(l, n + 1));
    } else {
      setMsg("Demasiado alto.");
      setHigh((h) => Math.min(h, n - 1));
    }
  }

  const suggestion = Math.floor((low + high) / 2);

  return (
    <div>
      <p style={{ marginTop: 0, color: "var(--text-secondary)" }}>
        Juego + algoritmo: tú adivinas, y debajo tienes la sugerencia óptima de búsqueda binaria.
      </p>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <input type="text" value={guess} onChange={(e) => setGuess(e.target.value)} style={{ maxWidth: "140px" }} />
        <button type="button" className="btn" onClick={submit}>
          Probar
        </button>
        <button type="button" className="btn" onClick={reset}>
          Reiniciar
        </button>
      </div>
      <div style={{ marginTop: "0.8rem", color: "var(--text-secondary)" }}>
        <div>{msg}</div>
        <div>
          Rango activo: [{low}, {high}] · sugerencia binaria: <strong>{suggestion}</strong>
        </div>
      </div>
    </div>
  );
}
