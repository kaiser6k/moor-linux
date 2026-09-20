import { Folder, Grid2x2, SquareTerminal } from "lucide-react";
import { BmcButton } from "@/components/bmc-button";
import { DISCORD_URL, GITHUB_URL } from "@/lib/apps";
import { useMoor } from "@/lib/store";

export function WelcomeApp() {
  const openApp = useMoor((s) => s.openApp);
  return (
    <div className="flex h-full flex-col bg-bg p-6">
      <p className="text-xs font-medium tracking-widest text-primary uppercase">Moor Linux 1.3</p>
      <h1 className="mt-2 text-2xl font-semibold">You're docked.</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        DeX-style desktop on the display. Debian in the dock for real apt, gcc, python, and bash. Save files onto the
        phone from Files. Signed in as a regular user — not root.
      </p>
      <ul className="mt-6 space-y-2">
        {[
          { id: "linux" as const, icon: SquareTerminal, label: "Debian", hint: "apt, gcc, python" },
          { id: "software" as const, icon: Grid2x2, label: "Software", hint: "Desktop applications" },
          { id: "files" as const, icon: Folder, label: "Files", hint: "Import · save to phone" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => openApp(item.id)}
                className="flex w-full items-center gap-3 rounded-md border border-border bg-surface px-3 py-3 text-left hover:border-primary/50"
              >
                <Icon className="size-4 text-primary" />
                <span className="flex-1 text-sm font-medium">{item.label}</span>
                <span className="text-xs text-muted">{item.hint}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto space-y-3 pt-6">
        <BmcButton />
        <p className="text-xs text-muted">
          Free source:{" "}
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-primary">
            GitHub
          </a>
          . Discord:{" "}
          <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="text-primary">
            discord.gg/CNRYnGBayu
          </a>
          . Super opens the launcher.
        </p>
      </div>
    </div>
  );
}
