import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { ExerciseDetail } from "./pages/ExerciseDetail";
import { LlmEvaluator } from "./pages/LlmEvaluator";
import { KnowledgePathHome } from "./pages/KnowledgePathHome";
import { KnowledgePathJavaScript } from "./pages/KnowledgePathJavaScript";
import { NotFound } from "./pages/NotFound";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ejercicio/:slug" element={<ExerciseDetail />} />
        <Route path="/evaluador-llm" element={<LlmEvaluator />} />
        <Route path="/camino-del-conocimiento" element={<KnowledgePathHome />} />
        <Route path="/camino-del-conocimiento/javascript" element={<KnowledgePathJavaScript />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
