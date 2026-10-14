# kaelithcs.com

The site of **Kaelith**, a Turkish CS2 streamer (FACEIT Level 10, on Kick every night at 23:00).
It points viewers to YouTube, or to Kick while the stream is on, and shows what is coming
on the channel, the road to 2500 ELO, settings, gear and the clips viewers can play from chat.

Static, built with [Astro](https://astro.build) and TypeScript, deployed to GitHub Pages.

## How it fits together

```
 kaelith-clipper (stream PC)                      kaelith-stream-deck (tablet panel, Mac)
   src/site.js                                      tablet/klip_sayfasi.py
     │ calendar, ELO, channel facts                   │ clip list with each clip's YouTube cut
     ▼ git push                                       ▼ git push
 public/veri/site.json  (this repo)               kburakengin.github.io/kaelithcs/klipler.json
     │                                                │
     └──────────────► GitHub Actions: npm test, astro build (hourly too) ◄┘
                                │
                                ▼
                     kaelithcs.com (GitHub Pages)
                                │  in the browser:
                                ├─ Kick channel API → live or not (header, hero, buttons)
                                └─ clips page: search, preview dialog, copy
```

Everything that changes on a schedule (calendar, ELO, clips) is rendered **at build time**; the
clipper's push of `site.json` triggers a rebuild. The browser only runs what has to be live:
whether the stream is on, copy buttons, and the clips page's interactions.

Both data files are public, so their producers write them from a whitelist: approved calendar
rows only, a video's title and link only once it is out. Their shapes are in
[`src/lib/types.ts`](src/lib/types.ts), and every row is checked on the way in
([`src/lib/data.ts`](src/lib/data.ts), [`src/lib/clips.ts`](src/lib/clips.ts)).

## Layout

```
src/
  pages/            index.astro (home), klipler.astro (/klipler/)
  layouts/          Base.astro: head, fonts, brand styles, live check
  components/       shared: SiteHeader, SiteFooter, SectionHeading, PlatformButton, CopyField, Icon
    home/           Hero, ThisWeek, EloRoad, About, Series, Settings, Gear, Commands
    clips/          ClipCard, PreviewSheet, CopyToast
  lib/              pure TypeScript, unit tested: schedule, elo, clips, data, types
  scripts/          browser code: live, copy, days, clips-page
  data/channel.ts   links, series, gear, commands (stream time and settings come from site.json)
  styles/           tokens.css (brand), global.css (base and shared primitives)
public/             images, CNAME, veri/site.json
```

The look comes from the Claude Design canvases (home, clips); components follow them, styled
only with the brand tokens in [`src/styles/tokens.css`](src/styles/tokens.css).

## Develop

```sh
npm install
npm run dev        # http://localhost:4321, add ?canli to see the live state
npm test           # vitest: the lib/ functions
npm run build      # astro check (types) + static build into dist/
```
