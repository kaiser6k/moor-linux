import { useState } from "react";
import { useMoor } from "@/lib/store";

export function BrowserApp() {
  const openApp = useMoor((s) => s.openApp);
  const [url, setUrl] = useState("moor://start");

  return (
    <div className="flex h-full flex-col bg-bg">
      <form
        className="border-b border-border p-2"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-label="Address"
          className="w-full rounded-sm bg-overlay px-3 py-1.5 text-sm outline-none"
        />
      </form>
      <div className="min-h-0 flex-1 overflow-auto p-6">
        <p className="text-xs tracking-widest text-primary uppercase">Moor Start</p>
        <h1 className="mt-2 text-2xl font-semibold">Local session</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
          Networking stays on the phone. This browser is the session start page — files, terminal, and
          settings live on the docked display.
        </p>
        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {[
            { href: "moor://terminal", label: "Terminal", action: () => openApp("terminal") },
            { href: "moor://files", label: "Files", action: () => openApp("files") },
            { href: "moor://docs", label: "welcome.md", action: () => openApp("editor", "/home/moor/Documents/welcome.md") },
            { href: "moor://settings", label: "Settings", action: () => openApp("settings") },
          ].map((link) => (
            <li key={link.href}>
              <button
                type="button"
                onClick={link.action}
                className="w-full rounded-md border border-border bg-surface px-3 py-3 text-left text-sm hover:border-primary/50"
              >
                {link.label}
                <span className="mt-1 block text-xs text-muted">{link.href}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
