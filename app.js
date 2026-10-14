// kaelithcs.com: fills the parts of the Claude Design page that move.
// index.html carries them as <template>s (tools/tasarimdan.py); the data is
// veri/site.json (kaelith-clipper src/site.js) and Kick's channel API.

const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** {{x.key}} is escaped, {{!key}} is markup this file built. */
function fill(id, data) {
  return $(id).innerHTML.replace(/\{\{\s*(!?)([\w.]+)\s*\}\}/g, (_, raw, path) => {
    const key = raw ? path : path.split(".").slice(1).join(".");
    return raw ? data[key] ?? "" : esc(data[key]);
  });
}

// Colours of the series tags on the page: ELO road orange, best-of yellow,
// İFŞA red, everything else neon.
function kindOf(tur) {
  if (tur.startsWith("2500 ELO")) return { color: "#FF5500", tag: "2500 ELO YOLU" };
  if (tur.startsWith("Haftanın En İyileri")) return { color: "#FFD60A", tag: "EN İYİLER" };
  if (tur.startsWith("KAELITH İFŞA")) return { color: "#FF2E3B", tag: "İFŞA" };
  return { color: "#12FC10", tag: tur.toLocaleUpperCase("tr-TR") };
}

const dayKey = (d) => d.toLocaleDateString("tr-TR");
const weekday = (d, style = "long") => d.toLocaleDateString("tr-TR", { weekday: style });
const clock = (d) => d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

function week(items) {
  const now = new Date();
  const out = items.filter((it) => it.url).slice(-3).reverse();
  if (out.length) {
    $("son-liste").innerHTML = out
      .map((it) => {
        const at = new Date(it.zaman);
        const k = kindOf(it.tur);
        return fill("t-latest", { url: it.url, color: k.color, tag: k.tag, when: `${weekday(at)} · ${clock(at)}`, title: it.baslik || it.tur });
      })
      .join("");
  } else {
    $("son-cikanlar").remove();
  }

  const today = dayKey(now);
  const tomorrow = dayKey(new Date(Date.now() + 86400e3));
  const groups = new Map();
  for (const it of items) {
    const at = new Date(it.zaman);
    if (it.url || at <= now) continue;
    if (!groups.has(dayKey(at))) groups.set(dayKey(at), { at, list: [] });
    groups.get(dayKey(at)).list.push(it);
  }
  const bars = ["78%", "58%", "88%", "66%"];
  let first = true;
  $("gun-liste").innerHTML = [...groups.values()]
    .slice(0, 4)
    .map(({ at, list }) => {
      const isToday = dayKey(at) === today;
      const name = isToday ? "Bugün" : dayKey(at) === tomorrow ? "Yarın" : weekday(at);
      const date = (isToday || name === "Yarın" ? weekday(at, "short") + " " : "") + at.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
      const slots = list
        .map((it, i) => {
          const next = first;
          first = false;
          return fill("t-slot", {
            time: clock(new Date(it.zaman)),
            kind: it.tur,
            color: kindOf(it.tur).color,
            bar: bars[i % bars.length],
            border: next ? "#12FC10" : "transparent",
            bg: next ? "rgba(18,252,16,.06)" : "transparent",
            next: next ? $("t-next").innerHTML : "",
          });
        })
        .join("");
      return fill("t-day", {
        name,
        date,
        nameColor: isToday ? "#12FC10" : "#F2F5F2",
        top: isToday ? "#12FC10" : "#1E2A24",
        border: isToday ? "#2E3D35" : "#1E2A24",
        slots,
      });
    })
    .join("");
}

function eloRoad(e) {
  const pts = (e.maclar || []).map((p) => p.elo).slice(-12);
  if (Number.isFinite(e.simdi) && pts.at(-1) !== e.simdi) pts.push(e.simdi);
  if (pts.length < 2) return;
  const from = e.baslangic || 2000;
  const to = e.hedef || 2500;
  const now = pts.at(-1);
  const step = Math.max(...pts) - Math.min(...pts) > 60 ? 50 : 25;
  const lo = Math.floor((Math.min(...pts) - 15) / step) * step;
  const hi = Math.ceil((Math.max(...pts) + 15) / step) * step;
  const X = (i) => 3 + (i * 94) / (pts.length - 1);
  const Y = (v) => 10 + ((hi - v) * 80) / (hi - lo);
  const ticks = [];
  for (let v = hi - step; v > lo; v -= step) ticks.push(fill("t-tick", { v, top: Y(v) + "%" }));
  const dots = pts.map((v, i) => {
    const last = i === pts.length - 1;
    return fill("t-dot", { left: X(i) + "%", top: Y(v) + "%", size: last ? "18px" : "10px", color: last ? "#FF5500" : "#12FC10", label: last ? `Şu an: ${v}` : `${i + 1}. maç: ${v}` });
  });
  const d = now - pts[0];
  $("elo").innerHTML = fill("t-elo", {
    now,
    first: pts[0],
    left: Math.max(0, to - now),
    count: pts.length,
    delta: (d >= 0 ? "+" : "") + d,
    peak: Math.max(...pts),
    pct: Math.max(0, Math.min(100, ((now - from) / (to - from)) * 100)).toFixed(1) + "%",
    line: pts.map((v, i) => (X(i) * 10).toFixed(1) + "," + (Y(v) * 2).toFixed(1)).join(" "),
    firstLeft: X(0) + "%",
    firstTop: Y(pts[0]) + "%",
    lastTop: Y(now) + "%",
    ticks: ticks.join(""),
    dots: dots.join(""),
  });
}

// Live: Kick's v2 channel API answers the browser. Off or unreachable, the
// page stays in its offline state.
fetch("https://kick.com/api/v2/channels/kaelithcs")
  .then((r) => (r.ok ? r.json() : null))
  .then((c) => {
    if (!c?.livestream?.is_live) return;
    $("canli-baslik").textContent = c.livestream.session_title || "";
    document.documentElement.classList.add("canli");
  })
  .catch(() => {});
// kaelithcs.com/?canli: the live state without a stream, to look at it.
if (new URLSearchParams(location.search).has("canli")) {
  $("canli-baslik").textContent = "Yayın başlığı burada";
  document.documentElement.classList.add("canli");
}

fetch("veri/site.json", { cache: "no-cache" })
  .then((r) => (r.ok ? r.json() : null))
  .then((d) => {
    if (!d) return;
    week(d.takvim || []);
    eloRoad(d.elo || {});
  })
  .catch(() => {});

// Copy buttons: the settings viewers paste into CS2.
for (const b of document.querySelectorAll("[data-copy]")) {
  b.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(b.dataset.copy);
    } catch {
      return;
    }
    b.textContent = "Kopyalandı";
    clearTimeout(b._t);
    b._t = setTimeout(() => (b.textContent = "Kopyala"), 1600);
  });
}
