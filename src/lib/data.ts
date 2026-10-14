import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { clipsFromOldPage, parseClips } from "./clips";
import type { CalendarItem, ChannelFacts, Clip, SiteData } from "./types";

/** Build-time only: these read files and the network while Astro renders. */

// From the project root: this module runs bundled, so its own url says nothing.
const SITE_JSON = join(process.cwd(), "public", "veri", "site.json");
const CLIPS_BASE = "https://kburakengin.github.io/kaelithcs/";

const isItem = (x: any): x is CalendarItem => x && typeof x.zaman === "string" && typeof x.tur === "string";

/** The clipper's file, checked row by row: a bad row is dropped, not rendered. */
export function parseSite(raw: any): SiteData {
  const e = raw?.elo ?? {};
  return {
    takvim: Array.isArray(raw?.takvim) ? raw.takvim.filter(isItem) : [],
    elo: {
      simdi: Number.isFinite(e.simdi) ? e.simdi : null,
      baslangic: Number.isFinite(e.baslangic) ? e.baslangic : 2000,
      hedef: Number.isFinite(e.hedef) ? e.hedef : 2500,
      maclar: Array.isArray(e.maclar) ? e.maclar.filter((p: any) => Number.isFinite(p?.elo) && typeof p?.zaman === "string") : [],
    },
    kanal: raw?.kanal as ChannelFacts | undefined,
  };
}

export async function loadSite(): Promise<SiteData> {
  return parseSite(JSON.parse(await readFile(SITE_JSON, "utf8")));
}

/** klipler.json from the panel; the old page's cards if it is not published yet. */
export async function loadClips(): Promise<Clip[]> {
  const json = await fetch(CLIPS_BASE + "klipler.json");
  if (json.ok) return parseClips(await json.json());
  const page = await fetch(CLIPS_BASE + "klipler.html");
  if (!page.ok) throw new Error(`klip listesi alınamadı: ${json.status} / ${page.status}`);
  return clipsFromOldPage(await page.text());
}
