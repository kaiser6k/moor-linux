# Native iOS app (Mac Mini)

This wraps Moor in a real iOS app (icon, full screen, TestFlight). It is still the same web desktop inside WKWebView. It is **not** a Linux kernel. Apple will not approve a kernel.

You need:

- Mac Mini with macOS and **Xcode** (App Store, then open Xcode once to install tools)
- [Apple Developer](https://developer.apple.com/programs/) ($99/year) to put it on a device or TestFlight
- Node 22 (`brew install node`)
- An **HTTPS** Moor URL (Publish from Grok, or your own VPS)

Until the Mini is on the desk, **Safari → Add to Home Screen** is the iOS app.

## 1. One-time on the Mini

```bash
git clone https://github.com/kaiser6k/moor-linux.git
cd moor-linux
git pull
cp env.example .env
npm install
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init "Moor" linux.moor.app --web-dir dist
```

Edit `capacitor.config.ts` so the WebView loads your live site (simplest, Debian keeps working):

```ts
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "linux.moor.app",
  appName: "Moor",
  webDir: "dist",
  server: {
    url: "https://YOUR-PUBLISHED-MOOR-URL",
    cleartext: false,
  },
  ios: {
    contentInset: "never",
    preferredContentMode: "desktop",
    scheme: "Moor",
  },
};

export default config;
```

Then:

```bash
npx cap add ios
npx cap sync ios
npx cap open ios
```

## 2. Xcode

1. Signing & Capabilities → your Team (Apple Developer).
2. Bundle ID `linux.moor.app` (must be unique if that ID is taken — use `com.yourname.moor`).
3. Select your **iPad** or **iPhone**, plugged in, Developer Mode on (Settings → Privacy & Security).
4. Run (play). First time: trust the developer on the device.

**TestFlight:** Product → Archive → Distribute App → TestFlight. Then install TestFlight from the App Store on the tablet.

## 3. What to expect

| Works | Does not |
| --- | --- |
| Icon, full screen, DeX desktop, Files, Save to phone | A real Ubuntu kernel |
| Debian if the **published** site has COOP/COEP on `/linux-vm.html` | App Store review if you claim “this is Linux replacing iOS” |
| Keyboard / trackpad / USB-C display | JIT as fast as Safari in every iOS version |

App Store listing should say: desktop session for a docked iPhone/iPad, web userspace, not a replacement for iPadOS.

## 4. When you’re stuck

Ping the [Discord](https://discord.gg/CNRYnGBayu) or reopen this chat with the Xcode error. Bring: Xcode version, device iOS version, and whether you used `server.url` or a local `dist` build.
