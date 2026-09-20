import { BmcButton } from "@/components/bmc-button";
import { DISCORD_URL, DOCS_URL, GITHUB_URL } from "@/lib/apps";

const SECTIONS = [
  {
    title: "Docked session (DeX)",
    body: "Add Moor to the Home Screen, plug USB-C into a display, start a session. Floating windows, dock, and Activities are the DeX-style desktop. iOS stays underneath — Apple does not let an app replace the kernel.",
  },
  {
    title: "Debian userspace (Ubuntu-class)",
    body: "Open Debian from the dock, then Launch Debian. That window is a real x86 Debian machine in WebAssembly: bash, apt, gcc, python, vim. First boot downloads the disk and keeps your changes in this browser.",
  },
  {
    title: "Save onto the phone",
    body: "Files → select a file → Save to phone. iOS opens the share sheet so you can Save to Files, Photos, or AirDrop. Photos, Writer, Paint, and Sheets have the same action.",
  },
  {
    title: "Import from the phone",
    body: "Files, Photos, Music, and Videos can import from the camera roll and Files app. Imports live in this session (IndexedDB) until you save them out.",
  },
  {
    title: "Host your own",
    body: "Moor is MIT. Clone the GitHub repo, copy env.example to .env, npm install, npm run dev — or docker compose up. HTTPS in front if you want it on an iPhone Home Screen.",
  },
];

export function HelpApp() {
  return (
    <div className="h-full overflow-auto bg-bg p-5">
      <p className="text-xs font-medium tracking-widest text-primary uppercase">Moor Linux 1.3</p>
      <h1 className="mt-2 text-2xl font-semibold">Help</h1>
      <ul className="mt-6 space-y-4">
        {SECTIONS.map((s) => (
          <li key={s.title}>
            <h2 className="text-sm font-medium">{s.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{s.body}</p>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <BmcButton />
      </div>
      <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm text-primary">
        Source on GitHub — free for everyone
      </a>
      <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="mt-2 block text-sm text-primary">
        Discord
      </a>
      <a href={DOCS_URL} target="_blank" rel="noreferrer" className="mt-2 block text-sm text-primary">
        Set up your own instance
      </a>
    </div>
  );
}
