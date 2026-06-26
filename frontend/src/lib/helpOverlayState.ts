let helpOpen = false;
const listeners = new Set<(open: boolean) => void>();

export function getHelpOpen(): boolean {
  return helpOpen;
}

export function setHelpOpen(open: boolean): void {
  if (helpOpen === open) return;
  helpOpen = open;
  for (const listener of listeners) listener(open);
}

export function subscribeHelpOpen(listener: (open: boolean) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
