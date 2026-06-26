import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { setConfirmHandler } from "@/lib/sceneActions";

interface ConfirmState {
  message: string;
  resolve: (value: boolean) => void;
}

interface ConfirmApi {
  confirm: (message: string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmApi | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback((message: string) => {
    return new Promise<boolean>((resolve) => {
      setState({ message, resolve });
    });
  }, []);

  useEffect(() => {
    setConfirmHandler(confirm);
    return () => {
      setConfirmHandler((msg) => Promise.resolve(window.confirm(msg)));
    };
  }, [confirm]);

  useEffect(() => {
    if (!state) return;
    cancelRef.current?.focus();
    const current = state;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        current.resolve(false);
        setState(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state]);

  function close(result: boolean) {
    state?.resolve(result);
    setState(null);
  }

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => close(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-desc"
            className="w-full max-w-md rounded-panel border border-line bg-surface p-6 shadow-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="confirm-title"
              className="text-lg font-semibold tracking-tight text-ink"
            >
              Confirm
            </h2>
            <p id="confirm-desc" className="mt-2 text-sm text-ink-soft">
              {state.message}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => close(false)}
                className="rounded-btn border border-line px-4 py-2 text-sm font-medium text-ink-soft transition hover:bg-surface-sunken hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className="rounded-btn bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmApi {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside ConfirmProvider");
  return ctx;
}
