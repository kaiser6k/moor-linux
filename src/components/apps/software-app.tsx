import { useMemo, useState } from "react";
import { APP_IDS, APP_META, CATEGORIES, type AppCategory, type AppId } from "@/lib/apps";
import { APP_ICONS } from "@/lib/icons";
import { useMoor } from "@/lib/store";

export function SoftwareApp() {
  const openApp = useMoor((s) => s.openApp);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<AppCategory | "all">("all");
  const apps = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return APP_IDS.filter((id) => {
      const meta = APP_META[id];
      if (id === "software") return false;
      if (cat !== "all" && meta.category !== cat) return false;
      if (!needle) return true;
      return meta.title.toLowerCase().includes(needle) || meta.blurb.toLowerCase().includes(needle);
    });
  }, [q, cat]);

  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="border-b border-border px-4 py-3">
        <h1 className="text-lg font-semibold">Software</h1>
        <p className="mt-1 text-xs text-muted">Everything that ships with Moor Linux.</p>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search applications"
          className="mt-3 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <div className="mt-3 flex flex-wrap gap-1">
          <Chip active={cat === "all"} onClick={() => setCat("all")} label="All" />
          {CATEGORIES.map((c) => (
            <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)} label={c.label} />
          ))}
        </div>
      </div>
      <ul className="grid grid-cols-1 gap-2 overflow-auto p-4 sm:grid-cols-2">
        {apps.map((id) => (
          <AppRow key={id} id={id} onOpen={() => openApp(id)} />
        ))}
      </ul>
    </div>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs ${active ? "bg-primary text-crust" : "bg-overlay text-muted"}`}
    >
      {label}
    </button>
  );
}

function AppRow({ id, onOpen }: { id: AppId; onOpen: () => void }) {
  const meta = APP_META[id];
  const Icon = APP_ICONS[id];
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 rounded-md border border-border bg-surface px-3 py-3 text-left hover:border-primary/50"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-overlay">
          <Icon className="size-5 text-primary" strokeWidth={1.7} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{meta.title}</span>
          <span className="block truncate text-xs text-muted">{meta.blurb}</span>
        </span>
      </button>
    </li>
  );
}
