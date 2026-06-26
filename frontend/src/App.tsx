import { Link, Outlet } from "react-router-dom";
import { ToastProvider } from "@/components/ui/Toast";
import { ConfirmProvider } from "@/components/ui/ConfirmModal";

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="flex h-full flex-col bg-surface-subtle">
          <header className="flex items-center justify-between border-b border-line bg-surface px-6 py-3">
            <Link to="/" className="group flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-btn bg-accent text-white shadow-sm">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="4" y="8" width="16" height="11" rx="2" />
                  <path d="M12 8V4" />
                  <circle cx="12" cy="3" r="1" />
                  <path d="M9 13h.01M15 13h.01" />
                </svg>
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-ink">
                RoboSim{" "}
                <span className="font-normal text-ink-faint">Scene Manager</span>
              </span>
            </Link>
            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              className="rounded-btn px-2.5 py-1.5 text-xs font-medium text-ink-soft transition hover:bg-surface-sunken hover:text-ink"
            >
              API docs ↗
            </a>
          </header>
          <main className="flex-1 overflow-hidden">
            <Outlet />
          </main>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}
