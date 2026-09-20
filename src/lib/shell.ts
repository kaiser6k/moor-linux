import type { AppId } from "./apps";
import {
  baseName,
  getNode,
  HOME,
  listDir,
  mkdirp,
  parentPath,
  removePath,
  resolvePath,
  type FsDir,
  writeFile,
} from "./fs";

export type Chunk = { t: string; c?: "p" | "m" | "d" | "o" | "f" | "w" };

export type ShellAction =
  | { type: "open"; appId: AppId; path?: string }
  | { type: "reboot" }
  | { type: "exit" };

export type ShellResult = {
  chunks: Chunk[];
  cwd?: string;
  clear?: boolean;
  action?: ShellAction;
};

export type ShellCtx = {
  cwd: string;
  fs: FsDir;
  history: string[];
  hostname?: string;
  user?: string;
  image?: string;
  pids?: { pid: number; cmd: string }[];
};

const COMMANDS = [
  "help",
  "clear",
  "ls",
  "cd",
  "pwd",
  "cat",
  "echo",
  "mkdir",
  "touch",
  "rm",
  "tree",
  "whoami",
  "hostname",
  "uname",
  "date",
  "neofetch",
  "fortune",
  "cowsay",
  "history",
  "open",
  "code",
  "vim",
  "nano",
  "apt",
  "sudo",
  "ps",
  "free",
  "df",
  "htop",
  "top",
  "curl",
  "ssh",
  "reboot",
  "exit",
  "moor",
  "docker",
  "podman",
  "unshare",
  "python",
  "python3",
] as const;

function line(text: string, c?: Chunk["c"]): Chunk[] {
  return [{ t: text + "\n", c }];
}

function joinChunks(...parts: Chunk[][]): Chunk[] {
  return parts.flat();
}

function tokenize(input: string): string[] {
  const out: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input))) out.push(m[1] ?? m[2] ?? m[0]);
  return out;
}

function treeWalk(fs: FsDir, path: string, prefix: string, acc: Chunk[]) {
  const entries = listDir(fs, path);
  if (!entries) return;
  entries.forEach((entry, i) => {
    const last = i === entries.length - 1;
    const branch = last ? "└── " : "├── ";
    acc.push({ t: `${prefix}${branch}${entry.name}\n`, c: entry.node.kind === "dir" ? "p" : "f" });
    if (entry.node.kind === "dir") {
      treeWalk(fs, `${path === "/" ? "" : path}/${entry.name}`, prefix + (last ? "    " : "│   "), acc);
    }
  });
}

function neofetch(): Chunk[] {
  const art = ["      ▄▄▄▄▄", "    ▄█▀   ▀█▄", "    █  ● ●  █", "    ▀█▄ ▄ ▄█▀", "      ▀█▄█▀"];
  const chunks: Chunk[] = art.map((row) => ({ t: row + "\n", c: "p" as const }));
  chunks.push({ t: "\n" });
  const info: [string, string][] = [
    ["moor@iphone", ""],
    ["-----------", ""],
    ["OS: ", "Moor Linux 1.1 (docked)"],
    ["Host: ", "iPhone · external display"],
    ["Kernel: ", "6.8.0-moor-wasm"],
    ["Shell: ", "msh 1.4.2"],
    ["DE: ", "Moor Shell"],
    ["WM: ", "moorwm (floating)"],
    ["Terminal: ", "moor-term"],
    ["CPU: ", "Apple (session userspace)"],
    ["Memory: ", "412MiB / 2048MiB"],
  ];
  for (const [k, v] of info) {
    chunks.push({ t: k, c: "p" });
    chunks.push({ t: v + "\n" });
  }
  return chunks;
}

function cowsay(text: string): Chunk[] {
  const msg = text || "moo";
  const edge = "-".repeat(msg.length + 2);
  return line(
    ` ${edge}\n< ${msg} >\n ${edge}\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||`,
  );
}

export function complete(input: string, ctx: ShellCtx): string | null {
  const parts = input.split(/\s+/);
  const last = parts[parts.length - 1] ?? "";
  if (parts.length <= 1) {
    const hit = COMMANDS.filter((c) => c.startsWith(last));
    return hit.length === 1 ? hit[0] : null;
  }
  const dirPath = last.includes("/") ? resolvePath(ctx.cwd, parentPath(last) === "/" ? last.replace(/[^/]+$/, "") : parentPath(last)) : ctx.cwd;
  const prefix = last.includes("/") ? last.slice(last.lastIndexOf("/") + 1) : last;
  const entries = listDir(ctx.fs, last.startsWith("/") || last.startsWith("~") ? resolvePath(ctx.cwd, last.replace(/[^/]+$/, "") || "/") : dirPath);
  if (!entries) return null;
  const hit = entries.filter((e) => e.name.startsWith(prefix));
  if (hit.length !== 1) return null;
  const filled = last.includes("/") ? last.replace(/[^/]+$/, hit[0].name) : hit[0].name;
  const suffix = hit[0].node.kind === "dir" ? "/" : "";
  parts[parts.length - 1] = filled + suffix;
  return parts.join(" ");
}

