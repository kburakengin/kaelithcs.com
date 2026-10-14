/**
 * The phone menu in SiteHeader: a popover the Menü button toggles, so the
 * browser gives Escape and tap-outside for free. This keeps the button's state
 * and icon in step, opens the menu right under the bar, and closes it once a
 * section is picked. A browser without popovers gets the same behaviour from
 * the `hidden` attribute.
 */
export function wireMenu() {
  const button = document.querySelector<HTMLButtonElement>("[data-menu-btn]");
  const menu = document.querySelector<HTMLElement>("[data-menu]");
  const bar = button?.closest("header");
  if (!button || !menu || !bar) return;

  const native = "showPopover" in HTMLElement.prototype;
  const place = () => menu.style.setProperty("--menu-top", `${Math.round(bar.getBoundingClientRect().bottom)}px`);
  const mark = (open: boolean) => {
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Menüyü kapat" : "Menü");
    menu.classList.toggle("is-open", open && !native);
  };

  let close: () => void;
  if (native) {
    menu.addEventListener("beforetoggle", (e) => {
      if ((e as ToggleEvent).newState === "open") place();
    });
    menu.addEventListener("toggle", (e) => mark((e as ToggleEvent).newState === "open"));
    close = () => {
      if (menu.matches(":popover-open")) menu.hidePopover();
    };
  } else {
    const set = (open: boolean) => {
      if (open) place();
      menu.hidden = !open;
      mark(open);
    };
    set(false);
    button.addEventListener("click", () => set(Boolean(menu.hidden)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !menu.hidden) {
        set(false);
        button.focus();
      }
    });
    document.addEventListener("click", (e) => {
      const t = e.target as Node;
      if (!menu.hidden && !menu.contains(t) && !button.contains(t)) set(false);
    });
    close = () => set(false);
  }

  menu.addEventListener("click", (e) => {
    if ((e.target as Element).closest("a")) close();
  });
  // Turning a tablet to landscape brings the section row back; drop the menu.
  matchMedia("(min-width: 821px)").addEventListener("change", (e) => {
    if (e.matches) close();
  });
}
