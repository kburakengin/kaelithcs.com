"""Builds index.html from the Claude Design canvas's Main.dc.html.

    python -I tools/tasarimdan.py <Main.dc.html> index.html

The canvas is the source of the look (Burak, 14 Oct: "her şeyi Claude Design'a
sor"); this keeps its markup as it is and only swaps what a static page cannot
do: blob urls become img/ files, fixed lists are written out, and the parts that
move (live or not, this week, the ELO road) become <template>s that app.js
fills from Kick and veri/site.json.
"""
import html
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding="utf8").read()
helmet = s.split("<helmet>", 1)[1].split("</helmet>", 1)[0]
body = s.split("</helmet>", 1)[1].split("</x-dc>", 1)[0]

BLOBS = {
    "87456408a4561cd963a1b2756f673320": "img/sahne.webp",
    "86ac3b8a685525a7f677bf89e37eb089": "img/logo.png",
    "e8156db89ab29e67984f257dfac36922": "img/k.png",
    "1ee653d68e4dcc21ad89be079b017119": "img/duvar.jpg",
    "f098c2a5e194d0faffd9ca0baa6868dd": "img/yazi.png",
}
for k, v in BLOBS.items():
    helmet = helmet.replace("/_blob/" + k, v)
    body = body.replace("/_blob/" + k, v)
left = re.findall(r"/_blob/[0-9a-f]+", helmet + body)
assert not left, f"yeni görsel var, BLOBS'a ekle: {left}"


def sc_for(text, var):
    """(start, end, inner) of the <sc-for list="{{var}}"> block."""
    m = re.search(r'<sc-for list="\{\{' + re.escape(var) + r'\}\}"[^>]*>', text)
    assert m, var
    depth, i = 1, m.end()
    while depth:
        a, b = text.find("<sc-for", i), text.find("</sc-for>", i)
        if a != -1 and a < b:
            depth, i = depth + 1, a + 7
        else:
            depth, i = depth - 1, b + 9
    return m.start(), i, text[m.end(): i - 9]


def expand(text, var, rows, fill):
    a, b, inner = sc_for(text, var)
    return text[:a] + "".join(fill(inner, r) for r in rows) + text[b:]


def to_template(text, var, tid, placeholder):
    a, b, inner = sc_for(text, var)
    templates.append(f'<template id="{tid}">{inner}</template>')
    return text[:a] + placeholder + text[b:]


templates = []

# Fixed lists: written out.
COPIES = [
    ("CROSSHAIR", "CSEvyeo4xeGaJq4UZpTUTa26HJ5toXrBWdFUFPc9yd25dO"),
    ("VIEWMODEL", "viewmodel_fov 68; viewmodel_offset_x 2.5; viewmodel_offset_y 2; viewmodel_offset_z -1.5"),
    ("SENS", "sensitivity 1.15; zoom_sensitivity_ratio 1"),
]
COMMANDS = [
    ("!klip", "rastgele klip çalar"), ("!kliplistesi", "klip sayfası"), ("!ifsa", "gecenin ifşa sayacı"),
    ("!kd", "bu yayının K/D"), ("!hs", "headshot oranı"), ("!skor", "maç skoru"), ("!elo", "FACEIT ELO"),
    ("!sens", "fare ayarları"), ("!cross", "crosshair kodu"), ("!sosyal", "tüm hesaplar"),
]


def copy_row(t, r):
    label, value = r
    t = t.replace("{{c.label}}", label).replace("{{c.value}}", html.escape(value))
    t = t.replace('onClick="{{c.copy}}"', 'data-copy="' + html.escape(value, quote=True) + '"')
    return t.replace("{{c.button}}", "Kopyala")


body = expand(body, "copies", COPIES, copy_row)
body = expand(body, "commands", COMMANDS, lambda t, r: t.replace("{{cmd.name}}", r[0]).replace("{{cmd.what}}", r[1]))

# Live stream title: the canvas shows a sample.
body, n = re.subn(r'(line-height: 1\.35")>[^<]*</span>', r'\1 id="canli-baslik"></span>', body)
assert n == 1, "canlı başlık yeri bulunamadı"

# This week: the latest three and the next four days.
body = to_template(body, "latest", "t-latest", '<div id="son-liste" style="display: contents"></div>')
a, b, day_inner = sc_for(body, "days")
day_inner = to_template(day_inner, "day.slots", "t-slot", "{{!slots}}")
slot = templates[-1]
m = re.search(r'<sc-if value="\{\{s\.next\}\}"[^>]*>(.*?)</sc-if>', slot, re.S)
assert m, "SIRADAKİ yeri yok"
templates[-1] = slot.replace(m.group(0), "{{!next}}")
templates.append(f'<template id="t-next">{m.group(1)}</template>')
templates.append(f'<template id="t-day">{day_inner}</template>')
body = body[:a] + '<div id="gun-liste" style="display: contents"></div>' + body[b:]
body, n = re.subn(r"(<!-- Latest three: real links -->\s*<div )", r'\1id="son-cikanlar" ', body)
assert n == 1

# ELO road: the whole section from data.
body = to_template(body, "elo.ticks", "t-tick", "{{!ticks}}")
body = to_template(body, "elo.dots", "t-dot", "{{!dots}}")
m = re.search(r'(<section id="elo"[^>]*>)(.*?)(</section>)', body, re.S)
templates.append(f'<template id="t-elo">{m.group(2)}</template>')
body = body[: m.start()] + m.group(1) + m.group(3) + body[m.end():]

# Live or not: both states stay in the page, a class on <html> picks one.
body, n1 = re.subn(r'<sc-if value="\{\{canli\}\}"[^>]*>', '<div data-canli style="display: contents">', body)
body, n2 = re.subn(r'<sc-if value="\{\{offline\}\}"[^>]*>', '<div data-kapali style="display: contents">', body)
body = body.replace("</sc-if>", "</div>")
assert n1 and n2, (n1, n2)
for t in ("<sc-", "{{"):
    assert t not in body, f"{t} kaldı: {body[body.find(t) - 80: body.find(t) + 80]}"

desc = "Kaelith: gündüz Full Stack yazılımcı, gece FACEIT Level 10. Türkçe CS2 yayını her gece 23:00. Bu haftanın videoları, 2500 ELO yolu, ayarlar ve ekipman."
page = f"""<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>kaelith — Türkçe CS2</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#060807">
<meta property="og:title" content="kaelith — Türkçe CS2">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="https://kaelithcs.com/img/sahne.webp">
<meta property="og:url" content="https://kaelithcs.com/">
<link rel="icon" href="favicon.png">
{helmet.strip()}
<style>
html:not(.canli) [data-canli]{{display:none !important}}
html.canli [data-kapali]{{display:none !important}}
</style>
</head>
<body>
<!-- Built from the Claude Design canvas by tools/tasarimdan.py; edit the canvas, not this file. -->
{body.strip()}
{chr(10).join(templates)}
<script src="app.js"></script>
</body>
</html>
"""
open(out, "w", encoding="utf8", newline="\n").write(page)
print("ok", len(page), "bayt,", len(templates), "şablon")
