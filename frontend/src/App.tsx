import { Route, Routes, Link } from "react-router-dom";
import SceneListPage from "@/pages/SceneListPage";
import SceneEditorPage from "@/pages/SceneEditorPage";
import { ToastProvider } from "@/components/Toast";

export default function App() {
  return (
    <ToastProvider>
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-3">
          <Link to="/" className="text-lg font-semibold text-white">
            RoboSim Scene Manager
          </Link>
          <a
            href="/docs"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            API docs ↗
          </a>
        </header>
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<SceneListPage />} />
            <Route path="/scenes/:sceneId" element={<SceneEditorPage />} />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  );
}
