import { insertLog, type LogType } from "@/lib/logs.functions";

const KEY = "aura.offlineQueue.v1";

type Queued = { id: string; type: LogType; payload: Record<string, unknown>; log_date?: string };

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function read(): Queued[] {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}
function write(items: Queued[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("aura:queue-changed", { detail: items.length }));
}

export function queueCount(): number {
  return read().length;
}

export function enqueue(item: Omit<Queued, "id">): void {
  if (!isBrowser()) return;
  const q = read();
  q.push({ ...item, id: newId() });
  write(q);
}

export async function insertLogWithQueue(data: Omit<Queued, "id">): Promise<{ queued: boolean }> {
  const isOnline = typeof navigator === "undefined" ? true : navigator.onLine;
  if (!isOnline) {
    enqueue(data);
    return { queued: true };
  }
  try {
    await insertLog({ data });
    return { queued: false };
  } catch {
    enqueue(data);
    return { queued: true };
  }
}

export async function flushQueue(): Promise<number> {
  if (!isBrowser()) return 0;
  const items = read();
  if (!items.length) return 0;
  const remaining: Queued[] = [];
  for (const it of items) {
    try {
      await insertLog({
        data: {
          type: it.type,
          payload: it.payload as Record<string, unknown>,
          log_date: it.log_date,
        },
      });
    } catch {
      remaining.push(it);
    }
  }
  write(remaining);
  return items.length - remaining.length;
}
