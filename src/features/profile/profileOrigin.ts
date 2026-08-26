export type ProfileOrigin = "discover" | "find" | "likes" | "chats";

const ORIGINS = new Set<string>(["discover", "find", "likes", "chats"]);

export function profileOriginFromState(state: unknown): ProfileOrigin {
  if (typeof state !== "object" || state === null) return "find";
  const from = (state as { from?: unknown }).from;
  return typeof from === "string" && ORIGINS.has(from) ? (from as ProfileOrigin) : "find";
}

export function originBack(origin: ProfileOrigin): { to: string; label: string } {
  switch (origin) {
    case "discover":
      return { to: "/discover", label: "← Back to Discover" };
    case "likes":
      return { to: "/likes", label: "← Back to Likes" };
    case "chats":
      return { to: "/chats", label: "← Back to Chats" };
    default:
      return { to: "/find", label: "← Back to Find" };
  }
}
