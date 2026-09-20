import { useEffect, useState } from "react";
import { Battery, Wifi, Volume2 } from "lucide-react";
import { useMoor } from "@/lib/store";
import { displayLabel } from "@/lib/display";
import { cn } from "@/lib/utils";

export function TopBar({ compact }: { compact: boolean }) {
  const launcherOpen = useMoor((s) => s.launcherOpen);
  const setLauncherOpen = useMoor((s) => s.setLauncherOpen);
  const endSession = useMoor((s) => s.endSession);
  const currentUser = useMoor((s) => s.currentUser);
  const users = useMoor((s) => s.users);
  const switchUser = useMoor((s) => s.switchUser);
  const lockSession = useMoor((s) => s.lockSession);
  const openApp = useMoor((s) => s.openApp);
  const [clock, setClock] = useState("");
  const [sizeLabel, setSizeLabel] = useState("Display");
  const [menu, setMenu] = useState(false);
  const me = users.find((u) => u.name === currentUser);
  const rootish = me?.uid === 0;

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
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenu((v) => !v)}
            className={cn("rounded-sm px-2 py-0.5 font-medium hover:bg-overlay", rootish ? "text-warn" : "text-fg")}
          >
            {currentUser}
          </button>
          {menu ? (
            <div className="absolute top-7 right-0 z-50 w-44 rounded-md border border-border bg-surface py-1 shadow-lg">
              {users.map((u) => (
                <button
                  key={u.name}
                  type="button"
                  className="block w-full px-3 py-1.5 text-left text-xs text-fg hover:bg-overlay"
                  onClick={() => {
                    const result = switchUser(u.name);
                    setMenu(false);
                    if (!result.ok) openApp("users");
                  }}
                >
                  {u.name === currentUser ? "• " : "  "}
                  {u.name}
                  {u.uid === 0 ? " (root)" : ""}
                </button>
              ))}
              <button
                type="button"
                className="block w-full px-3 py-1.5 text-left text-xs text-fg hover:bg-overlay"
                onClick={() => {
                  openApp("users");
                  setMenu(false);
                }}
              >
                Users & groups
              </button>
              <button
                type="button"
                className="block w-full px-3 py-1.5 text-left text-xs text-fg hover:bg-overlay"
                onClick={() => {
                  lockSession();
                  setMenu(false);
                }}
              >
                Lock
              </button>
              {compact ? (
                <button
                  type="button"
                  className="block w-full px-3 py-1.5 text-left text-xs text-fg hover:bg-overlay"
                  onClick={() => {
                    endSession();
                    setMenu(false);
                  }}
                >
                  Undock
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        {compact && !menu ? (
          <button type="button" onClick={endSession} className="rounded-sm px-2 py-0.5 text-fg hover:bg-overlay">
            Undock
          </button>
        ) : null}
      </div>
    </header>
  );
}