export function runCommand(raw: string, ctx: ShellCtx): ShellResult {
  const input = raw.trim();
  if (!input) return { chunks: [] };
  const tokens = tokenize(input);
  const cmd = tokens[0] ?? "";
  const args = tokens.slice(1);

  switch (cmd) {
    case "help":
      return {
        chunks: joinChunks(
          line("Moor shell — commands", "p"),
          line("help  clear  ls  cd  pwd  cat  echo  mkdir  touch  rm  tree"),
          line("whoami  hostname  uname  date  neofetch  fortune  cowsay"),
          line("open  code  vim  htop  docker  python  history  reboot  exit"),
        ),
      };
    case "clear":
      return { chunks: [], clear: true };
    case "pwd":
      return { chunks: line(ctx.cwd) };
    case "whoami":
      return { chunks: line(ctx.user ?? "moor") };
    case "hostname":
      return { chunks: line(ctx.hostname ?? "iphone") };
    case "date":
      return { chunks: line(new Date().toString()) };
    case "uname":
      return {
        chunks: line(
          args[0] === "-a"
            ? ctx.image
              ? `Linux ${ctx.hostname ?? "container"} 6.8.0-moor #1 WASM ${ctx.image} GNU/Linux`
              : "Moor Linux 1.1 iphone 6.8.0-moor-wasm wasm32 WASM Moor/iPhone"
            : "Linux",
        ),
      };
    case "echo":
      return { chunks: line(args.join(" ")) };
    case "history":
      return { chunks: ctx.history.map((h, i) => ({ t: `  ${i + 1}  ${h}\n` })) };
    case "neofetch":
      return { chunks: neofetch() };
    case "fortune": {
      const node = getNode(ctx.fs, "/usr/share/fortunes");
      const list =
        node?.kind === "file"
          ? node.content.split("\n").filter(Boolean)
          : ["Dock the phone. Free the machine."];
      return { chunks: line(list[Math.floor(Math.random() * list.length)] ?? "") };
    }
    case "cowsay":
      return { chunks: cowsay(args.join(" ")) };
    case "ls": {
      const target = resolvePath(ctx.cwd, args.find((a) => !a.startsWith("-")));
      const entries = listDir(ctx.fs, target);
      if (!entries) return { chunks: line(`ls: ${target}: No such directory`, "d") };
      const chunks: Chunk[] = [];
      for (const e of entries) {
        chunks.push({ t: e.name + (e.node.kind === "dir" ? "/" : ""), c: e.node.kind === "dir" ? "p" : "f" });
        chunks.push({ t: "  " });
      }
      chunks.push({ t: "\n" });
      return { chunks };
    }
    case "tree": {
      const target = resolvePath(ctx.cwd, args[0]);
      const node = getNode(ctx.fs, target);
      if (!node || node.kind !== "dir") return { chunks: line(`tree: ${target}: Not a directory`, "d") };
      const chunks: Chunk[] = [{ t: baseName(target) + "\n", c: "p" }];
      treeWalk(ctx.fs, target, "", chunks);
      return { chunks };
    }
    case "cd": {
      const target = resolvePath(ctx.cwd, args[0]);
      const node = getNode(ctx.fs, target);
      if (!node) return { chunks: line(`cd: no such file or directory: ${target}`, "d") };
      if (node.kind !== "dir") return { chunks: line(`cd: not a directory: ${target}`, "d") };
      return { chunks: [], cwd: target };
    }
    case "cat": {
      if (!args[0]) return { chunks: line("cat: missing file", "d") };
      const target = resolvePath(ctx.cwd, args[0]);
      const node = getNode(ctx.fs, target);
      if (!node) return { chunks: line(`cat: ${args[0]}: No such file`, "d") };
      if (node.kind !== "file") return { chunks: line(`cat: ${args[0]}: Is a directory`, "d") };
      const text = node.content.endsWith("\n") ? node.content : node.content + "\n";
      return { chunks: [{ t: text }] };
    }
    case "mkdir": {
      if (!args[0]) return { chunks: line("mkdir: missing operand", "d") };
      const target = resolvePath(ctx.cwd, args[0]);
      if (!mkdirp(ctx.fs, target)) return { chunks: line(`mkdir: cannot create ${args[0]}`, "d") };
      return { chunks: [] };
    }
    case "touch": {
      if (!args[0]) return { chunks: line("touch: missing file", "d") };
      const target = resolvePath(ctx.cwd, args[0]);
      const existing = getNode(ctx.fs, target);
      if (existing?.kind === "dir") return { chunks: line(`touch: ${args[0]} is a directory`, "d") };
      if (!existing) writeFile(ctx.fs, target, "");
      return { chunks: [] };
    }
    case "rm": {
      if (!args[0]) return { chunks: line("rm: missing operand", "d") };
      const target = resolvePath(ctx.cwd, args[0]);
      if (!removePath(ctx.fs, target)) return { chunks: line(`rm: ${args[0]}: No such file`, "d") };
      return { chunks: [] };
    }
    case "open": {
      const map: Record<string, AppId> = {
        terminal: "terminal",
        files: "files",
        editor: "editor",
        settings: "settings",
        monitor: "monitor",
        web: "browser",
        browser: "browser",
        calc: "calc",
        calculator: "calc",
        software: "software",
        notes: "notes",
        writer: "writer",
        sheets: "sheets",
        calendar: "calendar",
        clock: "clock",
        weather: "weather",
        maps: "maps",
        photos: "photos",
        paint: "paint",
        music: "music",
        videos: "videos",
        help: "help",
        disk: "disk",
        disks: "disk",
        contacts: "contacts",
        screenshot: "screenshot",
        containers: "containers",
        docker: "containers",
        ".": "files",
      };
      const key = (args[0] ?? "files").toLowerCase();
      const appId = map[key];
      if (!appId) return { chunks: line(`open: unknown target ${args[0]}`, "d") };
      return { chunks: line(`opening ${appId}…`, "m"), action: { type: "open", appId } };
    }
    case "code":
    case "vim":
    case "nano": {
      const target = args[0] ? resolvePath(ctx.cwd, args[0]) : undefined;
      return {
        chunks: line(`opening editor${target ? ` ${target}` : ""}`, "m"),
        action: { type: "open", appId: "editor", path: target },
      };
    }
    case "htop":
    case "top":
      return { chunks: line("opening monitor…", "m"), action: { type: "open", appId: "monitor" } };
    case "ps": {
      if (ctx.pids?.length) {
        return {
          chunks: joinChunks(
            line("PID  TTY      CMD"),
            ...ctx.pids.map((p) => line(`${String(p.pid).padStart(3)}  pts/0    ${p.cmd}`)),
          ),
        };
      }
      return {
        chunks: joinChunks(
          line("PID  TTY      CMD"),
          line("  1  tty0     moor-sessiond"),
          line("  8  tty0     moorwm"),
          line(" 14  pts/0    msh"),
        ),
      };
    }
    case "free":
      return { chunks: line("              total        used        free\nMem:        2097152      421888     1675264") };
    case "df":
      return { chunks: line("Filesystem     Size  Used Avail Use%\nmoorfs         2.0G  180M  1.8G   9%") };
    case "apt":
      if (args[0] === "update") return { chunks: line("Hit:1 https://repo.moor.local stable InRelease\nReading package lists... Done", "o") };
      if (args[0] === "install")
        return { chunks: line(`Package ${args[1] ?? "(none)"} is a desktop app. Try \`open ${args[1] ?? "files"}\`.`, "w") };
      return { chunks: line("apt: try `apt update` or `apt install <name>`", "m") };
    case "sudo":
      return { chunks: line("moor: this docked session is already privileged", "w") };
    case "curl":
      return { chunks: line("curl: (7) Failed to connect — docked session is local-first", "d") };
    case "ssh":
      return { chunks: line("ssh: connect to host port 22: No route to host", "d") };
    case "moor":
      return {
        chunks: joinChunks(
          line("Moor — Linux, when the iPhone hits a display.", "p"),
          line("A userspace desktop for USB-C / HDMI sessions."),
        ),
      };
    case "docker":
    case "podman": {
      const sub = args[0];
      if (!sub || sub === "ps" || sub === "images" || sub === "run") {
        return {
          chunks: joinChunks(
            line("Moor has a userspace container runtime — not runc.", "p"),
            line("open Containers, or: open docker"),
          ),
          action: { type: "open", appId: "containers" },
        };
      }
      return { chunks: line(`${cmd}: unknown subcommand. Open Containers.`, "m") };
    }
    case "unshare":
      return {
        chunks: joinChunks(
          line("unshare: clone() with CLONE_NEWNS|CLONE_NEWPID|CLONE_NEWUTS is a Linux syscall.", "w"),
          line("iOS will not give that to an app. Moor emulates those namespaces in Containers."),
        ),
      };
    case "python":
    case "python3": {
      if (ctx.image !== "python") return { chunks: line("python: not installed in this namespace. Run the python image.", "d") };
      const expr = args.join(" ").trim();
      if (!expr) return { chunks: line("Python 3.12.7 (container)\nType python -c 'print(1+1)'", "m") };
      const code = expr.startsWith("-c") ? args.slice(1).join(" ").replace(/^['"]|['"]$/g, "") : expr;
      if (code === "print(1+1)" || code === "1+1") return { chunks: line("2") };
      return { chunks: line(`>>> ${code}\n(hello from the python container)`) };
    }
    case "reboot":
      return { chunks: line("Rebooting session…", "w"), action: { type: "reboot" } };
    case "exit":
      return { chunks: line("logout"), action: { type: "exit" } };
    default:
      return { chunks: line(`msh: command not found: ${cmd}`, "d") };
  }
}

export const COMMAND_LIST = COMMANDS;
