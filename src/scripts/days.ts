import { dayName } from "../lib/schedule";

/**
 * Day names are rendered at build ("Bugün", "Yarın"); after midnight the
 * page may not be rebuilt yet, so the viewer's clock names them again.
 */
export function relabelDays(root: ParentNode = document) {
  const now = new Date();
  for (const day of root.querySelectorAll<HTMLElement>("[data-day]")) {
    const name = day.querySelector<HTMLElement>("[data-day-name]");
    if (!name) continue;
    const label = dayName(new Date(day.dataset.day!), now);
    name.textContent = label;
    day.classList.toggle("today", label === "Bugün");
  }
}
