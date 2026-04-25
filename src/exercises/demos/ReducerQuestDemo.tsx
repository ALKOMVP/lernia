import { useReducer } from "react";

type State = {
  draft: string;
  sent: string[];
  xp: number;
  combo: number;
};

type Action =
  | { type: "type"; value: string }
  | { type: "send" }
  | { type: "clear" };

const initialState: State = { draft: "", sent: [], xp: 0, combo: 0 };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "type":
      return { ...state, draft: action.value };
    case "send": {
      const clean = state.draft.trim();
      if (!clean) return state;
      const bonus = clean.length >= 20 ? 5 : 2;
      return {
        draft: "",
        sent: [clean, ...state.sent].slice(0, 6),
        combo: state.combo + 1,
        xp: state.xp + bonus + state.combo,
      };
    }
    case "clear":
      return initialState;
    default:
      return state;
  }
}

export function ReducerQuestDemo() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const level = Math.floor(state.xp / 15) + 1;

  return (
    <div>
      <p style={{ marginTop: 0, color: "var(--text-secondary)" }}>
        Mini-juego con reducer: cada mensaje enviado suma XP. Objetivo: entender transiciones puras de estado.
      </p>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Escribe respuesta al cliente..."
          value={state.draft}
          onChange={(e) => dispatch({ type: "type", value: e.target.value })}
        />
        <button type="button" className="btn" onClick={() => dispatch({ type: "send" })}>
          Enviar (+XP)
        </button>
        <button type="button" className="btn" onClick={() => dispatch({ type: "clear" })}>
          Reset
        </button>
      </div>
      <div style={{ marginTop: "0.8rem", color: "var(--text-secondary)" }}>
        Nivel <strong>{level}</strong> · XP <strong>{state.xp}</strong> · combo <strong>{state.combo}</strong>
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
          minHeight: "130px",
        }}
      >
        {state.sent.length ? state.sent.map((m, i) => `${i + 1}. ${m}`).join("\n") : "Aún no hay mensajes enviados."}
      </pre>
    </div>
  );
}
