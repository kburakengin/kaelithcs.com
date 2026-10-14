/**
 * What the site says about the channel that does not change night to night.
 * The stream time and the in-game settings come from the clipper's kanal.json
 * through site.json (`kanal`), so they are written in one place only; the
 * values here are what to show if a build ever runs without them.
 */
import type { ChannelFacts } from "../lib/types";

export const links = {
  youtube: "https://www.youtube.com/@kaelithcs",
  youtubeVideos: "https://www.youtube.com/@kaelithcs/videos",
  youtubeShorts: "https://www.youtube.com/@kaelithcs/shorts",
  kick: "https://kick.com/kaelithcs",
  instagram: "https://www.instagram.com/kaelithcs",
  tiktok: "https://www.tiktok.com/@kaelithcs",
  // His personal account; the channel has none on X.
  x: "https://x.com/kburakengin",
  faceit: "https://www.faceit.com/tr/players/kaelith",
} as const;

export const socials = [
  { label: "YouTube", href: links.youtube, primary: true },
  { label: "Kick", href: links.kick },
  { label: "Instagram", href: links.instagram },
  { label: "TikTok", href: links.tiktok },
  { label: "X", href: links.x },
  { label: "FACEIT", href: links.faceit },
];

export const fallbackFacts: ChannelFacts = {
  yayin: { gun: "her gece", saat: "23:00" },
  ayarlar: { dpi: 800, sens: 1.15, zoomSens: 1, cozunurluk: "1280x960 4:3 stretched", monitor: "BenQ ZOWIE XL2566X+ 400 Hz", crosshair: "CSEvyeo4xeGaJq4UZpTUTa26HJ5toXrBWdFUFPc9yd25dO" },
};

export const viewmodel = "viewmodel_fov 68; viewmodel_offset_x 2.5; viewmodel_offset_y 2; viewmodel_offset_z -1.5";
export const graphics = "MSAA 2x · gölgeler yüksek · doku ve shader düşük · Reflex açık + boost · Windows fare hızlandırma kapalı";

export const series = [
  { tag: "TAM MAÇ", tone: "faceit", title: "FACEIT 2500 ELO Yolu", text: "Her maç oynandığı sırayla, bölüm bölüm. Kaybettiklerim de dahil.", when: "Pzt · Çar · Cmt 12:00", href: links.youtubeVideos },
  { tag: "HAFTALIK", tone: "red", title: "KAELITH İFŞA", text: "Botum beni ifşa ediyor: elimde bomba varken ölmeler, bıçakla koşarken gidenler.", when: "Pazar 20:00", href: links.youtubeVideos },
  { tag: "ÖZET", tone: "yellow", title: "Haftanın En İyileri", text: "Haftanın bütün 3K, 4K ve ACE'leri tek videoda.", when: "Perşembe 20:00", href: links.youtubeVideos },
  { tag: "SHORTS", tone: "neon", title: "Günün Klipleri", text: "Yayından en iyi anlar, kısa ve dikey.", when: "Her gün 12:30 · 18:00 · 22:30", href: links.youtubeShorts },
] as const;

export const gear = [
  ["MOUSE", "Logitech G PRO X SUPERLIGHT 2 DEX"],
  ["KLAVYE", "Logitech G915 TKL"],
  ["KULAKLIK", "Logitech G PRO X Wireless"],
  ["MOUSEPAD", "SteelSeries QcK Large"],
  ["MONİTÖR", "BenQ ZOWIE XL2566X+ 400 Hz"],
  ["MİKROFON", "ME6S"],
  ["KAMERA", "Konftel Cam20"],
  ["PC", "Ryzen 7 9800X3D · RTX 3070 Ti · 32 GB DDR5"],
] as const;

export const commands = [
  ["!klip", "rastgele klip çalar"],
  ["!kliplistesi", "klip sayfası"],
  ["!kliponer", "klip öner"],
  ["!ifsa", "gecenin ifşa sayacı"],
  ["!kd", "bu yayının K/D"],
  ["!hs", "headshot oranı"],
  ["!skor", "maç skoru"],
  ["!elo", "FACEIT ELO"],
  ["!sens", "fare ayarları"],
  ["!cross", "crosshair kodu"],
  ["!sosyal", "tüm hesaplar"],
] as const;
