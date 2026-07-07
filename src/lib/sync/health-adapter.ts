// Mock health platform adapter. Real HealthKit / Health Connect bridges
// would replace `mockAdapter` on native shells.

export type SyncMetric = "steps" | "floors" | "sleep";
export type SyncEntry = {
  source: "apple" | "google" | "mock";
  metric: SyncMetric;
  value: Record<string, unknown>;
};

export interface HealthAdapter {
  name: "apple" | "google" | "mock";
  sync(): Promise<SyncEntry[]>;
}

function jitter(base: number, spread: number) {
  return Math.round(base + (Math.random() - 0.5) * spread);
}

export const mockAdapter: HealthAdapter = {
  name: "mock",
  async sync() {
    await new Promise((r) => setTimeout(r, 900));
    const steps = jitter(8200, 3000);
    const floors = jitter(14, 10);
    const total = 6 + Math.random() * 2.5;
    const deep = +(total * 0.22).toFixed(2);
    const light = +(total * 0.55).toFixed(2);
    const rem = +(total * 0.23).toFixed(2);
    return [
      { source: "mock", metric: "steps", value: { total: steps } },
      { source: "mock", metric: "floors", value: { total: floors } },
      {
        source: "mock",
        metric: "sleep",
        value: { hours: +total.toFixed(2), deep, light, rem, wake: "07:12" },
      },
    ];
  },
};

export function pickAdapter(): HealthAdapter {
  // Placeholder: real detection would probe navigator.userAgent or a native bridge.
  return mockAdapter;
}
