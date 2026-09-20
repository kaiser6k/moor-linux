import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

function series(seed: number) {
  return Array.from({ length: 24 }, (_, i) => ({
    t: i,
    v: 18 + Math.abs(Math.sin(seed + i / 2.4) * 28) + (i % 5),
  }));
}

export function MonitorApp() {
  const [cpu, setCpu] = useState(() => series(1));
  const [mem] = useState(() => series(4));

  useEffect(() => {
    const t = setInterval(() => {
      setCpu((prev) => {
        const next = prev.slice(1);
        const last = next[next.length - 1]?.v ?? 30;
        next.push({ t: (prev[prev.length - 1]?.t ?? 0) + 1, v: Math.max(8, Math.min(86, last + (Math.random() * 14 - 7))) });
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const cpuNow = Math.round(cpu[cpu.length - 1]?.v ?? 0);
  const memNow = 21;

  return (
    <div className="h-full overflow-auto bg-bg p-5">
      <h1 className="text-lg font-semibold">Monitor</h1>
      <p className="mt-1 text-sm text-muted">Session on the docked display</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <article className="rounded-md border border-border bg-surface p-3">
          <div className="flex justify-between text-sm">
            <h2>CPU</h2>
            <p className="text-primary">{cpuNow}%</p>
          </div>
          <div className="mt-2 h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cpu}>
                <Area type="monotone" dataKey="v" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="rounded-md border border-border bg-surface p-3">
          <div className="flex justify-between text-sm">
            <h2>Memory</h2>
            <p className="text-primary">{memNow}%</p>
          </div>
          <div className="mt-2 h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mem}>
                <Area type="monotone" dataKey="v" stroke="var(--color-ok)" fill="var(--color-ok)" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md border border-border px-3 py-2">
          <dt className="text-xs text-muted">Display</dt>
          <dd>HDMI-1</dd>
        </div>
        <div className="rounded-md border border-border px-3 py-2">
          <dt className="text-xs text-muted">Host</dt>
          <dd>iPhone</dd>
        </div>
      </dl>
    </div>
  );
}
