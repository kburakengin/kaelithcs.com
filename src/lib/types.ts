/**
 * The data this site is built from. Two producers, both outside this repo:
 *
 *   public/veri/site.json   kaelith-clipper `src/site.js` (calendar, ELO, channel facts)
 *   klipler.json            kaelith-stream-deck `tablet/klip_sayfasi.py` (the clip list),
 *                           published at kburakengin.github.io/kaelithcs/klipler.json
 *
 * Both are public. The producers write from a whitelist; nothing here may
 * assume more than these shapes.
 */

/** One row of the YouTube calendar. Title and url only once the video is out. */
export interface CalendarItem {
  /** ISO time it goes (or went) out. */
  zaman: string;
  /** What it is: "2500 ELO Yolu #9", "Short", "KAELITH İFŞA", ... (episode number only once out). */
  tur: string;
  short: boolean;
  baslik?: string | null;
  url?: string;
}

export interface EloPoint {
  zaman: string;
  elo: number;
}

export interface EloData {
  /** FACEIT ELO now, or null if FACEIT did not answer. */
  simdi: number | null;
  baslangic: number;
  hedef: number;
  /** ELO after each FACEIT match, oldest first. */
  maclar: EloPoint[];
}

/** Channel facts from the clipper's kanal.json (one source for every channel text). */
export interface ChannelFacts {
  yayin: { gun: string; saat: string };
  ayarlar: {
    dpi: number;
    sens: number;
    zoomSens: number;
    cozunurluk: string;
    monitor: string;
    crosshair: string;
  };
}

export interface SiteData {
  takvim: CalendarItem[];
  elo: EloData;
  kanal?: ChannelFacts;
}

/** A clip viewers can play on stream with "!klip <word>". */
export interface Clip {
  title: string;
  /** The chat command, e.g. "!klip vay". */
  cmd: string;
  /** Cover image url, or "" if the panel has none. */
  img: string;
  /** Viewer who suggested it with !kliponer, if any. */
  by?: string;
  /** The YouTube cut that plays on stream; null for X clips or an older publisher. */
  video: { id: string; start: number; end: number } | null;
}
