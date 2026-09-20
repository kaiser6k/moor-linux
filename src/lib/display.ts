type ScreenLike = {
  availLeft: number;
  availTop: number;
  availWidth: number;
  availHeight: number;
  isInternal?: boolean;
};

type ScreenDetailsLike = {
  currentScreen: ScreenLike;
  screens: ScreenLike[];
};

function getScreenDetailsFn(): (() => Promise<ScreenDetailsLike>) | undefined {
  const fn = (window as Window & { getScreenDetails?: () => Promise<ScreenDetailsLike> })
    .getScreenDetails;
  return typeof fn === "function" ? fn.bind(window) : undefined;
}

export async function requestExternalDisplay(): Promise<"opened" | "fullscreen" | "unavailable"> {
  const detailsFn = getScreenDetailsFn();
  if (detailsFn) {
    try {
      const details = await detailsFn();
      const external =
        details.screens.find((s) => s !== details.currentScreen && s.isInternal === false) ??
        details.screens.find((s) => s !== details.currentScreen);
      if (external) {
        const features = [
          `left=${external.availLeft}`,
          `top=${external.availTop}`,
          `width=${external.availWidth}`,
          `height=${external.availHeight}`,
        ].join(",");
        const popup = window.open("/", "moor-desktop", features);
        if (popup) return "opened";
      }
    } catch {
      /* permission denied or unsupported */
    }
  }

  try {
    await document.documentElement.requestFullscreen();
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (mode: string) => Promise<void>;
    };
    if (typeof orientation.lock === "function") {
      try {
        await orientation.lock("landscape");
      } catch {
        /* iOS often rejects lock */
      }
    }
    return "fullscreen";
  } catch {
    return "unavailable";
  }
}

export function displayLabel(width: number, height: number) {
  if (width >= 1600) return `HDMI-1 · ${width}×${height}`;
  if (width >= 900) return `Display · ${width}×${height}`;
  return `iPhone · ${width}×${height}`;
}
