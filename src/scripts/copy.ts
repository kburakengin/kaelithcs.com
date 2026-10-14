/**
 * Copy buttons, page-wide: <button data-copy="text"> copies the text and shows
 * data-copied ("Kopyalandı" by default) for a moment. Dispatches "kaelith:copied"
 * so a page can react (the clips page's toast).
 */
export interface CopiedDetail {
  text: string;
  button: HTMLElement;
  /** False if the browser refused every way to copy: the page should show the text to type. */
  ok: boolean;
}

/**
 * The Clipboard API where the browser allows it; the old select-and-copy where
 * it does not (some in-app browsers, the Kick and YouTube apps' own among them).
 * Never waits more than a second: a pending permission must not freeze a tap.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      const ok = await Promise.race([
        navigator.clipboard.writeText(text).then(() => true),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1000)),
      ]);
      if (ok) return true;
    }
  } catch {
    // fall through
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.cssText = "position:fixed;top:0;left:0;opacity:0";
  document.body.append(area);
  area.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    area.remove();
  }
}

export function wireCopyButtons(root: ParentNode = document) {
  root.addEventListener("click", async (e) => {
    const button = (e.target as Element).closest<HTMLElement>("[data-copy]");
    if (!button) return;
    const ok = await copyText(button.dataset.copy!);
    document.dispatchEvent(new CustomEvent<CopiedDetail>("kaelith:copied", { detail: { text: button.dataset.copy!, button, ok } }));
    if (!ok) return;
    const label = button.querySelector<HTMLElement>("[data-copy-label]") ?? button;
    const before = label.dataset.before ?? label.textContent ?? "";
    label.dataset.before = before;
    label.textContent = button.dataset.copied ?? "Kopyalandı";
    button.dataset.state = "copied";
    clearTimeout(Number(button.dataset.timer));
    button.dataset.timer = String(
      setTimeout(() => {
        label.textContent = before;
        delete button.dataset.state;
      }, 1600),
    );
  });
}
