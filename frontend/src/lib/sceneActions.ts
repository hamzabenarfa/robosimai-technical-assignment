import { api, ApiException } from "@/api/client";
import { useSceneStore } from "@/store/useSceneStore";

type ConfirmFn = (message: string) => Promise<boolean>;

let confirmFn: ConfirmFn = (message) => Promise.resolve(window.confirm(message));
let deleteInFlight = false;

export function setConfirmHandler(fn: ConfirmFn): void {
  confirmFn = fn;
}

export async function deleteSelectedObject(opts: {
  sceneId: string;
  objectId: string;
  confirm?: boolean;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}): Promise<boolean> {
  if (deleteInFlight) return false;

  if (opts.confirm !== false) {
    const ok = await confirmFn("Delete this object?");
    if (!ok) return false;
  }

  deleteInFlight = true;
  try {
    await api.deleteObject(opts.sceneId, opts.objectId);
    useSceneStore.getState().removeLocalObject(opts.objectId);
    opts.onSuccess?.();
    return true;
  } catch (e) {
    const message =
      e instanceof ApiException ? e.message : "Delete failed";
    opts.onError?.(message);
    return false;
  } finally {
    deleteInFlight = false;
  }
}
