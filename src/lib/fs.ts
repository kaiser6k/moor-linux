import { DEFAULT_USERS, groupText, passwdText } from "./users";

export type FsFile = { kind: "file"; content: string };
export type FsDir = { kind: "dir"; children: Record<string, FsNode> };
export type FsNode = FsFile | FsDir;

export const HOME = "/home/moor";

const WELCOME_MD = `# Welcome to Moor Linux

You docked your iPhone. This is the Linux session that comes up
on the display.

## Try this
- Open **Software** for every app on this distro
- Open **Files** and tap **Save to phone** to keep a copy in iOS Files
- Import photos, music, or documents from the phone
- Open **Terminal** and run \`neofetch\`

## What this is
Moor is a Linux *userspace* for a docked iPhone display — terminal,
files, windows, the session you would expect from Linux on DeX.

Apple does not let a third-party app replace iOS at the kernel
when HDMI is plugged in. Moor runs the workstation in the browser
and fills the display you give it.

Source is free on GitHub: https://github.com/kaiser6k/moor-linux
`;

const DISPLAY_NOTES = `Connecting a display
====================

iPhone 15 and later — USB-C
  1. Add Moor to the Home Screen (Share → Add to Home Screen)
  2. Plug USB-C into an HDMI adapter, dock, or monitor
  3. Open Moor
  4. Tap Start Linux session

Saving files onto the phone
  Files → select a file → Save to phone
  iOS shows the share sheet: Save to Files, Photos, or AirDrop.

Importing
  Files → Import from phone
  Photos / Music / Videos have their own Import buttons.
`;

const OS_RELEASE = `NAME="Moor Linux"
PRETTY_NAME="Moor Linux 1.1 (Docked)"
ID=moor
VERSION_ID=1.1
HOME_URL="https://github.com/kaiser6k/moor-linux"
`;

export function createDefaultFs(): FsDir {
  return {
    kind: "dir",
    children: {
      home: {
        kind: "dir",
        children: {
          moor: {
            kind: "dir",
            children: {
              Desktop: {
                kind: "dir",
                children: {
                  "Read me.txt": {
                    kind: "file",
                    content: "This desktop lives on the display your iPhone is plugged into.\n",
                  },
                },
              },
              Documents: {
                kind: "dir",
                children: {
                  "welcome.md": { kind: "file", content: WELCOME_MD },
                  "display-notes.txt": { kind: "file", content: DISPLAY_NOTES },
                },
              },
              Downloads: { kind: "dir", children: {} },
              Pictures: {
                kind: "dir",
                children: {
                  "wallpaper.txt": {
                    kind: "file",
                    content: "Fjord Night is the default wallpaper. Switch it in Settings.\n",
                  },
                },
              },
              Music: { kind: "dir", children: {} },
              Videos: { kind: "dir", children: {} },
              Notes: {
                kind: "dir",
                children: {
                  "getting-started.txt": {
                    kind: "file",
                    content: "Notes live here. They persist on this phone.\nUse Save to phone in Files to copy them into iOS Files.\n",
                  },
                },
              },
              Templates: {
                kind: "dir",
                children: {
                  "letter.txt": {
                    kind: "file",
                    content: "Dear ,\n\n\n\nYours,\n",
                  },
                },
              },
            },
          },
        },
      },
      root: {
        kind: "dir",
        children: {
          ".profile": {
            kind: "file",
            content: "# root home — use su / sudo, don't stay here.\n",
          },
        },
      },
      tmp: { kind: "dir", children: {} },
      etc: {
        kind: "dir",
        children: {
          hostname: { kind: "file", content: "iphone\n" },
          "os-release": { kind: "file", content: OS_RELEASE },
          passwd: { kind: "file", content: passwdText(DEFAULT_USERS) },
          group: { kind: "file", content: groupText(DEFAULT_USERS) },
          sudoers: {
            kind: "file",
            content: "root ALL=(ALL) ALL\n%sudo ALL=(ALL) NOPASSWD: ALL\n",
          },
          motd: {
            kind: "file",
            content: "Moor Linux 1.3 — DeX desktop + Debian userspace. Type `linux` or `help`.\n",
          },
        },
      },
      usr: {
        kind: "dir",
        children: {
          share: {
            kind: "dir",
            children: {
              fortunes: {
                kind: "file",
                content: [
                  "A ship in harbor is safe, but that is not what ships are built for.",
                  "Dock the phone. Free the machine.",
                  "The best external GPU is a display and a keyboard.",
                  "Userspace is a place, not a compromise.",
                  "Linux on DeX, without the DeX.",
                  "Save to Files. That is the whole trick.",
                ].join("\n"),
              },
            },
          },
        },
      },
      var: {
        kind: "dir",
        children: {
          log: {
            kind: "dir",
            children: {
              "session.log": {
                kind: "file",
                content: "moor-sessiond: display HDMI-1 ready\nmoor-sessiond: launched desktop shell\n",
              },
            },
          },
        },
      },
    },
  };
}

