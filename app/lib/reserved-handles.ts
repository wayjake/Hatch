export const RESERVED_HANDLES = new Set<string>([
  "admin",
  "studio",
  "api",
  "courses",
  "creators",
  "community",
  "members",
  "profile",
  "projects",
  "teleprompter",
  "sign-in",
  "sign-up",
  "home",
  "settings",
  "app",
  "www",
  "hatch",
  "support",
  "help",
  "about",
  "pricing",
  "blog",
  "become-a-creator",
  "book",
  "account",
  "login",
  "logout",
  "dashboard",
  "user",
  "users",
  "me",
  "public",
  "static",
  "assets",
]);

const HANDLE_PATTERN = /^[a-z0-9-]+$/;

export function validateHandle(raw: string): string | null {
  const handle = raw.trim().toLowerCase();
  if (!handle) return "Handle is required";
  if (handle.length < 3) return "Handle must be at least 3 characters";
  if (handle.length > 32) return "Handle must be at most 32 characters";
  if (!HANDLE_PATTERN.test(handle)) {
    return "Handle can only contain lowercase letters, numbers, and hyphens";
  }
  if (handle.startsWith("-") || handle.endsWith("-")) {
    return "Handle cannot start or end with a hyphen";
  }
  if (RESERVED_HANDLES.has(handle)) return "That handle is reserved";
  return null;
}

export function normalizeHandle(raw: string): string {
  return raw.trim().toLowerCase();
}
