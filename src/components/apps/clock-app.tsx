import { useEffect, useState } from "react";
import { AppShell, BarBtn } from "@/components/app-shell";

const ZONES = [
  { id: "local", label: "Here", tz: undefined as string | undefined },
  { id: "utc", label: "UTC", tz: "UTC" },
  { id: "ny", label: "New York", tz: "America/New_York" },
  { id: "london", label: "London", tz: "Europe/London" },
  { id: "tokyo", label: "Tokyo", tz: "Asia/Tokyo" },
];

function nowIn(tz?: string) {
  return new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: tz });
}

export function ClockApp() {
  const [, setTick] = useState(0);
  const [tab, setTab] = useState<"world" | "timer" | "watch">("world");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [watch, setWatch] = useState(0);
  const [watching, setWatching] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((n) => n + 1);
      if (running) setSeconds((s) => Math.max(0, s - 1));
      if (watching) setWatch((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, watching]);

  return (
    <AppShell
      bar={
        <>
          {(["world", "timer", "watch"] as const).map((t) => (
            <BarBtn key={t} onClick={() => setTab(t)}>
              {t === "world" ? "World" : t === "timer" ? "Timer" : "Stopwatch"}
            </BarBtn>
          ))}
        </>
      }
    >
      {tab === "world" ? (
        <ul className="space-y-2 p-4">
          {ZONES.map((z) => (
            <li key={z.id} className="flex items-baseline justify-between rounded-md bg-surface px-4 py-3">
              <span className="text-sm">{z.label}</span>
              <span className="font-mono text-lg tabular-nums">{nowIn(z.tz)}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {tab === "timer" ? (
        <div className="flex flex-col items-center gap-4 p-8">
          <p className="font-mono text-5xl tabular-nums">{fmt(seconds)}</p>
          <div className="flex gap-2">
            <BarBtn onClick={() => setSeconds((s) => s + 60)}>+1 min</BarBtn>
            <BarBtn onClick={() => setRunning((v) => !v)}>{running ? "Pause" : "Start"}</BarBtn>
            <BarBtn onClick={() => { setRunning(false); setSeconds(0); }}>Reset</BarBtn>
          </div>
        </div>
      ) : null}
      {tab === "watch" ? (
        <div className="flex flex-col items-center gap-4 p-8">
          <p className="font-mono text-5xl tabular-nums">{fmt(watch)}</p>
          <div className="flex gap-2">
            <BarBtn onClick={() => setWatching((v) => !v)}>{watching ? "Stop" : "Start"}</BarBtn>
            <BarBtn onClick={() => { setWatching(false); setWatch(0); }}>Reset</BarBtn>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

function fmt(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
