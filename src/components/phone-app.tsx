import { useState } from "react";
import { Anchor, Home, Info, Monitor } from "lucide-react";
import { BmcButton } from "@/components/bmc-button";
import { GITHUB_URL } from "@/lib/apps";
import { displayLabel, requestExternalDisplay } from "@/lib/display";
import { useMoor } from "@/lib/store";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "home", label: "Home", icon: Home },
  { id: "display", label: "Display", icon: Monitor },
  { id: "session", label: "Session", icon: Anchor },
  { id: "about", label: "About", icon: Info },
] as const;

export function PhoneApp({ displayReady }: { displayReady: boolean }) {
  const tab = useMoor((s) => s.phoneTab);
  const setPhoneTab = useMoor((s) => s.setPhoneTab);
  const startSession = useMoor((s) => s.startSession);

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-crust text-fg">
      <main className="flex-1 overflow-auto px-5 pb-28 pt-12">
        {tab === "home" ? <HomeTab displayReady={displayReady} onStart={startSession} /> : null}
        {tab === "display" ? <DisplayTab displayReady={displayReady} onStart={startSession} /> : null}
        {tab === "session" ? <SessionTab onStart={startSession} /> : null}
        {tab === "about" ? <AboutTab /> : null}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-lg px-4 pb-4">
        <ul className="flex justify-around rounded-xl border border-border bg-surface/80 px-2 py-2 backdrop-blur-xl">
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setPhoneTab(item.id)}
                  className={cn(
                    "flex min-w-16 flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs",
                    active ? "text-primary" : "text-muted",
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.8} />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function HomeTab({ displayReady, onStart }: { displayReady: boolean; onStart: () => void }) {
  return (
    <div className="moor-in">
      <p className="text-xs font-medium tracking-widest text-primary uppercase">Moor</p>
      <h1 className="mt-2 text-4xl font-semibold leading-tight">
        Plug in a display.
        <br />
        Wake Linux.
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        The Linux desktop for a docked iPhone. Connect USB-C to a monitor, then start a session. Save files onto the
        phone from Files.
      </p>
      <div
        className={cn(
          "mt-6 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
          displayReady ? "border-primary/40 text-primary" : "border-border text-muted",
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", displayReady ? "bg-primary" : "bg-muted moor-breathe")} />
        {displayReady ? "Display ready" : "Waiting for a display"}
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <img src="/brand/dock-hero.jpg" alt="iPhone connected to a desktop monitor" className="aspect-video w-full object-cover" />
      </div>
      <button
        type="button"
        onClick={onStart}
        className="mt-6 w-full rounded-lg bg-primary py-3.5 text-sm font-semibold text-crust"
      >
        Start Linux session
      </button>
      <ol className="mt-8 space-y-4">
        {[
          "Add Moor to the Home Screen",
          "Plug USB-C into a monitor or dock",
          "Open Moor and start the session",
        ].map((step, i) => (
          <li key={step} className="flex gap-3 text-sm">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-overlay text-xs text-primary">
              {i + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function DisplayTab({ displayReady, onStart }: { displayReady: boolean; onStart: () => void }) {
  const [note, setNote] = useState<string | null>(null);
  const w = typeof window !== "undefined" ? window.innerWidth : 390;
  const h = typeof window !== "undefined" ? window.innerHeight : 844;

  return (
    <div className="moor-in">
      <h1 className="text-3xl font-semibold">Display</h1>
      <p className="mt-2 text-sm text-muted">Moor watches the viewport and, where the browser allows, a second screen.</p>
      <article className="mt-6 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <Monitor className="size-5 text-primary" />
          <div>
            <p className="text-sm font-medium">{displayLabel(w, h)}</p>
            <p className="text-xs text-muted">
              {w} × {h}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="mt-4 w-full rounded-md bg-overlay py-2 text-sm"
          onClick={async () => {
            const result = await requestExternalDisplay();
            setNote(
              result === "unavailable"
                ? "This browser kept the session here."
                : "Opened on the external display if the browser allowed it.",
            );
          }}
        >
          Request external display
        </button>
        {note ? <p className="mt-2 text-xs text-muted">{note}</p> : null}
        {displayReady ? (
          <button
            type="button"
            onClick={onStart}
            className="mt-3 w-full rounded-md bg-primary py-2 text-sm font-semibold text-crust"
          >
            Start on this display
          </button>
        ) : null}
      </article>
    </div>
  );
}

function SessionTab({ onStart }: { onStart: () => void }) {
  return (
    <div className="moor-in">
      <h1 className="text-3xl font-semibold">Session</h1>
      <p className="mt-2 text-sm text-muted">Shortcuts once the desktop is up.</p>
      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between rounded-lg bg-surface px-3 py-3">
          <dt>Launcher</dt>
          <dd className="text-muted">Super</dd>
        </div>
        <div className="flex justify-between rounded-lg bg-surface px-3 py-3">
          <dt>Terminal</dt>
          <dd className="text-muted">Ctrl+Alt+T</dd>
        </div>
        <div className="flex justify-between rounded-lg bg-surface px-3 py-3">
          <dt>Close launcher</dt>
          <dd className="text-muted">Esc</dd>
        </div>
      </dl>
      <button
        type="button"
        onClick={onStart}
        className="mt-6 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-crust"
      >
        Start Linux session
      </button>
    </div>
  );
}

function AboutTab() {
  return (
    <div className="moor-in">
      <h1 className="text-3xl font-semibold">About</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Moor is Linux-on-the-display for iPhone — the idea behind Linux on DeX, built as an app you can actually run.
        Plug into HDMI, add it to the Home Screen, start a session.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Apple does not let a third-party app replace iOS at the kernel when a cable is plugged in. Moor runs a full
        Linux userspace in the browser and fills whatever display you give it.
      </p>
      <ul className="mt-6 space-y-2 text-sm">
        <li className="rounded-lg bg-surface px-3 py-3">Full distro apps — Software, Files, Terminal, Photos, Writer</li>
        <li className="rounded-lg bg-surface px-3 py-3">Save to phone via the iOS share sheet</li>
        <li className="rounded-lg bg-surface px-3 py-3">Free and open source on GitHub</li>
      </ul>
      <div className="mt-6">
        <BmcButton />
      </div>
      <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="mt-6 inline-block text-sm text-primary">
        github.com/kaiser6k/moor-linux
      </a>
    </div>
  );
}
