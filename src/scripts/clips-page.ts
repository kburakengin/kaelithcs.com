/**
 * The clips page in the browser. The cards are rendered at build; this only
 * filters them, runs the preview dialog and shows what was copied.
 */
import { clipSeconds, previewUrl, rangeLabel } from "../lib/clips";
import type { Clip } from "../lib/types";
import { copyText, wireCopyButtons, type CopiedDetail } from "./copy";

const q = <T extends Element>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel)!;

export function startClipsPage() {
  const clips: Clip[] = JSON.parse(q<HTMLScriptElement>("#clips-data").textContent || "[]");
  const cards = [...document.querySelectorAll<HTMLElement>("[data-clip]")];
  const search = q<HTMLInputElement>("[data-search-input]");
  const count = q<HTMLElement>("[data-count]");
  const empty = q<HTMLElement>("[data-empty]");
  const sheet = q<HTMLDialogElement>("[data-sheet]");
  const toast = q<HTMLElement>("[data-toast]");
  let visible = cards.map((_, i) => i);
  let open: number | null = null; // position in `visible`
  let toastTimer = 0;
  let playTimer = 0;

  // Search: show and hide the built cards, Turkish lower-case.
  function filter() {
    const term = search.value.trim().toLocaleLowerCase("tr-TR");
    visible = [];
    cards.forEach((card, i) => {
      const hit = !term || card.dataset.search!.includes(term);
      card.hidden = !hit;
      if (hit) visible.push(i);
    });
    count.textContent = visible.length === cards.length ? `${cards.length} klip` : `${visible.length} / ${cards.length} klip`;
    empty.hidden = visible.length > 0;
    q("[data-empty-term]").textContent = search.value.trim();
  }

  /** What was copied; if the browser would not copy, the command to type instead. */
  function showToast(text: string, ok = true) {
    q("[data-toast-cmd]", toast).textContent = text.trim();
    q("[data-toast-hint]", toast).textContent = ok ? "kopyalandı · sohbete yapıştır" : "kopyalanamadı · sohbete böyle yaz";
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => (toast.hidden = true), 3000);
  }

  function stop() {
    clearTimeout(playTimer);
    q("[data-player] iframe", sheet)?.remove();
    const c = open === null ? null : clips[visible[open]];
    q<HTMLImageElement>("[data-sheet-img]", sheet).hidden = false;
    q<HTMLElement>("[data-play]", sheet).hidden = !c?.video;
    q<HTMLElement>("[data-playing]", sheet).hidden = true;
  }

  function show(pos: number) {
    const c = clips[visible[pos]];
    if (!c) return;
    open = pos;
    stop();
    q("[data-sheet-title]", sheet).textContent = c.title;
    const img = q<HTMLImageElement>("[data-sheet-img]", sheet);
    img.src = c.img;
    img.hidden = !c.img;
    q("[data-sheet-range]", sheet).textContent = rangeLabel(c);
    q("[data-sheet-pos]", sheet).textContent = `${pos + 1} / ${visible.length}`;
    q("[data-sheet-cmd]", sheet).textContent = c.cmd;
    q<HTMLButtonElement>("[data-prev]", sheet).disabled = pos <= 0;
    q<HTMLButtonElement>("[data-next]", sheet).disabled = pos >= visible.length - 1;
    if (!sheet.open) sheet.showModal();
  }

  function play() {
    const c = open === null ? null : clips[visible[open]];
    const url = c && previewUrl(c);
    if (!c || !url) return;
    const frame = document.createElement("iframe");
    frame.src = url;
    frame.title = `${c.title} önizleme`;
    frame.allow = "autoplay; encrypted-media; picture-in-picture";
    q("[data-player]", sheet).append(frame);
    q<HTMLImageElement>("[data-sheet-img]", sheet).hidden = true;
    q<HTMLElement>("[data-play]", sheet).hidden = true;
    q<HTMLElement>("[data-playing]", sheet).hidden = false;
    const bar = q<HTMLElement>("[data-progress]", sheet);
    bar.style.animation = "none";
    void bar.offsetWidth; // restart the fill
    bar.style.animation = "";
    bar.style.animationDuration = `${clipSeconds(c)}s`;
    clearTimeout(playTimer);
    playTimer = window.setTimeout(stop, (clipSeconds(c) + 1) * 1000);
  }

  search.addEventListener("input", filter);
  document.addEventListener("click", (e) => {
    const t = e.target as Element;
    const preview = t.closest<HTMLElement>("[data-preview]");
    if (preview) return show(visible.indexOf(Number(preview.dataset.preview)));
    if (t.closest("[data-sheet-close]") || t === sheet) return sheet.close(); // the backdrop is the dialog itself
    if (t.closest("[data-play]")) return play();
    if (t.closest("[data-stop]")) return stop();
    if (t.closest("[data-prev]") && open !== null) return show(open - 1);
    if (t.closest("[data-next]") && open !== null) return show(open + 1);
    if (t.closest("[data-sheet-copy]") && open !== null) {
      const cmd = clips[visible[open]].cmd;
      copyText(cmd).then((ok) => {
        if (ok) sheet.close();
        showToast(cmd, ok);
      });
    }
  });
  sheet.addEventListener("close", () => {
    stop();
    open = null;
  });
  document.addEventListener("kaelith:copied", (e) => {
    const { text, ok } = (e as CustomEvent<CopiedDetail>).detail;
    showToast(text, ok);
  });
  wireCopyButtons();
  filter();
}
