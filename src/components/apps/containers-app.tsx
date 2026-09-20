import { useState } from "react";
import { AppShell, BarBtn } from "@/components/app-shell";
import { IMAGES, REAL_WASM, type ImageId } from "@/lib/containers";
import { useMoor } from "@/lib/store";
import { cn } from "@/lib/utils";

type Tab = "run" | "ns" | "wasm";

export function ContainersApp() {
  const containers = useMoor((s) => s.containers);
  const runContainer = useMoor((s) => s.runContainer);
  const stopContainer = useMoor((s) => s.stopContainer);
  const removeContainer = useMoor((s) => s.removeContainer);
  const openApp = useMoor((s) => s.openApp);
  const [tab, setTab] = useState<Tab>("run");
  const [picked, setPicked] = useState<ImageId>("alpine");
  const [status, setStatus] = useState<string | null>(null);

  return (
    <AppShell
      bar={
        <>
          {(["run", "ns", "wasm"] as const).map((t) => (
            <BarBtn key={t} onClick={() => setTab(t)}>
              {t === "run" ? "Runtime" : t === "ns" ? "Namespaces" : "Wasm"}
            </BarBtn>
          ))}
          <span className="ml-auto text-xs text-muted">userspace · no guest kernel</span>
        </>
      }
    >
      {tab === "run" ? (
        <div className="grid h-full min-h-0 md:grid-cols-[220px_1fr]">
          <aside className="border-b border-border p-3 md:border-b-0 md:border-r">
            <h2 className="text-xs font-medium tracking-wide text-muted uppercase">Images</h2>
            <ul className="mt-2 space-y-1">
              {IMAGES.map((img) => (
                <li key={img.id}>
                  <button
                    type="button"
                    onClick={() => setPicked(img.id)}
                    className={cn(
                      "w-full rounded-md px-2 py-2 text-left text-sm",
                      picked === img.id ? "bg-overlay text-fg" : "text-muted hover:bg-overlay",
                    )}
                  >
                    <span className="block font-medium text-fg">
                      {img.name}:{img.tag}
                    </span>
                    <span className="block text-xs">{img.size}</span>
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-3 w-full rounded-md bg-primary py-2 text-sm font-medium text-crust"
              onClick={() => {
                const ctr = runContainer(picked);
                setStatus(`started ${ctr.name} (${ctr.id})`);
              }}
            >
              Run
            </button>
            {status ? <p className="mt-2 text-xs text-muted">{status}</p> : null}
          </aside>
          <section className="min-h-0 overflow-auto p-3">
            <h2 className="text-xs font-medium tracking-wide text-muted uppercase">Containers</h2>
            {containers.length === 0 ? (
              <p className="mt-6 text-sm text-muted">
                No containers. Pick an image and Run. Each one gets its own mount, hostname, and PID table — still the
                Moor kernel, not a VM.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {containers.map((c) => (
                  <li key={c.id} className="rounded-md border border-border bg-surface p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium">
                        {c.name}{" "}
                        <span className="font-mono text-xs text-muted">{c.id}</span>
                      </p>
                      <span className={c.status === "running" ? "text-xs text-ok" : "text-xs text-muted"}>
                        {c.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {c.image} · hostname {c.hostname} · mem {c.memLimit} · {c.pids.length} pids
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <BarBtn
                        onClick={() => openApp("terminal", `ctr:${c.id}`)}
                        disabled={c.status !== "running"}
                      >
                        Exec
                      </BarBtn>
                      <BarBtn onClick={() => stopContainer(c.id)} disabled={c.status !== "running"}>
                        Stop
                      </BarBtn>
                      <BarBtn danger onClick={() => removeContainer(c.id)}>
                        Remove
                      </BarBtn>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}

      {tab === "ns" ? <Namespaces /> : null}
      {tab === "wasm" ? <WasmPane /> : null}
    </AppShell>
  );
}

function Namespaces() {
  return (
    <div className="space-y-5 overflow-auto p-5 text-sm leading-relaxed">
      <p className="text-xs font-medium tracking-widest text-primary uppercase">How Linux containers work</p>
      <h1 className="text-xl font-semibold">Namespaces, cgroups, overlay</h1>
      <p className="text-muted">
        A container is not a virtual machine. It is a process tree that has been given a private view of the kernel.
        The kernel is shared. Isolation comes from a handful of namespaces plus resource limits.
      </p>
      <dl className="space-y-3">
        {[
          ["mnt", "Own filesystem tree. OverlayFS layers an image (read-only) under a writable upper dir."],
          ["pid", "Own process IDs. PID 1 inside is not PID 1 on the host."],
          ["uts", "Own hostname. `debian` in the container, `iphone` on Moor."],
          ["net", "Own network stack. veth pair into a bridge. Moor cannot give you a real one on iOS."],
          ["user", "Map container root to an unprivileged host uid. Userns."],
          ["cgroup", "CPU, memory, pids limits. Not a namespace of names — a budget."],
        ].map(([k, v]) => (
          <div key={k} className="rounded-md bg-surface px-3 py-3">
            <dt className="font-mono text-xs text-primary">{k}</dt>
            <dd className="mt-1 text-muted">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-muted">
        Docker, Podman, and containerd all talk OCI: an image (layers + config) and a runtime (usually runc or crun)
        that calls clone() with the namespace flags. There is no Docker kernel. There is Linux.
      </p>
      <p className="text-muted">
        iOS will not let an app create Linux namespaces. Moor therefore emulates mnt / pid / uts in userspace: each
        Run clones a rootfs and a hostname. That is a teaching runtime, not runc.
      </p>
    </div>
  );
}

function WasmPane() {
  const [boot, setBoot] = useState(false);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border p-4 text-sm">
        <h1 className="font-semibold">Containers on Wasm</h1>
        <p className="mt-2 text-muted leading-relaxed">
          The other path: compile a real Linux userspace + a CPU emulator (Bochs, TinyEMU, QEMU-Wasm) to WebAssembly.
          Projects like <span className="text-fg">container2wasm</span> (CNCF sandbox) convert an OCI image into a Wasm
          blob you can run in the browser. That <em>is</em> Linux. It is also tens to hundreds of megabytes and hard on
          iPhone memory.
        </p>
        <p className="mt-2 text-xs text-muted">{REAL_WASM.note}</p>
        {!boot ? (
          <button
            type="button"
            className="mt-3 rounded-md bg-primary px-3 py-2 text-sm font-medium text-crust"
            onClick={() => setBoot(true)}
          >
            Boot {REAL_WASM.label}
          </button>
        ) : (
          <a href={REAL_WASM.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-primary">
            Open demo in a new tab
          </a>
        )}
      </div>
      {boot ? (
        <iframe title="container2wasm demo" src={REAL_WASM.url} className="min-h-0 flex-1 border-0 bg-crust" />
      ) : (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted">
          Runtime images above stay on-device and tiny. The Wasm demo streams a converted Debian/Alpine image from the
          container2wasm project.
        </div>
      )}
    </div>
  );
}
