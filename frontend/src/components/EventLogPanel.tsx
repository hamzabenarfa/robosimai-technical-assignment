import type { EventLog } from "@/schemas";

interface Props {
  events: EventLog[];
}

export function EventLogPanel({ events }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          Event log
        </p>
      </div>
      <ul className="mt-2 max-h-40 flex-1 space-y-0.5 overflow-y-auto font-mono text-xs text-ink-soft">
        {events.length === 0 && (
          <li className="text-ink-faint">No events yet.</li>
        )}
        {events.map((e) => (
          <li
            key={e.id}
            className="flex gap-3 rounded px-1 py-0.5 hover:bg-surface-sunken"
          >
            <span className="shrink-0 tabular-nums text-ink-faint">
              {new Date(e.timestamp).toLocaleTimeString()}
            </span>
            <span className="shrink-0 font-semibold text-accent">{e.action}</span>
            <span className="truncate text-ink-faint">
              {summarize(e.payload)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function summarize(payload: Record<string, unknown>): string {
  if (!payload || Object.keys(payload).length === 0) return "";
  const parts: string[] = [];
  if ("type" in payload) parts.push(String(payload.type));
  if ("object_id" in payload) parts.push(String(payload.object_id).slice(0, 8));
  if ("name" in payload) parts.push(`name=${String(payload.name)}`);
  return parts.join(" · ");
}
