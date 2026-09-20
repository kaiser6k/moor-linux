import { cloneFs, type FsDir } from "./fs";

export type ImageId = "alpine" | "debian" | "python" | "busybox";

export type CtrStatus = "created" | "running" | "exited";

export type Ctr = {
  id: string;
  name: string;
  image: ImageId;
  status: CtrStatus;
  createdAt: number;
  hostname: string;
  cwd: string;
  fs: FsDir;
  memLimit: string;
  pids: { pid: number; cmd: string }[];
  logs: string[];
};

export const IMAGES: {
  id: ImageId;
  name: string;
  tag: string;
  size: string;
  kernel: boolean;
  blurb: string;
  entry: string;
}[] = [
  {
    id: "alpine",
    name: "alpine",
    tag: "3.20",
    size: "7.8 MB",
    kernel: false,
    blurb: "musl + busybox. Isolated mount, UTS, PID.",
    entry: "/bin/sh",
  },
  {
    id: "debian",
    name: "debian",
    tag: "bookworm-slim",
    size: "74 MB",
    kernel: false,
    blurb: "glibc userspace. Same kernel as the host session.",
    entry: "/bin/bash",
  },
  {
    id: "python",
    name: "python",
    tag: "3.12-slim",
    size: "22 MB",
    kernel: false,
    blurb: "CPython on a slim Debian root.",
    entry: "python3",
  },
  {
    id: "busybox",
    name: "busybox",
    tag: "1.36",
    size: "4.3 MB",
    kernel: false,
    blurb: "Single binary. The smallest runnable image.",
    entry: "/bin/sh",
  },
];

export const REAL_WASM = {
  label: "Debian sid (container2wasm)",
  size: "~200 MB",
  url: "https://ktock.github.io/container2wasm-demo/",
  note: "Real Linux userspace on an emulated CPU, compiled to Wasm. Heavy on iPhone RAM.",
};

function file(content: string): { kind: "file"; content: string } {
  return { kind: "file", content };
}

function dir(children: FsDir["children"]): FsDir {
  return { kind: "dir", children };
}

function osRelease(pretty: string, id: string) {
  return `PRETTY_NAME="${pretty}"\nNAME="${pretty}"\nID=${id}\nVERSION_ID="container"\n`;
}

export function imageRoot(image: ImageId): FsDir {
  const commonBin = dir({
    sh: file("#!/bin/sh\n# busybox ash\n"),
    ls: file(""),
    cat: file(""),
    echo: file(""),
    hostname: file(""),
    uname: file(""),
  });
  const proc = dir({
    "1": dir({ cmdline: file("/sbin/init\n") }),
    version: file("Linux version 6.8.0-moor (userspace container)\n"),
    mounts: file("overlay / overlay rw 0 0\nproc /proc proc rw 0 0\n"),
  });

  if (image === "python") {
    return dir({
      bin: commonBin,
      usr: dir({
        bin: dir({
          python3: file("#!/usr/bin/python3\n"),
          pip: file(""),
        }),
        lib: dir({ python3: dir({ "site.py": file("# site\n") }) }),
      }),
      etc: dir({
        hostname: file("python\n"),
        "os-release": file(osRelease("Python 3.12 Slim", "debian")),
      }),
      proc,
      root: dir({
        "main.py": file('print("hello from the python container")\n'),
        ".profile": file("export PS1='root@python:/# '\n"),
      }),
      tmp: dir({}),
    });
  }

  if (image === "debian") {
    return dir({
      bin: dir({
        ...commonBin.children,
        bash: file("#!/bin/bash\n"),
        apt: file(""),
      }),
      etc: dir({
        hostname: file("debian\n"),
        "os-release": file(osRelease("Debian GNU/Linux bookworm", "debian")),
        debian_version: file("12.7\n"),
      }),
      home: dir({}),
      proc,
      root: dir({
        ".bashrc": file("export PS1='root@debian:/# '\n"),
        README: file("This rootfs is namespaced from the Moor host.\nIt still shares the host kernel — there is no guest Linux.\n"),
      }),
      tmp: dir({}),
      usr: dir({ share: dir({ doc: dir({}) }) }),
      var: dir({ log: dir({ dpkg: file("") }) }),
    });
  }

  if (image === "busybox") {
    return dir({
      bin: dir({ busybox: file("busybox 1.36.1\n"), sh: file("") }),
      etc: dir({
        hostname: file("busybox\n"),
        "os-release": file(osRelease("BusyBox", "busybox")),
      }),
      proc,
      root: dir({}),
      tmp: dir({}),
    });
  }

  return dir({
    bin: commonBin,
    etc: dir({
      hostname: file("alpine\n"),
      "os-release": file(osRelease("Alpine Linux v3.20", "alpine")),
      apk: dir({ repositories: file("https://dl-cdn.alpinelinux.org/alpine/v3.20/main\n") }),
    }),
    proc,
    root: dir({
      ".ashrc": file("export PS1='root@alpine:/# '\n"),
    }),
    tmp: dir({}),
    usr: dir({ bin: dir({}) }),
  });
}

export function shortId() {
  return Math.random().toString(16).slice(2, 10);
}

export function makeContainer(image: ImageId, name?: string): Ctr {
  const id = shortId();
  const meta = IMAGES.find((i) => i.id === image)!;
  const hostname = name?.replace(/[^a-z0-9-]/gi, "").slice(0, 20) || image;
  return {
    id,
    name: name || `${image}-${id.slice(0, 4)}`,
    image,
    status: "running",
    createdAt: Date.now(),
    hostname,
    cwd: "/root",
    fs: cloneFs(imageRoot(image)),
    memLimit: "128M",
    pids: [
      { pid: 1, cmd: meta.entry },
      { pid: 8, cmd: "pause" },
    ],
    logs: [
      `${new Date().toISOString()} overlay mounted`,
      `${new Date().toISOString()} hostname=${hostname}`,
      `${new Date().toISOString()} pid namespace started`,
    ],
  };
}

export function ctrPath(id: string) {
  return `ctr:${id}`;
}

export function parseCtrPath(path?: string): string | undefined {
  if (path?.startsWith("ctr:")) return path.slice(4);
  return undefined;
}
