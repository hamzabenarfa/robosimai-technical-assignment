import type { EventLog } from "@/types";

interface Props {
  events: EventLog[];
}

export function EventLogPanel({ events }: Props) {
  return (
    <div className="flex h-full flex-col">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Event log
      </p>
      <ul className="mt-2 max-h-40 flex-1 space-y-1 overflow-y-auto font-mono text-xs text-slate-300">
        {events.length === 0 && (
          <li className="text-slate-600">No events yet.</li>
        )}
        {events.map((e) => (
          <li key={e.id} className="flex gap-3">
            <span className="text-slate-500">
              {new Date(e.timestamp).toLocaleTimeString()}
            </span>
            <span className="text-emerald-400">{e.action}</span>
            <span className="truncate text-slate-500">
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
