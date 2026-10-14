// kaelithcs.com/klipler: the Claude Design canvas's behaviour on the real list.
// List: klipler.json, which the tablet panel publishes beside the old page
// (kaelith-stream-deck tablet/klip_sayfasi.py): [{title, cmd, img, by, video: {id, start, end} | null}].
// Until that file exists, the old page's cards are read instead (no preview cut then).

const OLD = "https://kburakengin.github.io/kaelithcs/";
const $ = (id) => document.getElementById(id);
const norm = (s) => String(s).toLocaleLowerCase("tr-TR");

let clips = [];
let shown = [];
let copied = null;
let open = null; // index into `shown`
let copyTimer = 0;
let playTimer = 0;
let lastFocus = null;

async function load() {
  try {
    const r = await fetch(OLD + "klipler.json", { cache: "no-cache" });
    if (r.ok) return await r.json();
  } catch {}
  // Older publisher: read the cards of the old page.
  const r = await fetch(OLD + "klipler.html", { cache: "no-cache" });
  const doc = new DOMParser().parseFromString(await r.text(), "text/html");
  return [...doc.querySelectorAll(".card[data-cmd]")].map((b) => {
    // No cut in the old page: no preview, rather than the start of the whole video.
    return { title: b.querySelector("b")?.textContent || "", cmd: b.dataset.cmd, img: b.querySelector("img")?.getAttribute("src") || "", video: null };
  });
}

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
function rangeOf(c) {
  const v = c.video;
  if (!v) return "Önizleme yakında";
  if (v.end > v.start) return `Yayındaki kısım: ${mmss(v.start)}–${mmss(v.end)}`;
  return v.start ? `Yayındaki kısım: ${mmss(v.start)}'den sona` : "Yayındaki kısım: baştan sona";
}
const durOf = (c) => (c.video && c.video.end > c.video.start ? c.video.end - c.video.start : 15);

function copy(text, closeSheet) {
  navigator.clipboard?.writeText(text).catch(() => {});
  copied = text;
  $("toast-komut").textContent = text.trim();
  $("toast").hidden = false;
  if (closeSheet) closeSheetNow();
  render();
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => {
    copied = null;
    $("toast").hidden = true;
    render();
  }, 3000);
}

function render() {
  const q = norm($("ara").value.trim());
  shown = clips.filter((c) => !q || norm(c.title + " " + c.cmd).includes(q));
  const list = $("liste");
  list.textContent = "";
  shown.forEach((c, i) => {
    const li = $("t-kart").content.firstElementChild.cloneNode(true);
    const thumb = li.querySelector("[data-onizle]");
    thumb.setAttribute("aria-label", `${c.title}: önizle`);
    thumb.addEventListener("click", () => openAt(i));
    const img = li.querySelector("[data-resim]");
    if (c.img) img.src = c.img;
    else img.remove();
    if (!c.video) li.querySelector(".k-play").remove(); // nothing to play yet
    li.querySelector("[data-baslik]").textContent = c.title;
    li.querySelector("[data-komut]").textContent = c.cmd;
    const done = copied === c.cmd;
    const btn = li.querySelector("[data-kopyala]");
    const ok = li.querySelector("[data-kopyalandi]");
    btn.hidden = done;
    ok.hidden = !done;
    btn.setAttribute("aria-label", `${c.cmd} komutunu kopyala`);
    ok.setAttribute("aria-label", `${c.cmd} kopyalandı`);
    btn.addEventListener("click", () => copy(c.cmd, false));
    ok.addEventListener("click", () => copy(c.cmd, false));
    list.append(li);
  });
  $("sayi").textContent = shown.length === clips.length ? `${clips.length} klip` : `${shown.length} / ${clips.length} klip`;
  $("bos").hidden = !(clips.length && !shown.length);
  $("bos-q").textContent = $("ara").value.trim();
  $("rastgele-yazi").textContent = copied === "!klip" ? "Kopyalandı" : "!klip";
  $("oner-kopyala").textContent = copied === "!kliponer " ? "Kopyalandı, linki ekle" : "!kliponer kopyala";
}

function stopPlay() {
  clearTimeout(playTimer);
  $("oynatici").querySelector("iframe")?.remove();
  $("sheet-resim").hidden = false;
  $("oynat").hidden = !shown[open]?.video;
  $("oynuyor").hidden = true;
}

function openAt(i) {
  if (!shown[i]) return;
  if (open === null) lastFocus = document.activeElement;
  open = i;
  const c = shown[i];
  stopPlay();
  $("k-sheet-title").textContent = c.title;
  $("sheet-resim").src = c.img || "";
  $("sheet-aralik").textContent = rangeOf(c);
  $("sheet-sira").textContent = `${i + 1} / ${shown.length}`;
  $("sheet-komut").textContent = c.cmd;
  $("onceki").disabled = i <= 0;
  $("sonraki").disabled = i >= shown.length - 1;
  $("sheet").hidden = false;
  $("sheet-kapat").focus();
}

function closeSheetNow() {
  if (open === null) return;
  stopPlay();
  open = null;
  $("sheet").hidden = true;
  lastFocus?.focus?.();
}

// Only the part that plays on stream: YouTube's own start/end.
function play() {
  const c = shown[open];
  if (!c?.video) return;
  const v = c.video;
  const p = new URLSearchParams({ autoplay: "1", playsinline: "1", rel: "0", modestbranding: "1", start: String(v.start || 0) });
  if (v.end > v.start) p.set("end", String(v.end));
  const f = document.createElement("iframe");
  f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.id)}?${p}`;
  f.title = `${c.title} önizleme`;
  f.allow = "autoplay; encrypted-media; picture-in-picture";
  f.style.cssText = "position:absolute;inset:0;width:100%;height:100%;border:0";
  $("oynatici").append(f);
  $("sheet-resim").hidden = true;
  $("oynat").hidden = true;
  $("oynuyor").hidden = false;
  const bar = $("ilerleme");
  bar.style.animation = "none";
  void bar.offsetWidth;
  bar.style.animation = "";
  bar.style.animationDuration = durOf(c) + "s";
  clearTimeout(playTimer);
  playTimer = setTimeout(stopPlay, (durOf(c) + 1) * 1000);
}

$("ara").addEventListener("input", () => {
  closeSheetNow();
  render();
});
$("rastgele").addEventListener("click", () => copy("!klip", false));
$("oner-kopyala").addEventListener("click", () => copy("!kliponer ", false));
$("sheet-bd").addEventListener("click", closeSheetNow);
$("sheet-kapat").addEventListener("click", closeSheetNow);
$("oynat").addEventListener("click", play);
$("durdur").addEventListener("click", stopPlay);
$("sheet-kopyala").addEventListener("click", () => open !== null && copy(shown[open].cmd, true));
$("onceki").addEventListener("click", () => openAt(open - 1));
$("sonraki").addEventListener("click", () => openAt(open + 1));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && open !== null) closeSheetNow();
});

load()
  .then((list) => {
    clips = Array.isArray(list) ? list.filter((c) => c && c.cmd) : [];
    $("yukleniyor").remove();
    render();
  })
  .catch(() => ($("yukleniyor").textContent = "Klip listesi şu an yüklenemedi. Sohbette !kliplistesi yaz."));
