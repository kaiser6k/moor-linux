import { useEffect, useState } from "react";
import { Battery, Wifi, Volume2 } from "lucide-react";
import { useMoor } from "@/lib/store";
import { displayLabel } from "@/lib/display";

export function TopBar({ compact }: { compact: boolean }) {
  const launcherOpen = useMoor((s) => s.launcherOpen);
  const setLauncherOpen = useMoor((s) => s.setLauncherOpen);
  const endSession = useMoor((s) => s.endSession);
  const [clock, setClock] = useState("");
  const [sizeLabel, setSizeLabel] = useState("Display");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      const date = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
      setClock(compact ? time : `${date} · ${time}`);
    };
    const measure = () => setSizeLabel(displayLabel(window.innerWidth, window.innerHeight));
    tick();
    measure();
    const t = setInterval(tick, 1000);
    window.addEventListener("resize", measure);
    return () => {
      clearInterval(t);
      window.removeEventListener("resize", measure);
    };
  }, [compact]);

  return (
    <header className="relative z-40 flex h-8 items-center justify-between gap-2 bg-crust/80 px-3 text-xs text-fg backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setLauncherOpen(!launcherOpen)}
          className="rounded-sm px-2 py-0.5 font-medium hover:bg-overlay"
        >
          Activities
        </button>
        {compact ? null : <span className="hidden truncate text-muted lg:inline">{sizeLabel}</span>}
      </div>
      <p className="shrink-0 font-medium">{clock || "Moor"}</p>
      <div className="flex shrink-0 items-center gap-3 text-muted">
        {compact ? null : (
          <>
            <Wifi className="size-3.5" strokeWidth={2} />
            <Volume2 className="size-3.5" strokeWidth={2} />
            <span className="inline-flex items-center gap-1">
              <Battery className="size-3.5" strokeWidth={2} />
              <span>iPhone</span>
            </span>
          </>
        )}
        {compact ? (
          <button type="button" onClick={endSession} className="rounded-sm px-2 py-0.5 text-fg hover:bg-overlay">
            Undock
          </button>
        ) : null}
      </div>
    </header>
  );
}
