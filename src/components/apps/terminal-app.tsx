import { useEffect, useRef, useState } from "react";
import { parseCtrPath } from "@/lib/containers";
import { complete, runCommand, type Chunk } from "@/lib/shell";
import { activeUser, useMoor } from "@/lib/store";
import { DEFAULT_USERS } from "@/lib/users";

type Line = { kind: "in" | "out"; cwd?: string; chunks?: Chunk[]; text?: string };
type AwaitAuth = { kind: "su" | "sudo"; user?: string; rest?: string } | null;

function shortCwd(cwd: string, home: string) {
  if (cwd === home) return "~";
  if (cwd.startsWith(home + "/")) return "~" + cwd.slice(home.length);
  if (cwd === "/") return "/";
  return cwd;
}

function Chunks({ chunks }: { chunks: Chunk[] }) {
  return (
    <>
      {chunks.map((chunk, i) => (
        <span
          key={i}
          className={
            chunk.c === "p"
              ? "text-primary"
              : chunk.c === "m"
                ? "text-muted"
                : chunk.c === "d"
                  ? "text-danger"
                  : chunk.c === "o"
                    ? "text-ok"
                    : chunk.c === "w"
                      ? "text-warn"
                      : "text-fg"
          }
        >
          {chunk.t}
        </span>
      ))}
    </>
  );
}

