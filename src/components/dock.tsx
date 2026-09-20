import { APP_META, type AppId } from "@/lib/apps";
import { APP_ICONS, LAUNCHER_ICON } from "@/lib/icons";
import { useMoor } from "@/lib/store";
import { cn } from "@/lib/utils";

const DOCK_APPS: { id: AppId | "launcher"; label: string }[] = [
  { id: "launcher", label: "Launcher" },
  { id: "files", label: APP_META.files.title },
  { id: "terminal", label: APP_META.terminal.title },
  { id: "browser", label: APP_META.browser.title },
  { id: "software", label: APP_META.software.title },
  { id: "settings", label: APP_META.settings.title },
];

export function Dock() {
  const windows = useMoor((s) => s.windows);
  const focusedId = useMoor((s) => s.focusedId);
  const openApp = useMoor((s) => s.openApp);
  const focusWindow = useMoor((s) => s.focusWindow);
  const setLauncherOpen = useMoor((s) => s.setLauncherOpen);
  const launcherOpen = useMoor((s) => s.launcherOpen);

  return (
    <nav aria-label="Dock" className="pointer-events-none absolute inset-x-0 bottom-3 z-40 flex justify-center px-3">
      <ul className="pointer-events-auto flex items-end gap-1 rounded-xl border border-border/80 bg-surface/80 p-2 shadow-lg backdrop-blur-xl">
        {DOCK_APPS.map((app) => {
          const running = app.id === "launcher" ? launcherOpen : windows.some((w) => w.appId === app.id);
          const focused = app.id !== "launcher" && windows.find((w) => w.id === focusedId)?.appId === app.id;
          const Icon = app.id === "launcher" ? LAUNCHER_ICON : APP_ICONS[app.id];
          return (
            <li key={app.id}>
              <button
                type="button"
                title={app.label}
                aria-label={app.label}
                onClick={() => {
                  if (app.id === "launcher") {
                    setLauncherOpen(!launcherOpen);
                    return;
                  }
                  const existing = windows.find((w) => w.appId === app.id && !w.minimized);
                  const minimized = windows.find((w) => w.appId === app.id && w.minimized);
                  if (existing) focusWindow(existing.id);
                  else if (minimized) focusWindow(minimized.id);
                  else openApp(app.id);
                }}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-lg text-fg transition-transform",
                  focused ? "bg-overlay" : "bg-overlay/40 hover:bg-overlay",
                )}
              >
                <span className="relative">
                  <Icon className="size-5" strokeWidth={1.8} />
                  {running ? (
                    <span className="absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
