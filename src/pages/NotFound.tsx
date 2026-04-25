import { Link } from "react-router-dom";
import prose from "./Prose.module.css";

export function NotFound() {
  return (
    <div className={prose.article}>
      <h1 className={prose.h1}>404 — misión no encontrada</h1>
      <p className={prose.lead}>Ese slug no coincide con ningún ejercicio del mapa.</p>
      <p>
        <Link to="/">Volver al inicio</Link>
      </p>
    </div>
  );
}
