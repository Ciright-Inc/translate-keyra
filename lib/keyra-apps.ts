export type KeyraLauncherApp = {
  id: string;
  label: string;
  description: string;
  href: string;
};

export type KeyraLauncherResponse = {
  apps: KeyraLauncherApp[];
};

export const KEYRA_LAUNCHER_FALLBACK: KeyraLauncherResponse = {
  apps: [
    { id: "event", label: "Event", description: "Event app", href: "https://event.keyra.ie" },
    { id: "keyra", label: "Keyra", description: "Platform & product hub", href: "https://app.keyra.ie" },
    {
      id: "get-started",
      label: "Get Started",
      description: "Enrollment & verification",
      href: "https://get-started.keyra.ie",
    },
    { id: "settings", label: "Settings", description: "Settings app", href: "https://setting.keyra.ie" },
    { id: "press", label: "Press", description: "Press room", href: "https://press.keyra.ie" },
    {
      id: "my-account",
      label: "My Account",
      description: "Account portal",
      href: "https://myaccount.keyra.ie",
    },
    { id: "podcast", label: "Podcast", description: "Podcast app", href: "https://podcast.keyra.ie" },
    { id: "info", label: "Info", description: "Information hub", href: "https://info.keyra.ie" },
    { id: "ftp", label: "FTP", description: "File transfer portal", href: "https://ftp.keyra.ie" },
    { id: "app", label: "App", description: "Consumer app", href: "https://app.keyra.ie" },
    { id: "esim", label: "ESim", description: "eSIM app", href: "https://esim.keyra.ie" },
    {
      id: "analytics",
      label: "Analytics",
      description: "Analytics workspace",
      href: "https://analytics.keyra.ie",
    },
    { id: "drive", label: "Drive", description: "Drive workspace", href: "https://drive.keyra.ie" },
    {
      id: "soip",
      label: "SOIP",
      description: "Sovereign operational intelligence",
      href: "https://soip.keyra.ie",
    },
    {
      id: "developer",
      label: "Developer",
      description: "APIs & documentation",
      href: "https://developer.keyra.ie",
    },
    {
      id: "affiliates",
      label: "Affiliates",
      description: "Affiliate program",
      href: "https://affiliate.keyra.ie",
    },
    {
      id: "translate",
      label: "Translation",
      description: "Real-time enterprise translation",
      href: "https://translate.keyra.ie",
    },
  ],
};

/** Two-letter code matching keyra.ie (e.g. get-started → GE, my-account → MY). */
export function getAppAbbrev(id: string, label: string): string {
  const parts = id.split("-").filter(Boolean);
  if (parts.length >= 2) {
    const head = parts[0];
    return (head[0] + (head[1] ?? head[0])).toUpperCase();
  }
  const letters = label.replace(/[^a-zA-Z]/g, "");
  return letters.slice(0, 2).toUpperCase();
}

export function isCurrentKeyraApp(href: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const target = new URL(href);
    return target.hostname === window.location.hostname;
  } catch {
    return false;
  }
}
