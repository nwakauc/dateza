const LINK_RE = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;

export type RichPart = { type: "text"; value: string } | { type: "link"; label: string; href: string };

export function parseRichText(text: string): RichPart[] {
  const parts: RichPart[] = [];
  let lastIndex = 0;
  const matches = text.matchAll(LINK_RE);
  for (const match of matches) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, index) });
    }
    parts.push({ type: "link", label: match[1] ?? "", href: match[2] ?? "/" });
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }
  return parts;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function richTextToHtml(text: string): string {
  return parseRichText(text)
    .map((part) => {
      if (part.type === "text") return escapeHtml(part.value);
      return `<a href="${escapeHtml(part.href)}">${escapeHtml(part.label)}</a>`;
    })
    .join("");
}
