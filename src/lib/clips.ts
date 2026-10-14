import type { Clip } from "./types";

export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** What plays on stream, in words. */
export function rangeLabel(c: Clip): string {
  const v = c.video;
  if (!v) return "Önizleme yok";
  if (v.end > v.start) return `Yayındaki kısım: ${mmss(v.start)}–${mmss(v.end)}`;
  // No case suffix after a time: it depends on how the number is read (1:15'ten, 1:20'den).
  return v.start ? `Yayındaki kısım: ${mmss(v.start)} – son` : "Yayındaki kısım: baştan sona";
}

/** Seconds the stream plays; 15 (the suggestion limit) when the cut runs to the end. */
export const clipSeconds = (c: Clip) => (c.video && c.video.end > c.video.start ? c.video.end - c.video.start : 15);

/** YouTube's own player, held to the on-stream cut. */
export function previewUrl(c: Clip): string | null {
  if (!c.video) return null;
  const p = new URLSearchParams({ autoplay: "1", playsinline: "1", rel: "0", start: String(c.video.start || 0) });
  if (c.video.end > c.video.start) p.set("end", String(c.video.end));
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(c.video.id)}?${p}`;
}

/** Lower-case search text: Turkish letters, title and command. */
export const searchText = (c: Clip) => `${c.title} ${c.cmd}`.toLocaleLowerCase("tr-TR");

/**
 * The list from klipler.json, keeping only well-formed rows (it is another
 * program's output, published in public).
 */
export function parseClips(raw: unknown): Clip[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((r): Clip[] => {
    if (!r || typeof r.cmd !== "string" || typeof r.title !== "string") return [];
    const v = r.video;
    const video = v && typeof v.id === "string" && /^[\w-]{6,}$/.test(v.id) ? { id: v.id, start: Number(v.start) || 0, end: Number(v.end) || 0 } : null;
    return [{ title: r.title, cmd: r.cmd, img: typeof r.img === "string" && /^https:\/\//.test(r.img) ? r.img : "", by: typeof r.by === "string" && r.by ? r.by : undefined, video }];
  });
}

const unescape = (s: string) => s.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

/**
 * The old clips page (before the panel published klipler.json): its cards
 * carry the command, title and cover, not the cut, so there is no preview.
 */
export function clipsFromOldPage(html: string): Clip[] {
  const cards = html.match(/<button class="card"[\s\S]*?<\/button>/g) ?? [];
  return cards.flatMap((card): Clip[] => {
    const cmd = card.match(/data-cmd="([^"]+)"/)?.[1];
    const title = card.match(/<b>([\s\S]*?)<\/b>/)?.[1];
    if (!cmd || !title) return [];
    const img = card.match(/<img src="(https:\/\/[^"]+)"/)?.[1] ?? "";
    return [{ title: unescape(title), cmd: unescape(cmd), img: unescape(img), video: null }];
  });
}
