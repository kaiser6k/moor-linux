# Moor Linux

A Linux desktop session for a docked iPhone. Plug USB-C into a display, start a session, and you get a floating-window userspace: terminal, files, and the apps a standard distro ships.

**Free and open source (MIT).**  
Repository: [github.com/kaiser6k/moor-linux](https://github.com/kaiser6k/moor-linux)

## Host your own

Anyone can run a private instance. Full walkthrough: **[docs/self-host.md](docs/self-host.md)**.

```bash
git clone https://github.com/kaiser6k/moor-linux.git
cd moor-linux
cp env.example .env
npm install
npm run dev
```

Then open the URL it prints, or:

```bash
docker compose up --build
```

| Path | Doc |
| --- | --- |
| Node / Vercel / Docker | [docs/self-host.md](docs/self-host.md) |
| iPhone Home Screen + dock | [docs/ios.md](docs/ios.md) |
| Contributing | [CONTRIBUTING.md](CONTRIBUTING.md) |

You need **Node.js 22+**. Keep `VITE_AUTH_ENABLED=false` (already in `env.example`) so the instance is a local desktop, not a Grok login wall.

## What it is

Moor is *userspace* Linux for the display your iPhone is plugged into — not a kernel replacing iOS. Apple does not allow a third-party app to take over the device when HDMI is connected. Moor fills that display with a real workstation: windows, a shell, a home folder, and Save to phone so files can live in iOS Files / Photos.

## Save files onto the phone

1. Open **Files**
2. Tap a file to select it
3. Tap **Save to phone**
4. Use the iOS share sheet: Save to Files, Photos, or AirDrop

**Photos**, **Writer**, **Paint**, **Sheets**, and **Settings → Export home to phone** do the same.

Import from the camera roll or Files app with **Import from phone**. Session data is stored on the device (IndexedDB) until you export it.

## Applications

Accessories, Office, Graphics, Sound & Video, Internet, and System — including Terminal, Files, Software, Text Editor, Writer, Sheets, Notes, Calendar, Contacts, Calculator, Clocks, Weather, Maps, Web, Photos, Paint, Music, Videos, Screenshot, System Monitor, Disks, Settings, Users, Containers, and Help.

Open **Software** from the dock, or Super / the grid icon for the launcher.

## Users

The session starts as **moor** (uid 1000), not root. Click the username in the top bar to switch, lock, or open **Users**. Add accounts, set passwords, and grant sudo. `su` / `sudo` work in the terminal. Reloading drops you back to a regular user if you were root.

## Containers

A container is a process with extra kernel isolation (namespaces + cgroups) — not a VM. iOS will not let an app call `clone(CLONE_NEWNS|…)`, so Moor ships a **userspace runtime**:

- Images: alpine, debian, python, busybox
- Each Run gets its own rootfs, hostname, and PID table
- Exec opens a namespaced shell (`root@alpine:~#`)
- Namespaces tab explains mnt/pid/uts/net/user/cgroup
- Wasm tab can boot a real converted Debian image via [container2wasm](https://github.com/container2wasm/container2wasm) (~200 MB, heavy on iPhone)

This is a teaching runtime, not runc. The kernel is still the host session.

## License

MIT — see [LICENSE](LICENSE). Use it, fork it, ship it.
