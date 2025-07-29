import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mls.app",
  appName: "mls-framework",
  webDir: "public",
  server: {
    url: "http://192.168.2.105:3000",
    cleartext: true,
  },
  plugins: {
    StatusBar: {
      style: "dark",
      backgroundColor: "#000000",
      overlaysWebView: true,
    },
    SafeArea: {
      enabled: true,
      customColorsForSystemBars: true,
      statusBarColor: "#000000",
      statusBarStyle: "dark",
      navigationBarColor: "#000000",
      navigationBarStyle: "dark",
    },
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#000000",
    webContentsDebuggingEnabled: true,
  },
  android: {
    backgroundColor: "#000000",
    webContentsDebuggingEnabled: true,
    allowMixedContent: true,
    adjustMarginsForEdgeToEdge: "auto",
  },
};

export default config;
