import { describe, expect, it } from "vitest";
import { clipSeconds, clipsFromOldPage, parseClips, previewUrl, rangeLabel, searchText } from "./clips";
import type { Clip } from "./types";

const clip = (video: Clip["video"]): Clip => ({ title: "Kemal Sunal: Vay canına", cmd: "!klip vay", img: "", video });

describe("the on-stream cut", () => {
  it("says what plays", () => {
    expect(rangeLabel(clip({ id: "kxqYaEMjAYg", start: 12, end: 20 }))).toBe("Yayındaki kısım: 0:12–0:20");
    expect(rangeLabel(clip({ id: "kxqYaEMjAYg", start: 75, end: 0 }))).toBe("Yayındaki kısım: 1:15 – son");
    expect(rangeLabel(clip({ id: "kxqYaEMjAYg", start: 0, end: 0 }))).toBe("Yayındaki kısım: baştan sona");
    expect(rangeLabel(clip(null))).toBe("Önizleme yok");
  });

  it("previews only that cut", () => {
    const url = new URL(previewUrl(clip({ id: "kxqYaEMjAYg", start: 12, end: 20 }))!);
    expect(url.hostname).toBe("www.youtube-nocookie.com");
    expect(url.pathname).toBe("/embed/kxqYaEMjAYg");
    expect([url.searchParams.get("start"), url.searchParams.get("end")]).toEqual(["12", "20"]);
    expect(previewUrl(clip(null))).toBeNull();
    expect(clipSeconds(clip({ id: "kxqYaEMjAYg", start: 12, end: 20 }))).toBe(8);
    expect(clipSeconds(clip({ id: "kxqYaEMjAYg", start: 12, end: 0 }))).toBe(15);
  });

  it("searches in Turkish", () => {
    expect(searchText({ ...clip(null), title: "İVEDİK" })).toContain("ivedik");
  });
});

describe("parseClips", () => {
  it("keeps well-formed rows and safe values only", () => {
    const rows = parseClips([
      { title: "Wow", cmd: "!klip wow", img: "https://i.ytimg.com/vi/maunWLLpJdg/mqdefault.jpg", video: { id: "maunWLLpJdg", start: 3, end: 9 } },
      { title: "X klibi", cmd: "!klip x", img: "javascript:alert(1)", video: { id: "../evil", start: 0, end: 0 } },
      { title: 5, cmd: "!klip bozuk" },
      null,
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0].video).toEqual({ id: "maunWLLpJdg", start: 3, end: 9 });
    expect(rows[1].img).toBe("");
    expect(rows[1].video).toBeNull();
    expect(parseClips({ not: "a list" })).toEqual([]);
  });
});

describe("clipsFromOldPage", () => {
  it("reads the cards of the old page", () => {
    const html = `<ul>
<li><button class="card" data-cmd="!klip maj3r"><span class="pic"><img src="https://i.ytimg.com/vi/EGa14pyC138/mqdefault.jpg" alt="" loading="lazy"></span><b>Maj3r Furia&#x27;ya sinirleniyor</b><code>!klip maj3r</code><span class="ok">Kopyalandı</span></button></li>
<li><button class="card" data-cmd="!klip emo"><span class="pic"><span class="emo">x</span></span><b>Emojili</b><code>!klip emo</code></button></li>
</ul>`;
    expect(clipsFromOldPage(html)).toEqual([
      { title: "Maj3r Furia'ya sinirleniyor", cmd: "!klip maj3r", img: "https://i.ytimg.com/vi/EGa14pyC138/mqdefault.jpg", video: null },
      { title: "Emojili", cmd: "!klip emo", img: "", video: null },
    ]);
  });
});
