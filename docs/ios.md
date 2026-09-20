# Using Moor on iPhone

Moor is a web app you add to the Home Screen. It is not in the App Store. Apple does not let a third-party app replace iOS when a display is plugged in — Moor fills that display from Safari / the Home Screen icon.

## Add to Home Screen

1. Open your instance in **Safari** (not Chrome in-app browsers).
2. Tap Share.
3. Tap **Add to Home Screen**.
4. Open Moor from the new icon (standalone display).

Use HTTPS if you can. Share sheet and Save to phone are more reliable there.

## Dock a display

1. iPhone 15 or later, USB-C.
2. Plug into an HDMI adapter, dock, or monitor.
3. Open Moor.
4. If the viewport is still phone-sized, tap **Start Linux session**. A wide display opens the desktop on its own.

A Bluetooth keyboard and trackpad make the desktop usable. The phone screen is the companion (undock, session, about) while the external display is the workstation.

## Files

- **Save to phone** — share sheet → Save to Files, Photos, or AirDrop.
- **Import from phone** — camera roll or the Files app, into this session.

Session files live in IndexedDB on that iPhone until you export them.

## Users

You start as **moor**, not root. Tap the name in the top bar to switch, lock, or open Users. `su` and `sudo` work in Terminal.