export function TerminalApp({ windowId, path }: { windowId: string; path?: string }) {
  const containerId = parseCtrPath(path);
  const hostFs = useMoor((s) => s.fs);
  const hostCwd = useMoor((s) => s.cwd);
  const setCwd = useMoor((s) => s.setCwd);
  const containers = useMoor((s) => s.containers);
  const ctr = containers.find((c) => c.id === containerId);
  const account = useMoor((s) => activeUser(s));
  const switchUser = useMoor((s) => s.switchUser);
  const fs = ctr?.fs ?? hostFs;
  const cwd = ctr?.cwd ?? hostCwd;
  const user = ctr ? "root" : account.name;
  const host = ctr?.hostname ?? "iphone";
  const promptHome = ctr ? "/root" : account.home;
  const setContainerCwd = useMoor((s) => s.setContainerCwd);
  const touchContainer = useMoor((s) => s.touchContainer);
  const openApp = useMoor((s) => s.openApp);
  const reboot = useMoor((s) => s.reboot);
  const closeWindow = useMoor((s) => s.closeWindow);
  const [lines, setLines] = useState<Line[]>(() =>
    containerId
      ? [
          {
            kind: "out",
            chunks: [
              { t: `attached to ${containerId} — namespaced sh. Type `, c: "m" },
              { t: "uname -a", c: "p" },
              { t: ", ", c: "m" },
              { t: "ls /", c: "p" },
              { t: ", ", c: "m" },
              { t: "exit", c: "p" },
              { t: ".\n", c: "m" },
            ],
          },
        ]
      : [
          {
            kind: "out",
            chunks: [
              { t: "Moor Linux 1.3 — type ", c: "m" },
              { t: "linux", c: "p" },
              { t: " for Debian, or ", c: "m" },
              { t: "help", c: "p" },
              { t: ".\n", c: "m" },
            ],
          },
        ],
  );
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [awaitAuth, setAwaitAuth] = useState<AwaitAuth>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [lines]);

  function ctxFor(elevated = false) {
    return {
      cwd,
      fs,
      history,
      hostname: host,
      user: elevated ? "root" : user,
      image: ctr?.image,
      pids: ctr?.pids,
      account: ctr ? DEFAULT_USERS[0] : account,
      elevated: Boolean(ctr) || elevated,
    };
  }

  function applyResult(raw: string, result: ReturnType<typeof runCommand>, hideInput?: boolean) {
    if (result.clear) setLines([]);
    else if (raw.trim()) {
      setLines((prev) => [
        ...prev,
        hideInput ? { kind: "in", cwd, text: "" } : { kind: "in", cwd, text: raw },
        { kind: "out", chunks: result.chunks },
      ]);
    }
    if (result.cwd) {
      if (containerId) setContainerCwd(containerId, result.cwd);
      else setCwd(result.cwd);
    } else if (containerId) {
      touchContainer(containerId);
    }
    if (result.action?.type === "open") openApp(result.action.appId, result.action.path);
    if (result.action?.type === "reboot") reboot();
    if (result.action?.type === "exit") closeWindow(windowId);
    if (result.action?.type === "su") {
      const next = switchUser(result.action.user);
      if (next.needPassword) {
        setAwaitAuth({ kind: "su", user: result.action.user });
        setLines((prev) => [...prev, { kind: "out", chunks: [{ t: "Password: ", c: "m" }] }]);
      } else if (!next.ok) {
        setLines((prev) => [...prev, { kind: "out", chunks: [{ t: (next.error ?? "su failed") + "\n", c: "d" }] }]);
      } else if (result.action.login) {
        setCwd(useMoor.getState().cwd);
      }
    }
    if (result.action?.type === "sudo") {
      setAwaitAuth({ kind: "sudo", rest: result.action.rest });
    }
  }

  function run(raw: string) {
    if (awaitAuth) {
      const secret = raw;
      setValue("");
      setAwaitAuth(null);
      if (awaitAuth.kind === "su" && awaitAuth.user) {
        const next = switchUser(awaitAuth.user, secret);
        setLines((prev) => [
          ...prev,
          { kind: "in", cwd, text: "" },
          {
            kind: "out",
            chunks: next.ok
              ? [{ t: `\n`, c: "m" }]
              : [{ t: (next.error ?? "Authentication failure") + "\n", c: "d" }],
          },
        ]);
        return;
      }
      if (awaitAuth.kind === "sudo" && awaitAuth.rest) {
        if (secret !== account.password) {
          setLines((prev) => [
            ...prev,
            { kind: "in", cwd, text: "" },
            { kind: "out", chunks: [{ t: "sudo: authentication failure\n", c: "d" }] },
          ]);
          return;
        }
        applyResult(awaitAuth.rest, runCommand(awaitAuth.rest, ctxFor(true)), true);
        return;
      }
      return;
    }
    const result = runCommand(raw, ctxFor(false));
    applyResult(raw, result);
    if (raw.trim() && !awaitAuth) {
      setHistory((h) => [...h, raw]);
      setHistIdx(-1);
    }
    setValue("");
  }

  const prompt = `${user}@${host}`;
  const displayCwd = shortCwd(cwd, promptHome);
  const sigil = ctr || account.uid === 0 ? "#" : "$";

  if (containerId && !ctr) {
    return <p className="p-4 text-sm text-muted">Container gone.</p>;
  }

  return (
    <div
      className="flex h-full flex-col bg-crust p-3 font-mono text-sm"
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={scroller} className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap">
        {lines.map((line, i) =>
          line.kind === "in" ? (
            <p key={i}>
              <span className="text-primary">{prompt}</span>
              <span className="text-muted">:</span>
              <span className="text-ok">{shortCwd(line.cwd ?? cwd, promptHome)}</span>
              <span className="text-muted">{sigil} </span>
              <span>{line.text}</span>
            </p>
          ) : (
            <p key={i}>
              <Chunks chunks={line.chunks ?? []} />
            </p>
          ),
        )}
        <p className="flex">
          <span className="text-primary">{prompt}</span>
          <span className="text-muted">:</span>
          <span className="text-ok">{displayCwd}</span>
          <span className="text-muted">{sigil} </span>
          <input
            ref={inputRef}
            value={value}
            autoFocus
            spellCheck={false}
            aria-label="Terminal input"
            className="min-w-0 flex-1 bg-transparent text-fg outline-none"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                run(value);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                const next = histIdx < 0 ? history.length - 1 : histIdx - 1;
                if (next >= 0 && history[next]) {
                  setHistIdx(next);
                  setValue(history[next]);
                }
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                if (histIdx < 0) return;
                const next = histIdx + 1;
                if (next >= history.length) {
                  setHistIdx(-1);
                  setValue("");
                } else {
                  setHistIdx(next);
                  setValue(history[next] ?? "");
                }
              } else if (e.key === "Tab") {
                e.preventDefault();
                const filled = complete(value, ctxFor(false));
                if (filled) setValue(filled);
              } else if (e.key === "c" && e.ctrlKey) {
                e.preventDefault();
                setLines((prev) => [...prev, { kind: "in", cwd, text: value + "^C" }]);
                setValue("");
              } else if (e.key === "l" && e.ctrlKey) {
                e.preventDefault();
                setLines([]);
              }
            }}
          />
        </p>
      </div>
    </div>
  );
}
