# Lernia · Plataforma educativa de JavaScript para live coding

Aplicacion web orientada a preparar entrevistas tecnicas de live coding (JavaScript/Node/React) con un enfoque de aprendizaje activo:

- ejercicios explicados y ejecutables,
- evaluacion con LLM,
- asistencia incremental,
- y un modo aventura por puzzles llamado **El camino del conocimiento**.

Repositorio: [ALKOMVP/lernia](https://github.com/ALKOMVP/lernia)

---

## Tabla de contenidos

- [Vision del proyecto](#vision-del-proyecto)
- [Caracteristicas principales](#caracteristicas-principales)
- [El camino del conocimiento](#el-camino-del-conocimiento)
- [Arquitectura tecnica](#arquitectura-tecnica)
- [Requisitos](#requisitos)
- [Instalacion y ejecucion local](#instalacion-y-ejecucion-local)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [API del backend](#api-del-backend)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Flujo recomendado de estudio](#flujo-recomendado-de-estudio)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)

---

## Vision del proyecto

Esta plataforma busca entrenar competencias reales para entrevistas tecnicas:

- modelado de problemas,
- implementacion incremental,
- manejo de edge cases,
- comunicacion tecnica en vivo.

No se limita a "mostrar soluciones": obliga a resolver, comparar, iterar y justificar decisiones.

---

## Caracteristicas principales

### 1) Biblioteca de ejercicios didacticos

- Ejercicios de algoritmos, estructuras, patrones de frontend y backend.
- Demos ejecutables para entender comportamiento en tiempo real.
- Material orientado a transferir criterio, no a memorizar recetas.

### 2) Evaluador LLM

En `\`/evaluador-llm\``:

- Evalua texto/codigo del usuario.
- Devuelve score, fortalezas, riesgos/huecos, mejoras accionables y tests faltantes.
- Incluye guion sugerido para comunicar la solucion en entrevista.

### 3) Varita magica incremental

- Propone mejoras paso a paso, no solo resultado final.
- Puede enfocarse en un item especifico de la evaluacion.
- Muestra diff estilo git y permite aplicar cambios al texto del usuario.

### 4) Solucion ideal canonicamente definida

- El backend construye y cachea una solucion ideal por enunciado.
- Se usa para:
  - consistencia en evaluacion,
  - `reveal` de solucion ideal,
  - y guiar mejoras incrementales.

---

## El camino del conocimiento

En `\`/camino-del-conocimiento\`` y `\`/camino-del-conocimiento/javascript\``.

Modulo gamificado de JavaScript medio a avanzado con narrativa de aventura:

- puzzles encadenados por capitulos,
- desbloqueo progresivo,
- starter code editable,
- analisis con LLM para aprobar/no aprobar,
- recomendaciones accionables con ejemplos de codigo,
- aplicacion automatica de una recomendacion por item (`🪄`),
- autoformateo del editor al `Enter` y al perder foco (preservando posicion del cursor),
- persistencia local de progreso, intentos y borradores.

---

## Arquitectura tecnica

- **Frontend:** React + TypeScript + Vite
- **Router:** `react-router-dom`
- **Backend API:** Node.js + Express (ESM)
- **LLM provider:** OpenAI Chat Completions (configurable por `.env`)
- **Formato en editor:** Prettier (en cliente)

### Diseño general

- Frontend y backend se ejecutan en paralelo en desarrollo.
- Vite proxya `\`/api\`` a `http://localhost:8787`.
- Backend incorpora:
  - rate limiting en memoria,
  - timeout configurable de llamadas al LLM,
  - normalizacion de respuestas JSON,
  - cache de solucion ideal por ejercicio/puzzle.

---

## Requisitos

- Node.js 18+ recomendado
- npm 9+ recomendado
- API Key de OpenAI

---

## Instalacion y ejecucion local

```bash
npm install
cp .env.example .env
```

Completa tu `OPENAI_API_KEY` en `.env`, luego:

```bash
npm run dev
```

Esto levanta:

- Frontend (Vite)
- Backend (`server/index.mjs`) con watch mode

Build de produccion:

```bash
npm run build
```

Preview:

```bash
npm run preview
```

---

## Variables de entorno

Archivo de referencia: `/.env.example`

- `OPENAI_API_KEY`: clave de OpenAI
- `OPENAI_BASE_URL`: base URL del proveedor (default OpenAI)
- `OPENAI_MODEL`: modelo de chat a usar
- `API_PORT`: puerto del backend (default `8787`)
- `API_TIMEOUT_MS`: timeout de llamadas LLM en ms (default `45000`)

---

## Scripts disponibles

Desde `package.json`:

- `npm run dev`: frontend + backend en paralelo
- `npm run dev:web`: solo Vite
- `npm run dev:api`: solo API Node en watch
- `npm run build`: typecheck + build Vite
- `npm run preview`: preview del build
- `npm run start:api`: API sin watch

---

## API del backend

Base local: `http://localhost:8787`

### Salud

- `GET /api/health`

### Evaluacion general

- `POST /api/evaluate`
- `POST /api/wand`
- `POST /api/reveal-solution`

### Camino del conocimiento (JS)

- `POST /api/camino-js/review`  
  Evalua un intento de puzzle y decide aprobacion.

- `POST /api/camino-js/apply-guidance`  
  Aplica automaticamente una recomendacion puntual al codigo del usuario.

---

## Estructura del proyecto

```text
.
├── server/
│   └── index.mjs                 # API LLM, evaluacion y logica de apoyo
├── src/
│   ├── components/               # UI reusable
│   ├── data/
│   │   └── knowledgePath.ts      # catalogo de puzzles del camino JS
│   ├── exercises/                # ejercicios base + demos
│   ├── lib/                      # cliente API y utilidades
│   ├── pages/                    # paginas principales (Home, Evaluador, Camino, etc.)
│   └── types/                    # contratos TS
├── .env.example
├── vite.config.ts
└── package.json
```

---

## Flujo recomendado de estudio

1. Resolver 1 puzzle del camino JS sin ayuda.
2. Ejecutar `Analizar con LLM`.
3. Aplicar 1 recomendacion manualmente (o usar `🪄` para comparar enfoque).
4. Reanalizar hasta aprobar.
5. Cerrar explicando la solucion en 60-90 segundos como si fuera entrevista real.

---

## Troubleshooting

### "Falta OPENAI_API_KEY"

- Verifica que `.env` exista y contenga la key.
- Reinicia `npm run dev` tras editar `.env`.

### Timeout del LLM

- Sube `API_TIMEOUT_MS` en `.env`.
- Reduce longitud del input si estas enviando bloques excesivamente largos.

### 429 Too Many Requests

- Espera a que venza la ventana de rate limit o reduce frecuencia de llamadas.

### El formateo no aplica

- Si el codigo tiene errores de sintaxis graves, el formateador no fuerza cambios para evitar romper la edicion en curso.

---

## Roadmap

- Carga dinamica de Prettier para reducir bundle inicial.
- Vista previa de diff antes de aplicar `🪄`.
- Runner de tests por puzzle con casos visibles.
- Sistema de logros y ranking local.
- Export de progreso de estudio.

---

Proyecto construido para aprendizaje profundo de JavaScript orientado a entrevistas live coding.

