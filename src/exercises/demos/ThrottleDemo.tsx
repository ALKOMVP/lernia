import { useMemo, useState } from "react";
import { throttle } from "../../lib/throttle";

export function ThrottleDemo() {
  const [clicks, setClicks] = useState(0);
  const [handled, setHandled] = useState(0);

  const onThrottled = useMemo(
    () =>
      throttle(() => {
        setHandled((h) => h + 1);
      }, 800),
    []
  );

  return (
    <div>
      <p style={{ marginTop: 0, color: "var(--text-secondary)" }}>
        Haz clic en ráfaga. El contador interno solo sube como máximo una vez cada 800ms.
      </p>
      <button
        type="button"
        className="btn"
        onClick={() => {
          setClicks((c) => c + 1);
          onThrottled();
        }}
      >
        Clic rápido aquí
      </button>
      <div style={{ marginTop: "1rem", display: "grid", gap: "0.35rem", fontSize: "0.95rem" }}>
        <div>
          <strong>Clics totales:</strong> {clicks}
        </div>
        <div>
          <strong>Ejecuciones throttled:</strong> {handled}
        </div>
      </div>
    </div>
  );
}
