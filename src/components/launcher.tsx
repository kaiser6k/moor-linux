import { useMemo, useState } from "react";
import { APP_IDS, APP_META, CATEGORIES, type AppCategory } from "@/lib/apps";
import { APP_ICONS } from "@/lib/icons";
import { useMoor } from "@/lib/store";

export function Launcher() {
  const openApp = useMoor((s) => s.openApp);
  const setLauncherOpen = useMoor((s) => s.setLauncherOpen);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<AppCategory | "all">("all");
  const apps = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return APP_IDS.filter((id) => {
      const meta = APP_META[id];
      if (cat !== "all" && meta.category !== cat) return false;
      if (!needle) return true;
      return meta.title.toLowerCase().includes(needle) || meta.blurb.toLowerCase().includes(needle);
    });
  }, [q, cat]);

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-crust/70 p-4 backdrop-blur-md"
      onClick={() => setLauncherOpen(false)}
    >
      <div
        className="flex max-h-[min(620px,80dvh)] w-full max-w-2xl flex-col rounded-xl border border-border bg-surface/90 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search applications"
          className="rounded-md border border-border bg-crust px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <div className="mt-3 flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setCat("all")}
            className={`rounded-full px-3 py-1 text-xs ${cat === "all" ? "bg-primary text-crust" : "bg-overlay text-muted"}`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              className={`rounded-full px-3 py-1 text-xs ${cat === c.id ? "bg-primary text-crust" : "bg-overlay text-muted"}`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <ul className="mt-3 grid grid-cols-3 gap-2 overflow-auto sm:grid-cols-4">
          {apps.map((id) => {
            const Icon = APP_ICONS[id];
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => openApp(id)}
                  className="flex w-full flex-col items-center gap-2 rounded-lg p-3 text-fg hover:bg-overlay"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-bg">
                    <Icon className="size-6" strokeWidth={1.7} />
                  </span>
                  <span className="text-center text-xs font-medium">{APP_META[id].title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
