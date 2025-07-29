import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";

export async function initializeNativeFeatures() {
  if (!Capacitor.isNativePlatform()) {
    return; // Skip on web
  }

  try {
    // Hide status bar on Android for fullscreen experience
    if (Capacitor.getPlatform() === "android") {
      await StatusBar.hide();
    }

    // Keep status bar visible on iOS but make it overlay
    if (Capacitor.getPlatform() === "ios") {
      await StatusBar.setOverlaysWebView({ overlay: true });
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: "#000000" });
    }
  } catch (error) {
    console.log("Status bar configuration failed:", error);
  }
}

export async function showStatusBar() {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await StatusBar.show();
  } catch (error) {
    console.log("Failed to show status bar:", error);
  }
}

export async function hideStatusBar() {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await StatusBar.hide();
  } catch (error) {
    console.log("Failed to hide status bar:", error);
  }
}
