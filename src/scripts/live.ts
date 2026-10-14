/**
 * Live or not, from Kick's channel API (it answers browsers on any origin).
 * Live: <html data-live>, and every [data-live-title] shows the stream title.
 * Offline or unreachable: the page stays as built. `?canli` shows the live
 * state without a stream, to look at it.
 */
const CHANNEL = "https://kick.com/api/v2/channels/kaelithcs";

function setLive(title: string) {
  document.documentElement.dataset.live = "";
  for (const el of document.querySelectorAll<HTMLElement>("[data-live-title]")) el.textContent = title;
}

export async function watchLive() {
  if (new URLSearchParams(location.search).has("canli")) return setLive("Yayın başlığı burada");
  try {
    const r = await fetch(CHANNEL);
    if (!r.ok) return;
    const c = await r.json();
    if (c?.livestream?.is_live) setLive(String(c.livestream.session_title ?? ""));
  } catch {
    // Kick down or blocked: offline it is.
  }
}