export const STANDARD_DIRS = [
  `${HOME}/Desktop`,
  `${HOME}/Documents`,
  `${HOME}/Downloads`,
  `${HOME}/Pictures`,
  `${HOME}/Music`,
  `${HOME}/Videos`,
  `${HOME}/Notes`,
  `${HOME}/Templates`,
  "/root",
  "/tmp",
];

export function migrateFs(root: FsDir): FsDir {
  const next = cloneFs(root);
  for (const dir of STANDARD_DIRS) mkdirp(next, dir);
  return next;
}

export function normalizePath(path: string): string {
  const parts: string[] = [];
  for (const part of path.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return "/" + parts.join("/");
}

export function resolvePath(cwd: string, input?: string, home = HOME): string {
  if (!input || input === "~") return home;
  if (input.startsWith("~/")) return normalizePath(`${home}/${input.slice(2)}`);
  if (input.startsWith("/")) return normalizePath(input);
  return normalizePath(`${cwd}/${input}`);
}

export function getNode(root: FsDir, path: string): FsNode | null {
  const norm = normalizePath(path);
  if (norm === "/") return root;
  let dir: FsDir = root;
  const parts = norm.split("/").filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    const child: FsNode | undefined = dir.children[parts[i] ?? ""];
    if (!child) return null;
    if (i === parts.length - 1) return child;
    if (child.kind !== "dir") return null;
    dir = child;
  }
  return root;
}

export function parentPath(path: string): string {
  const norm = normalizePath(path);
  const idx = norm.lastIndexOf("/");
  return idx <= 0 ? "/" : norm.slice(0, idx);
}

export function baseName(path: string): string {
  const norm = normalizePath(path);
  if (norm === "/") return "/";
  return norm.split("/").filter(Boolean).pop() ?? "/";
}

function ensureDir(root: FsDir, path: string): FsDir | null {
  const norm = normalizePath(path);
  if (norm === "/") return root;
  let node: FsDir = root;
  for (const part of norm.split("/").filter(Boolean)) {
    const next = node.children[part];
    if (!next) {
      const dir: FsDir = { kind: "dir", children: {} };
      node.children[part] = dir;
      node = dir;
      continue;
    }
    if (next.kind !== "dir") return null;
    node = next;
  }
  return node;
}

export function writeFile(root: FsDir, path: string, content: string): boolean {
  const dir = ensureDir(root, parentPath(path));
  if (!dir) return false;
  const name = baseName(path);
  dir.children[name] = { kind: "file", content };
  return true;
}

export function mkdirp(root: FsDir, path: string): boolean {
  return ensureDir(root, path) !== null;
}

export function removePath(root: FsDir, path: string): boolean {
  const parent = getNode(root, parentPath(path));
  if (!parent || parent.kind !== "dir") return false;
  const name = baseName(path);
  if (!(name in parent.children)) return false;
  delete parent.children[name];
  return true;
}

export function listDir(root: FsDir, path: string): { name: string; node: FsNode }[] | null {
  const node = getNode(root, path);
  if (!node || node.kind !== "dir") return null;
  return Object.entries(node.children)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, child]) => ({ name, node: child }));
}

export function cloneFs(node: FsDir): FsDir {
  return structuredClone(node);
}

export function walkFiles(root: FsDir, path = "/"): { path: string; content: string }[] {
  const node = getNode(root, path);
  if (!node) return [];
  if (node.kind === "file") return [{ path, content: node.content }];
  const out: { path: string; content: string }[] = [];
  for (const [name, child] of Object.entries(node.children)) {
    const next = path === "/" ? `/${name}` : `${path}/${name}`;
    if (child.kind === "file") out.push({ path: next, content: child.content });
    else out.push(...walkFiles(root, next));
  }
  return out;
}

export function nodeSize(node: FsNode): number {
  if (node.kind === "file") return node.content.length;
  return Object.values(node.children).reduce((sum, child) => sum + nodeSize(child), 0);
}
