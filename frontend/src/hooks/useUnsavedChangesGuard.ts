import { useEffect } from "react";
import { useBlocker } from "react-router-dom";
import { useConfirm } from "@/components/ui/ConfirmModal";

/**
 * Warn the user before they navigate away (in-app or via the browser) while
 * `hasDirty` is true. In-app navigation is gated by a confirm dialog; a full
 * page unload triggers the native browser prompt.
 */
export function useUnsavedChangesGuard(hasDirty: boolean): void {
  const { confirm } = useConfirm();

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasDirty && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    void (async () => {
      const ok = await confirm("You have unsaved changes. Leave anyway?");
      if (ok) blocker.proceed();
      else blocker.reset();
    })();
  }, [blocker, confirm]);

  useEffect(() => {
    if (!hasDirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasDirty]);
}
