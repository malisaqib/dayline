const ALLOWED_EXACT = new Set(["/today", "/archive", "/onboarding"]);
const ALLOWED_PREFIX = "/edition/";

export const DEFAULT_RETURN_PATH = "/today";

export function safeReturnPath(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(raw, "http://dayline.local");
  } catch {
    return null;
  }
  if (url.origin !== "http://dayline.local") {
    return null;
  }
  const path = url.pathname;
  if (!ALLOWED_EXACT.has(path) && !path.startsWith(ALLOWED_PREFIX)) {
    return null;
  }
  return `${path}${url.search}`;
}

export function isPrivatePath(pathname: string): boolean {
  return pathname === "/today" || pathname === "/archive" || pathname.startsWith("/edition/");
}
