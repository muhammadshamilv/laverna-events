import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.lavernaevents.app",
  appName: "LavernaEvents",
  webDir: "dist",
  server: {
    androidScheme: "https",

    // To test against a running `npm run dev` server from a real device or
    // emulator instead of the bundled `dist` build, temporarily uncomment
    // the two lines below and point `url` at your machine's LAN IP (not
    // `localhost`/`127.0.0.1` - the device can't reach those). Remove them
    // again before shipping a release build, which should always load the
    // bundled `webDir`.
    // url: "http://192.168.1.50:5173",
    // cleartext: true,
  },
};

export default config;
