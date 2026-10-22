// Ghidul de administrare, ca document HTML de sine statator (stiluri si script
// incluse). E servit de ghid/document/route.ts doar utilizatorilor logati in
// admin si afisat intr-un iframe de pagina /admin/ghid. Imaginile sunt marcaje
// {{img:nume}}, inlocuite la servire cu cele din ghid-imagini.ts. Cand se schimba o
// functie din admin, actualizeaza si textul de aici. Tema e fortata pe "dark"
// (ca restul adminului); la tiparire se foloseste varianta deschisa.
export const GHID_HTML = `<!doctype html>
<html lang="ro" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Ghid de administrare 12 ROUNDS</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
/* Layout: cuprins fix în stânga pe ecran lat, conținut într-o coloană de lectură; pe telefon cuprinsul devine un meniu pliabil. */
:root {
  --bg: #f2f2f1;
  --surface: #ffffff;
  --surface-2: #ebebea;
  --ink: #151515;
  --muted: #5a5a58;
  --line: #d9d9d6;
  --accent: #c40500;
  --accent-soft: #fbe4e2;
  --ok: #17794a;
  --ok-soft: #dcf1e5;
  --warn: #8a5a00;
  --warn-soft: #f8ecd2;
  --info: #1d4f8c;
  --info-soft: #e0ebf8;
  --font-display: 'Barlow Condensed', 'Arial Narrow', Impact, sans-serif;
  --font-body: 'Barlow', Arial, Helvetica, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #0b0b0b; --surface: #141414; --surface-2: #1e1e1e; --ink: #f1f1ef; --muted: #a1a19e; --line: #2c2c2a;
    --accent: #ff4339; --accent-soft: #2c1412; --ok: #46d08c; --ok-soft: #10281c; --warn: #e8b44f; --warn-soft: #2b2210;
    --info: #7db4f2; --info-soft: #122236; color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --bg: #0b0b0b; --surface: #141414; --surface-2: #1e1e1e; --ink: #f1f1ef; --muted: #a1a19e; --line: #2c2c2a;
  --accent: #ff4339; --accent-soft: #2c1412; --ok: #46d08c; --ok-soft: #10281c; --warn: #e8b44f; --warn-soft: #2b2210;
  --info: #7db4f2; --info-soft: #122236; color-scheme: dark;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; scroll-padding-top: 20px; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
body {
  background: var(--bg); color: var(--ink);
  font-family: var(--font-body); font-size: 16px; line-height: 1.6;
  padding-left: max(16px, env(safe-area-inset-left, 0px));
  padding-right: max(16px, env(safe-area-inset-right, 0px));
  padding-block: 0 72px;
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3 { font-family: var(--font-display); font-weight: 700; line-height: 1.1; text-wrap: balance; margin: 0; letter-spacing: .01em; }
h2 { font-size: 34px; text-transform: uppercase; letter-spacing: .03em; }
h3 { font-size: 23px; margin-top: 34px; margin-bottom: 10px; }
h4 { font-family: var(--font-display); font-size: 17px; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); margin: 24px 0 8px; }
p { margin: 0 0 14px; max-width: 68ch; }
a { color: var(--accent); text-underline-offset: 3px; }
code, .path { font-family: var(--font-mono); font-size: .86em; background: var(--surface-2); padding: 1px 6px; border-radius: 4px; word-break: break-word; }
ul, ol { margin: 0 0 16px; padding-left: 22px; max-width: 68ch; }
li { margin-bottom: 6px; }
li > ul, li > ol { margin-top: 6px; margin-bottom: 0; }
:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; border-radius: 3px; }

/* antet */
.masthead { max-width: 1160px; margin: 0 auto; padding-block: 44px 28px; border-bottom: 3px solid var(--accent); }
.masthead .kicker { font-family: var(--font-display); text-transform: uppercase; letter-spacing: .18em; font-size: 15px; color: var(--accent); font-weight: 600; }
.masthead h1 { font-size: clamp(44px, 8vw, 84px); text-transform: uppercase; margin: 6px 0 12px; }
.masthead p { color: var(--muted); font-size: 18px; max-width: 62ch; margin-bottom: 8px; }
.masthead .meta { font-family: var(--font-mono); font-size: 13px; color: var(--muted); }

/* schelet cu cuprins */
.shell { max-width: 1160px; margin: 0 auto; display: grid; grid-template-columns: 236px minmax(0, 1fr); gap: 48px; padding-top: 32px; }
.toc { position: sticky; top: 20px; align-self: start; max-height: calc(100vh - 40px); overflow-y: auto; padding-right: 8px; }
.toc summary { display: none; }
.toc-group { font-family: var(--font-display); text-transform: uppercase; letter-spacing: .14em; font-size: 13px; color: var(--muted); margin: 18px 0 6px; font-weight: 600; }
.toc-group:first-child { margin-top: 0; }
.toc a { display: block; padding: 5px 10px; margin-left: -10px; color: var(--ink); text-decoration: none; font-size: 15px; border-left: 3px solid transparent; border-radius: 0 4px 4px 0; }
.toc a:hover { background: var(--surface-2); }
.toc a.activ { border-left-color: var(--accent); background: var(--accent-soft); font-weight: 600; }
@media (max-width: 899px) {
  .shell { grid-template-columns: minmax(0, 1fr); gap: 0; padding-top: 16px; }
  .toc { position: static; max-height: none; overflow: visible; padding: 0; margin-bottom: 24px; background: var(--surface); border: 1px solid var(--line); border-radius: 6px; }
  .toc summary { display: block; cursor: pointer; padding: 14px 16px; font-family: var(--font-display); font-size: 19px; text-transform: uppercase; letter-spacing: .08em; font-weight: 600; }
  .toc .toc-inner { padding: 0 16px 14px; }
}

/* secțiuni */
section { padding-block: 44px; border-bottom: 1px solid var(--line); }
section:first-of-type { padding-top: 8px; }
section:last-of-type { border-bottom: 0; }
.sec-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 14px; margin-bottom: 14px; }
.lead { font-size: 18px; color: var(--muted); max-width: 64ch; }

/* etichete rol / rută */
.rol { display: inline-block; font-family: var(--font-display); font-size: 14px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; padding: 2px 9px; border-radius: 3px; border: 1px solid currentColor; vertical-align: middle; }
.rol.admin { color: var(--accent); }
.rol.mod { color: var(--info); }
.rol.op { color: var(--ok); }
.roluri { display: inline-flex; flex-wrap: wrap; gap: 6px; }

/* casete */
.nota { border: 1px solid var(--line); border-left-width: 5px; border-radius: 4px; padding: 14px 16px; margin: 18px 0; background: var(--surface); max-width: 72ch; }
.nota > :last-child { margin-bottom: 0; }
.nota .eticheta { font-family: var(--font-display); font-size: 15px; text-transform: uppercase; letter-spacing: .12em; font-weight: 700; display: block; margin-bottom: 4px; }
.nota.stiai { border-left-color: var(--info); } .nota.stiai .eticheta { color: var(--info); }
.nota.atentie { border-left-color: var(--warn); background: var(--warn-soft); } .nota.atentie .eticheta { color: var(--warn); }
.nota.important { border-left-color: var(--accent); } .nota.important .eticheta { color: var(--accent); }

/* tabele */
.tabel { overflow-x: auto; margin: 16px 0 22px; border: 1px solid var(--line); border-radius: 6px; background: var(--surface); }
table { border-collapse: collapse; width: 100%; min-width: 560px; font-size: 15px; }
th, td { text-align: left; padding: 10px 14px; border-bottom: 1px solid var(--line); vertical-align: top; }
th { font-family: var(--font-display); text-transform: uppercase; letter-spacing: .08em; font-size: 14px; background: var(--surface-2); font-weight: 600; white-space: nowrap; }
tr:last-child td { border-bottom: 0; }
td.centru, th.centru { text-align: center; }
.da { color: var(--ok); font-weight: 700; }
.nu { color: var(--muted); }

/* pași reali (secvențe) */
.pasi { list-style: none; padding: 0; counter-reset: pas; max-width: 72ch; }
.pasi > li { counter-increment: pas; position: relative; padding: 2px 0 14px 48px; margin: 0; }
.pasi > li::before { content: counter(pas); position: absolute; left: 0; top: 0; width: 32px; height: 32px; border-radius: 50%; background: var(--accent); color: #fff; font-family: var(--font-display); font-weight: 700; font-size: 18px; display: grid; place-items: center; }
.pasi > li::after { content: ''; position: absolute; left: 15px; top: 34px; bottom: 2px; width: 2px; background: var(--line); }
.pasi > li:last-child::after { display: none; }
.pasi > li > b:first-child { display: block; font-size: 17px; }

/* diagrama traseului */
.traseu { margin: 22px 0 8px; }
.traseu-rand { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; position: relative; }
.etapa { background: var(--surface); border: 1px solid var(--line); border-top: 4px solid var(--accent); border-radius: 4px; padding: 14px; }
.etapa .cine { font-family: var(--font-display); text-transform: uppercase; letter-spacing: .12em; font-size: 13px; color: var(--muted); font-weight: 600; }
.etapa b { display: block; font-family: var(--font-display); font-size: 24px; line-height: 1.1; margin: 2px 0 8px; }
.etapa p { font-size: 14.5px; margin-bottom: 10px; }
.stare { display: inline-block; font-family: var(--font-mono); font-size: 12px; background: var(--surface-2); padding: 2px 7px; border-radius: 3px; margin: 0 4px 4px 0; }
.sageata { text-align: center; color: var(--accent); font-family: var(--font-display); font-size: 15px; letter-spacing: .1em; text-transform: uppercase; font-weight: 600; margin: 8px 0; }
.sageata::before, .sageata::after { content: '↓'; display: inline-block; margin: 0 10px; font-size: 20px; }
.ramuri { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.ramura { background: var(--surface); border: 1px solid var(--line); border-top: 4px solid var(--ink); border-radius: 4px; padding: 12px 14px; }
.ramura b { display: block; font-family: var(--font-display); font-size: 20px; line-height: 1.1; margin-bottom: 6px; }
.ramura p { font-size: 14px; margin-bottom: 8px; }
.ramura .unde { font-size: 13px; color: var(--muted); }
@media (max-width: 899px) { .ramuri { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 640px) { .traseu-rand, .ramuri { grid-template-columns: minmax(0, 1fr); } }

/* statusuri */
.badge { display: inline-block; font-family: var(--font-display); text-transform: uppercase; letter-spacing: .06em; font-size: 14px; font-weight: 700; padding: 2px 10px; border-radius: 999px; border: 1px solid var(--muted); color: var(--muted); }
.badge.live { background: var(--accent); border-color: var(--accent); color: #fff; }
.badge.upcoming { color: var(--ink); border-color: var(--ink); }
.badge.anulat { background: var(--accent-soft); color: var(--accent); border-color: var(--accent); }

/* liste de verificare */
.lista-verif { list-style: none; padding: 0; max-width: 72ch; }
.lista-verif li { margin-bottom: 4px; }
.lista-verif label { display: flex; gap: 12px; align-items: flex-start; padding: 8px 10px; border-radius: 4px; cursor: pointer; }
.lista-verif label:hover { background: var(--surface-2); }
.lista-verif input { width: 20px; height: 20px; margin-top: 3px; flex: none; accent-color: var(--accent); }
.lista-verif input:checked + span { color: var(--muted); text-decoration: line-through; }
.reset { font: inherit; font-size: 14px; background: none; border: 1px solid var(--line); color: var(--muted); border-radius: 4px; padding: 4px 12px; cursor: pointer; margin-top: 6px; }
.reset:hover { color: var(--ink); border-color: var(--ink); }

.dl { display: grid; grid-template-columns: minmax(150px, 220px) minmax(0, 1fr); gap: 0; border: 1px solid var(--line); border-radius: 6px; background: var(--surface); margin: 14px 0 22px; overflow: hidden; }
.dl dt, .dl dd { padding: 10px 14px; margin: 0; border-bottom: 1px solid var(--line); }
.dl dt { font-weight: 600; background: var(--surface-2); }
.dl dt:last-of-type, .dl dd:last-of-type { border-bottom: 0; }
@media (max-width: 560px) { .dl { grid-template-columns: minmax(0, 1fr); } .dl dt { border-bottom: 0; padding-bottom: 2px; } }

.fig { margin: 20px 0 28px; max-width: 100%; }
.fig.ingust { max-width: 780px; }
.fig img { display: block; width: 100%; height: auto; border: 1px solid var(--line); border-radius: 6px; background: #0b0b0b; }
.fig figcaption { font-size: 14.5px; color: var(--muted); margin-top: 10px; max-width: 78ch; line-height: 1.6; }
.fig figcaption b { color: var(--ink); }
.cn { display: inline-grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; background: #ffd60a; color: #111; font: 700 12px/1 Arial, sans-serif; margin: 0 3px 0 1px; vertical-align: 1px; }
.toc-print { display: none; }

@media print {
  @page { size: A4; margin: 15mm 14mm 16mm; }
  :root, :root:not([data-theme="light"]), :root[data-theme="dark"] {
    --bg: #ffffff; --surface: #ffffff; --surface-2: #efefed; --ink: #151515; --muted: #55554f; --line: #cfcfca;
    --accent: #c40500; --accent-soft: #fbe4e2; --ok: #17794a; --ok-soft: #dcf1e5; --warn: #8a5a00; --warn-soft: #f8ecd2;
    --info: #1d4f8c; --info-soft: #e0ebf8; color-scheme: light;
  }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html { scroll-behavior: auto; }
  body { padding: 0; background: #fff; font-size: 11.5pt; line-height: 1.5; }
  .masthead { padding-block: 0 14px; }
  .masthead h1 { font-size: 46pt; }
  .shell { display: block; padding-top: 14px; }
  .toc { display: none; }
  .toc-print { display: block; margin-bottom: 8px; padding: 14px 18px 8px; border: 1px solid var(--line); border-radius: 4px; break-after: page; columns: 2; column-gap: 28px; }
  .toc-print::before { content: 'Cuprins'; display: block; column-span: all; font-family: var(--font-display); font-size: 26pt; text-transform: uppercase; letter-spacing: .04em; font-weight: 700; margin-bottom: 6px; }
  .toc-print .tp-group { break-inside: avoid; }
  .toc-print .toc-group { margin: 14px 0 4px; break-after: avoid; }
  .toc-print a { display: block; padding: 3px 0; margin: 0; border: 0; color: var(--ink); text-decoration: none; font-size: 12pt; break-inside: avoid; }
  section { padding-block: 22px; border-bottom: 1px solid var(--line); }
  section:first-of-type { padding-top: 0; }
  h2 { break-after: avoid; font-size: 28pt; }
  h3, h4 { break-after: avoid; }
  h3 { margin-top: 22px; }
  .tabel { overflow: visible; }
  table { min-width: 0; font-size: 10.5pt; }
  tr, .nota, .etapa, .ramura, .pasi > li, .fig { break-inside: avoid; }
  .fig img { max-height: 235mm; width: auto; max-width: 100%; }
  th, td { padding: 7px 10px; }
  .dl dt, .dl dd { break-inside: avoid; }
  .reset { display: none; }
  footer.sfarsit { margin-top: 18px; }
}

footer.sfarsit { max-width: 1160px; margin: 0 auto; padding-top: 28px; color: var(--muted); font-size: 14px; border-top: 3px solid var(--accent); }
</style>

<header class="masthead">
  <div class="kicker">12 ROUNDS · The Battle of the Bands</div>
  <h1>Ghid de administrare</h1>
  <p>Cum folosim zona de administrare a site-ului 12rounds.ro: ce face fiecare pagină, cine are acces și cum arată traseul unei dedicații de la plată până pe ecrane și pe stream.</p>
  <div class="meta">Versiunea de pe main · actualizat 22 octombrie 2026 · pentru echipa 12 ROUNDS</div>
</header>

<div class="shell">
  <details class="toc" id="toc" open>
    <summary>Cuprins</summary>
    <nav class="toc-inner" aria-label="Cuprins">
      <div class="toc-group">Bază</div>
      <a href="#prezentare">Prezentare generală</a>
      <a href="#acces">Acces și roluri</a>
      <a href="#dashboard">Dashboard</a>
      <div class="toc-group">Ediții</div>
      <a href="#evenimente">Adaugi și editezi un eveniment</a>
      <a href="#statusuri">Statusurile unei ediții</a>
      <a href="#anulare">Anulare sau amânare</a>
      <div class="toc-group">Dedicații</div>
      <a href="#traseu">Traseul unei dedicații</a>
      <a href="#moderare">Moderare</a>
      <a href="#difuzare">Difuzare: sală, stream, prezentator</a>
      <a href="#dedicatii">Arhiva de dedicații</a>
      <div class="toc-group">Echipament</div>
      <a href="#ecrane">Ecrane din sală</a>
      <a href="#overlay">Overlay pentru stream</a>
      <div class="toc-group">Administrare</div>
      <a href="#alte">Sponsori, Statistici, Setări</a>
      <div class="toc-group">Operare</div>
      <a href="#seara">Liste de verificare</a>
      <a href="#probleme">Când ceva nu merge</a>
      <a href="#limite">Ce nu face (încă) panoul</a>
      <a href="#adrese">Adrese utile</a>
    </nav>
  </details>

  <nav class="toc-print" id="toc-print" aria-label="Cuprins"></nav>

  <main>

<!-- ============ PREZENTARE ============ -->
<section id="prezentare">
  <div class="sec-head"><h2>Prezentare generală</h2></div>
  <p class="lead">Platforma vinde dedicații pentru un show live. Publicul le trimite de pe telefon, echipa le verifică, iar mesajele aprobate apar pe ecranele din sală, în transmisiunea live sau sunt citite de prezentator.</p>

  <dl class="dl">
    <dt>Site-ul public</dt><dd><span class="path">12rounds.ro</span> · homepage, pagina fiecărei ediții cu formularul de dedicații, pagina clientului unde își urmărește dedicația.</dd>
    <dt>Zona de administrare</dt><dd><span class="path">/admin</span> · ce descrie acest ghid. Intri cu email și parolă.</dd>
    <dt>Ecrane din sală</dt><dd><span class="path">/ecran/…</span> · pagini kiosk pe TV-uri sau tablete, cu link propriu pentru fiecare ecran. Rulează singure, fără operator.</dd>
    <dt>Overlay pentru stream</dt><dd><span class="path">/overlay/…</span> · pagini cu fundal transparent, puse ca Browser Source în OBS sau vMix, câte una pentru YouTube, Instagram și TikTok.</dd>
    <dt>Plăți</dt><dd>Stripe (Apple Pay, Google Pay, card). Rambursările se fac tot prin Stripe, din panou.</dd>
    <dt>Email și facturi</dt><dd>Confirmarea către client pleacă prin Resend. Facturile se emit prin integrarea Stripe–SmartBill; panoul doar semnalează cazurile care cer intervenție.</dd>
  </dl>

  <div class="nota stiai"><span class="eticheta">De știut</span>
    <p>Toate paginile din panou se actualizează singure (moderarea, regia, ecranele). Nu trebuie să reîncarci pagina ca să vezi mesaje noi.</p>
    <p>Imaginile din ghid arată panoul cu date de exemplu: numele, mesajele și sumele sunt inventate. Cifrele galbene din imagini se regăsesc în legenda de sub fiecare.</p>
  </div>
</section>

<!-- ============ ACCES ============ -->
<section id="acces">
  <div class="sec-head"><h2>Acces și roluri</h2></div>
  <p>Te autentifici la <span class="path">/admin/login</span> cu email și parolă. După login ajungi direct în pagina ta de lucru: admin la Dashboard, moderator la Moderare, operator la Regie.</p>

  <h3>Cine poate ce</h3>
  <div class="tabel"><table>
    <thead><tr><th>Pagină sau acțiune</th><th class="centru">Admin</th><th class="centru">Moderator</th><th class="centru">Operator</th></tr></thead>
    <tbody>
      <tr><td>Dashboard, editor de eveniment, creare ediții</td><td class="centru da">da</td><td class="centru nu">nu</td><td class="centru nu">nu</td></tr>
      <tr><td>Moderare (aprobă și respinge mesaje)</td><td class="centru da">da</td><td class="centru da">da</td><td class="centru nu">nu</td></tr>
      <tr><td>Regie (coada prezentatorului)</td><td class="centru da">da</td><td class="centru nu">nu</td><td class="centru da">da</td></tr>
      <tr><td>Dedicații (arhivă, filtre, export CSV)</td><td class="centru da">da</td><td class="centru da">da</td><td class="centru nu">nu</td></tr>
      <tr><td>Retrimite pe ecran sau pe stream</td><td class="centru da">da</td><td class="centru da">da</td><td class="centru nu">nu</td></tr>
      <tr><td>Sumele în lei din Dedicații și din export</td><td class="centru da">da</td><td class="centru nu">nu</td><td class="centru nu">nu</td></tr>
      <tr><td>Rambursări</td><td class="centru da">da</td><td class="centru nu">nu</td><td class="centru nu">nu</td></tr>
      <tr><td>Dedicație manuală, facturi cu probleme</td><td class="centru da">da</td><td class="centru nu">nu</td><td class="centru nu">nu</td></tr>
      <tr><td>Ecrane, Sponsori, Statistici, Setări</td><td class="centru da">da</td><td class="centru nu">nu</td><td class="centru nu">nu</td></tr>
    </tbody>
  </table></div>
  <p>Restricțiile se verifică pe server la fiecare cerere. Dacă deschizi o pagină pentru care nu ai drept, vezi „Acces restricționat”.</p>

  <div class="nota atentie"><span class="eticheta">Atenție</span>
    <p>Cât timp site-ul este protejat cu parolă („Revenim în curând”, vezi <a href="#alte">Setări</a>), și <span class="path">/admin</span> trece prin acea parolă. Echipa o introduce o dată pe dispozitiv, înainte de login.</p>
  </div>
  <div class="nota stiai"><span class="eticheta">De știut</span>
    <p>Nu există un ecran de gestionare a conturilor în panou. Conturile noi se creează în Supabase (Authentication) și li se atribuie rolul în tabela <code>moderatori</code>. Cere acest lucru dezvoltatorului.</p>
  </div>
</section>

<!-- ============ DASHBOARD ============ -->
<section id="dashboard">
  <div class="sec-head"><h2>Dashboard</h2><span class="roluri"><span class="rol admin">Admin</span></span></div>
  <p><span class="path">/admin</span> este punctul de plecare al administratorului.</p>
  <ul>
    <li><b>Cardul „LIVE ACUM”</b> apare doar când o ediție este live. Arată patru cifre: câte mesaje așteaptă moderarea, câte sunt în coada prezentatorului, câte au fost difuzate și încasările. Dedesubt ai scurtături spre Moderare, Regie, Ecrane și editorul ediției.</li>
    <li><b>Toate edițiile</b> este lista tuturor edițiilor, cu status, dată, număr de dedicații plătite și încasări. Un click deschide editorul.</li>
    <li><b>+ Eveniment nou</b> creează o ediție goală și te duce direct în editor.</li>
    <li><b>Curăță poze vechi (48h+)</b> șterge pozele încărcate de clienți care nu au ajuns la o dedicație plătită (cineva a urcat o poză, dar nu a mai plătit). Se rulează din când în când, nu e nevoie în timpul show-ului.</li>
  </ul>

<figure class="fig">
  <img src="{{img:dashboard}}" alt="Dashboard-ul administratorului, cu o ediție live">
  <figcaption>Dashboard-ul în timpul unui show. <span class="cn">1</span> creează o ediție nouă. <span class="cn">2</span> șterge pozele rămase de la plăți nefinalizate. <span class="cn">3</span> este cardul ediției live, cu cifrele de moment și scurtături spre Moderare, Regie, Ecrane și editor. Dedesubt, lista tuturor edițiilor.</figcaption>
</figure>
</section>

<!-- ============ EVENIMENTE ============ -->
<section id="evenimente">
  <div class="sec-head"><h2>Adaugi și editezi un eveniment</h2><span class="roluri"><span class="rol admin">Admin</span></span></div>
  <p>Un eveniment este o ediție a show-ului (de exemplu „Luis Gabriel vs. Alex Botea”). Fiecare ediție are pagina ei publică, tarifele ei și linkurile ei de overlay.</p>

  <h3>Cum creezi o ediție nouă</h3>
  <ol class="pasi">
    <li><b>Apasă „+ Eveniment nou” în Dashboard.</b>Se creează o ediție numită „Eveniment nou”, cu status „urmează” și cu un slug generat automat. Ești dus în editor.</li>
    <li><b>Completează detaliile.</b>Titlu, subtitlu, slug, descriere, informații importante, dată, locație și cei doi artiști (câmpurile sunt descrise mai jos).</li>
    <li><b>Setează tarifele.</b>Alege ce tipuri de dedicații se vând și la ce preț.</li>
    <li><b>Adaugă coperta și linkurile de stream.</b>Coperta apare pe pagina publică și la share-uri; linkurile apar pe pagină și în emailul clientului.</li>
    <li><b>Apasă „Salvează”.</b>Abia atunci se scriu în baza de date câmpurile de text, tarifele, linkurile și coperta.</li>
  </ol>

  <div class="nota important"><span class="eticheta">Important</span>
    <p>Ediția nouă pornește cu formularul de dedicații <b>ascuns</b>. Pe pagina publică se vede doar „Dedicațiile vor fi disponibile în timpul evenimentului live”. Îl activezi tu, din editor, când vrei să vinzi.</p>
  </div>

  <h3>Câmpurile din editor, în ordinea în care apar</h3>
  <dl class="dl">
    <dt>Status</dt><dd>Butoanele de la începutul paginii. Se aplică imediat, fără „Salvează”. Vezi <a href="#statusuri">Statusurile unei ediții</a>.</dd>
    <dt>Formular public de dedicații</dt><dd>Comutator „Activează formularul” / „Ascunde formularul”. Se aplică imediat. Funcționează independent de status, deci poți ține ediția live fără să vinzi încă.</dd>
    <dt>Copertă</dt><dd>Click pe imagine pentru a o schimba. Recomandat 1200×630 px. Se salvează odată cu restul, la „Salvează”.</dd>
    <dt>Titlu și subtitlu</dt><dd>Apar în bannerul paginii publice.</dd>
    <dt>Slug</dt><dd>Partea din adresă: <span class="path">/eveniment/slug</span>. Butonul „Din titlu” îl generează. Slug-ul face parte și din linkurile de overlay, deci nu-l schimba după ce ai trimis sau configurat linkuri. Două evenimente nu pot avea același slug.</dd>
    <dt>Descriere</dt><dd>Text liber. Fiecare rând nou devine un paragraf pe pagină.</dd>
    <dt>Informații importante</dt><dd>Acces, ora show-ului, preț bilet, dress code, contact. O linie care începe cu <code>- </code> devine element de listă, grupat sub linia de deasupra. Dacă lași câmpul gol, secțiunea nu apare deloc. Același câmp servește și pentru anunțuri (vezi <a href="#anulare">Anulare sau amânare</a>).</dd>
    <dt>Data și ora show-ului</dt><dd>Introdu ora locală, ca pe ceas. Pagina publică o afișează pe fusul Europe/București.</dd>
    <dt>Locație, Artist A, Artist B</dt><dd>Apar în bara de informații și ca „Confruntarea: A vs. B”.</dd>
    <dt>Tarife</dt><dd>Un rând pentru fiecare dintre cele patru tipuri de dedicații. Bifezi „activ” ca tipul să apară pe pagina publică, treci prețul în lei, poți scrie o descriere proprie și o ordine de afișare. Un tip activ cu prețul gol rămâne la 0 lei. O ediție fără niciun tip activ nu poate porni LIVE.</dd>
    <dt>Interval rotație overlay stream</dt><dd>Câte secunde rămâne fiecare dedicație pe overlay-ul de stream. Implicit 12, minim 3.</dd>
    <dt>Cifrele ediției</dt><dd>Spectatori și momente live. Le completezi după eveniment; apar în Arhivă pe pagina publică. Dacă lași un câmp gol, cifra nu se afișează.</dd>
    <dt>Galerie foto</dt><dd>Poze adăugate după show. Apar pe pagina ediției doar după ce ediția este marcată „încheiat”. Pozele se încarcă și se șterg imediat, fără „Salvează”.</dd>
    <dt>Linkuri stream</dt><dd>YouTube, Facebook, TikTok, Instagram, Telegram. Cele completate apar pe pagina publică, iar linkul de YouTube se adaugă în emailul de confirmare pentru dedicațiile care ajung pe stream.</dd>
    <dt>Overlay stream (OBS / vMix)</dt><dd>Cele trei linkuri de overlay ale ediției. Vezi <a href="#overlay">Overlay pentru stream</a>.</dd>
    <dt>Cod QR</dt><dd>QR către <span class="path">12rounds.ro/live</span>, care duce publicul la ediția live. Îl descarci ca PNG și îl pui pe afișe sau pe ecrane. Adresa nu se schimbă de la o ediție la alta.</dd>
  </dl>
</section>

<!-- ============ STATUSURI ============ -->
<section id="statusuri">
  <div class="sec-head"><h2>Statusurile unei ediții</h2><span class="roluri"><span class="rol admin">Admin</span></span></div>
  <p>Statusul spune întregii platforme ce se întâmplă cu ediția. Se schimbă din butoanele de la începutul editorului.</p>

  <div class="tabel"><table>
    <thead><tr><th>Status</th><th>Ce se întâmplă</th><th>Butoane</th></tr></thead>
    <tbody>
      <tr><td><span class="badge upcoming">urmează</span></td><td>Pagina publică arată „Rezervă o dedicație” (dacă formularul este activ). Plățile sunt <b>rezervări</b> pentru ediția viitoare. Ecranele din sală arată logo-ul, iar overlay-ul nu difuzează nimic.</td><td>Pornește LIVE · Anulează</td></tr>
      <tr><td><span class="badge live">live</span></td><td>Pagina arată „Trimite o dedicație”. Ecranele din sală și overlay-ul difuzează dedicațiile aprobate. Pe homepage ediția apare ca „Live acum”, iar <span class="path">/live</span> duce direct la ea.</td><td>Încheie show-ul · Anulează</td></tr>
      <tr><td><span class="badge">încheiat</span></td><td>Nu se mai acceptă plăți. Ecranele revin la logo, iar overlay-ul nu mai afișează nimic. Pagina publică arată cifrele ediției, galeria foto și linkul spre ediția următoare.</td><td>Redeschide</td></tr>
      <tr><td><span class="badge anulat">anulat</span></td><td>Badge roșu „ANULAT” pe pagina ediției. Nu se mai acceptă plăți și dispar formularele. Rămâne vizibil textul din „Informații importante”. Ediția nu mai apare pe homepage.</td><td>Redeschide</td></tr>
    </tbody>
  </table></div>

  <figure class="fig ingust">
  <img src="{{img:editor-status}}" alt="Blocul de status din editorul unei ediții, urmat de tarife">
  <figcaption>Începutul editorului unei ediții cu status „urmează”. <span class="cn">1</span> pornește ediția LIVE, <span class="cn">2</span> o anulează, <span class="cn">3</span> activează formularul public de dedicații (se aplică imediat). Dedesubt sunt tarifele: bifa „activ”, prețul în lei, descrierea și ordinea fiecărui tip.</figcaption>
</figure>
<p>„Redeschide” întoarce ediția la „urmează”. De acolo o poți porni din nou LIVE.</p>

  <div class="nota atentie"><span class="eticheta">Atenție</span>
    <p>Ține <b>o singură ediție live</b> o dată. Ecranele din sală caută ediția live și nu știu să aleagă între două.</p>
  </div>
  <div class="nota stiai"><span class="eticheta">De știut</span>
    <p>La „Pornește LIVE” primești o confirmare, iar platforma refuză dacă niciun tip de dedicație nu este activ în Tarife. „Încheie show-ul” oprește imediat difuzarea pe ecrane și pe stream.</p>
  </div>
</section>

<!-- ============ ANULARE ============ -->
<section id="anulare">
  <div class="sec-head"><h2>Anulare sau amânare</h2><span class="roluri"><span class="rol admin">Admin</span></span></div>
  <p>Când un show se amână sau se anulează, faci doi pași în editorul ediției.</p>
  <ol class="pasi">
    <li><b>Scrie anunțul în „Informații importante”.</b>Înlocuiește textul vechi (ore de acces, prețuri) cu anunțul. Fiecare paragraf pe un rând separat. Apasă „Salvează”.</li>
    <li><b>Apasă „✕ Anulează”.</b>Confirmi în fereastra care apare. Pagina primește badge-ul roșu „ANULAT”, iar plățile se opresc.</li>
  </ol>
  <p>Dacă data nouă se stabilește, apasă „Redeschide”, actualizează data și anunțul și pornești din nou de la „urmează”.</p>

  <div class="nota important"><span class="eticheta">Important</span>
    <p>Pentru o <b>amânare</b> în care rezervările rămân valabile, nu rambursa nimic. Pentru o <b>anulare definitivă</b>, formularul de rezervare promite clienților rambursare integrală. Rambursările se fac una câte una, din Arhiva de dedicații (butonul „Rambursează”). Nu există rambursare în masă.</p>
  </div>
</section>

<!-- ============ TRASEU ============ -->
<section id="traseu">
  <div class="sec-head"><h2>Traseul unei dedicații</h2></div>
  <p class="lead">De la telefonul clientului până pe ecran, o dedicație trece prin trei etape. Fiecare etapă lasă o urmă în baza de date, pe care o vezi în panou ca „stare”.</p>

  <div class="traseu">
    <div class="traseu-rand">
      <div class="etapa">
        <span class="cine">Clientul</span>
        <b>Trimite și plătește</b>
        <p>Completează formularul de pe pagina ediției și plătește prin Stripe.</p>
        <span class="stare">plată: pending → paid</span>
      </div>
      <div class="etapa">
        <span class="cine">Moderatorul</span>
        <b>Aprobă sau respinge</b>
        <p>Citește mesajul și poza, apoi decide. Un mesaj respins poate fi rambursat.</p>
        <span class="stare">moderare: in_verificare</span> <span class="stare">aprobat / respins</span>
      </div>
      <div class="etapa">
        <span class="cine">Sistemul sau regia</span>
        <b>Difuzează</b>
        <p>Dedicația aprobată intră automat în coada canalului ei, în funcție de tip.</p>
        <span class="stare">difuzare: în așteptare → difuzat</span>
      </div>
    </div>
    <div class="sageata">în funcție de tipul dedicației</div>
    <div class="ramuri">
      <div class="ramura">
        <b>Dedicație pe ecranele din sală</b>
        <p>Apare pe toate ecranele fizice, apoi o singură dată și pe stream.</p>
        <span class="unde">automat · <a href="#ecrane">Ecrane</a></span>
      </div>
      <div class="ramura">
        <b>Dedicație în transmisiunea live</b>
        <p>Apare doar pe overlay-ul de stream, o singură dată.</p>
        <span class="unde">automat · <a href="#overlay">Overlay</a></span>
      </div>
      <div class="ramura">
        <b>Dedicație citită de prezentator</b>
        <p>Intră în coada din Regie. Operatorul o trimite „Pe rând”, prezentatorul o citește.</p>
        <span class="unde">manual · Regie</span>
      </div>
      <div class="ramura">
        <b>Susține show-ul</b>
        <p>Nu are mesaj de difuzat. Clientul susține show-ul fără să apară nicăieri.</p>
        <span class="unde">fără difuzare</span>
      </div>
    </div>
  </div>

  <h3>Pasul 1. Ce face clientul</h3>
  <ol class="pasi">
    <li><b>Ajunge pe pagina ediției.</b>Prin QR, prin <span class="path">12rounds.ro/live</span> sau printr-un link de platformă (de exemplu <code>?src=tiktok</code>). Sursa se păstrează și o vezi în panou, ca să știi de unde vin banii.</li>
    <li><b>Alege tipul de dedicație</b>dintre cele active la ediția respectivă, cu prețurile setate de tine.</li>
    <li><b>Completează mesajul.</b>„De la”, „Pentru” și mesajul (maximum 300 de caractere). Pentru dedicațiile de pe ecran și de pe stream alege și un cadou animat dintre cele zece: coroană, inimă, trofeu, fulger, diamant, stea, flacără, rachetă, trandafir, șampanie. Pentru ecran poate adăuga și o poză (opțional).</li>
    <li><b>Își scrie numele complet</b>(necesar pentru factură) și bifează acordul GDPR.</li>
    <li><b>Plătește</b>cu Apple Pay, Google Pay sau card.</li>
  </ol>
  <p>Cât timp ediția este „urmează”, plata este o <b>rezervare</b>: mesajul intră în coadă când ediția devine live. Cât timp este „live”, intră direct la moderare.</p>

  <h4>Filtrul automat din formular</h4>
  <ul>
    <li><b>Limbajul nepotrivit</b> blochează trimiterea. Clientul trebuie să reformuleze mesajul și nu apucă să plătească.</li>
    <li><b>Foarte multe majuscule, un link sau un număr de telefon</b> nu blochează nimic, dar mesajul ajunge la moderare cu un semn ⚠ de avertizare.</li>
    <li>Pozele acceptate sunt jpeg, png sau webp, maximum 6 MB. Sistemul le redimensionează automat.</li>
  </ul>

  <h3>Pasul 2. Ce se întâmplă după plată</h3>
  <ul>
    <li>Stripe confirmă plata, iar dedicația trece pe „paid”. Clientul primește pe email o confirmare cu linkul spre pagina lui de urmărire, <span class="path">/status/…</span>. Pentru ecran și stream, emailul conține și linkul de YouTube al ediției, dacă l-ai completat.</li>
    <li>Factura se emite prin integrarea Stripe–SmartBill. Dacă lipsește numele clientului, dedicația este marcată pentru intervenție manuală (vezi <a href="#dedicatii">Arhiva de dedicații</a>). O problemă de facturare nu oprește niciodată dedicația.</li>
    <li>Dedicația apare în <a href="#moderare">Moderare</a>.</li>
  </ul>

  <h3>Pasul 3. Ce vede clientul</h3>
  <p>Pe pagina lui de urmărire, actualizată singură, clientul vede pașii: plata confirmată, mesaj în verificare, mesaj aprobat, programat pentru difuzare, difuzat. Dacă mesajul este respins, vede motivul scris de moderator. Dedicațiile lui se regăsesc și la <span class="path">/dedicatiile-mele</span>, din același browser, fără cont.</p>

  <figure class="fig">
  <img src="{{img:status-client}}" alt="Pagina de urmărire a clientului, în patru situații">
  <figcaption>Cum își vede clientul dedicația pe pagina lui, care se actualizează singură. De la stânga: <b>în verificare</b> (plata e confirmată, moderatorul citește mesajul), <b>aprobat</b> (urmează difuzarea), <b>difuzat</b> (toți pașii sunt bifați) și <b>respins</b> (clientul vede motivul scris de moderator și primește rambursarea).</figcaption>
</figure>
<h3>Cele trei stări ale unei dedicații</h3>
  <p>În panou o dedicație are trei stări independente. Le vezi ca etichete și le poți filtra în Arhivă.</p>
  <div class="tabel"><table>
    <thead><tr><th>Stare</th><th>Valori</th><th>Se schimbă când</th></tr></thead>
    <tbody>
      <tr><td>Plată</td><td><code>pending</code> <code>paid</code> <code>refunded</code> <code>expired</code></td><td>Clientul plătește (paid), plata nu se finalizează (expired), adminul rambursează (refunded).</td></tr>
      <tr><td>Moderare</td><td><code>in_verificare</code> <code>aprobat</code> <code>respins</code></td><td>Moderatorul apasă Aprobă sau Respinge.</td></tr>
      <tr><td>Difuzare</td><td><code>in_asteptare</code> <code>programat</code> <code>difuzat</code></td><td>Ecranele afișează dedicația (difuzat) sau Regia o trimite „Pe rând” (programat).</td></tr>
    </tbody>
  </table></div>
</section>

<!-- ============ MODERARE ============ -->
<section id="moderare">
  <div class="sec-head"><h2>Moderare</h2><span class="roluri"><span class="rol admin">Admin</span><span class="rol mod">Moderator</span></span></div>
  <p><span class="path">/admin/moderare</span> este coada mesajelor plătite care așteaptă verificarea, în ordinea sosirii. Se actualizează singură.</p>

  <h3>Cum lucrezi în pagină</h3>
  <ul>
    <li><b>Alegi ediția</b> din lista de sus. Implicit este cea live. Poți alege și o ediție viitoare, ca să aprobi din timp rezervările.</li>
    <li><b>Bifezi „Sunet la mesaje noi”</b> ca să auzi un semnal când sosește un mesaj. Sunetul sună doar pentru mesajele apărute după ce ai deschis pagina, nu pentru coada deja existentă. Alegerea rămâne în browserul tău.</li>
    <li>Fiecare mesaj arată tipul, suma, sursa, textul, „de la” și „pentru”, eventual poza și avertizările ⚠.</li>
  </ul>

  <figure class="fig">
  <img src="{{img:moderare}}" alt="Pagina Moderare, cu trei mesaje în așteptare">
  <figcaption>Coada de moderare. <span class="cn">1</span> alegi ediția. <span class="cn">2</span> pornești sunetul pentru mesaje noi. La un mesaj cu poză ai trei decizii: <span class="cn">3</span> aprobi mesajul și poza, <span class="cn">4</span> aprobi doar textul sau <span class="cn">5</span> respingi tot. <span class="cn">6</span> este o avertizare automată (aici, mesajul conține un link): mesajul nu e blocat, dar îl citești cu atenție. La un mesaj fără poză apar doar <span class="cn">7</span> Aprobă și <span class="cn">8</span> Respinge.</figcaption>
</figure>
<h3>Ce faci cu un mesaj</h3>
  <dl class="dl">
    <dt>Aprobă</dt><dd>Mesajul intră în coada de difuzare a tipului lui. Pentru ecran și stream, nu mai ai nimic de făcut: apare automat, cât timp ediția este live.</dd>
    <dt>Respinge</dt><dd>Ți se cere motivul, pe care îl vede clientul. Apoi platforma întreabă „Trimiți și rambursarea acum?”. Rambursarea poate fi făcută doar de admin; dacă ești moderator, primești mesajul să anunți un admin, iar adminul o face ulterior din Arhivă.</dd>
    <dt>Aprobă și poza</dt><dd>Doar la mesajele cu poză. Aprobă textul și poza.</dd>
    <dt>Aprobă doar textul</dt><dd>Mesajul trece, poza se șterge. Util când textul e în regulă, dar poza nu.</dd>
    <dt>Respinge tot</dt><dd>Respinge mesajul și șterge poza.</dd>
  </dl>

  <h3>La ce te uiți</h3>
  <ul>
    <li>Insulte, limbaj vulgar sau jignitor la adresa artiștilor, a publicului sau a unor persoane.</li>
    <li>Reclame, linkuri și numere de telefon (platforma le semnalează cu ⚠).</li>
    <li>Mesaje scrise integral cu majuscule (semnalate cu ⚠).</li>
    <li>Pozele: conținut nepotrivit, imagini cu terți fără legătură, texte sau logo-uri comerciale.</li>
  </ul>

  <div class="nota important"><span class="eticheta">Important</span>
    <p>Nimic nu ajunge pe ecrane sau pe stream fără aprobare. Singura excepție este dedicația manuală a adminului, dacă lasă bifat „Aprobă automat”.</p>
  </div>
  <div class="nota stiai"><span class="eticheta">De știut</span>
    <p>Pozele rămân într-un spațiu privat până la aprobare. Abia după „Aprobă și poza” ajung într-un spațiu public, de unde le citesc ecranele.</p>
  </div>
</section>

<!-- ============ DIFUZARE ============ -->
<section id="difuzare">
  <div class="sec-head"><h2>Difuzare: sală, stream, prezentator</h2></div>
  <p>Cât timp ediția este <span class="badge live">live</span>, dedicațiile plătite și aprobate pornesc singure spre canalul lor. Iată regulile fiecărui canal.</p>

  <h3>Ecranele din sală</h3>
  <ul>
    <li>Toate ecranele arată <b>aceeași</b> dedicație în același moment.</li>
    <li>Fiecare dedicație stă pe ecran 12 secunde (valoarea implicită), apoi urmează următoarea.</li>
    <li>Ordinea: întâi cele afișate de mai puține ori, apoi cele mai vechi. O dedicație se afișează de cel mult <b>două ori</b>.</li>
    <li>Când nu mai e nimic de arătat, ecranele afișează logo-ul 12 ROUNDS, nu un ecran negru.</li>
    <li>Pozele aprobate apar împreună cu mesajul.</li>
  </ul>

  <figure class="fig ingust">
  <img src="{{img:ecran-sala}}" alt="O dedicație afișată pe un ecran din sală">
  <figcaption>O dedicație afișată pe ecranul din sală: destinatarul, mesajul, expeditorul și cadoul ales de client (aici, un trandafir). Același material apare ulterior, o singură dată, și pe stream.</figcaption>
</figure>
<h3>Transmisiunea live (overlay)</h3>
  <ul>
    <li>Overlay-ul preia dedicațiile de tip „stream” și pe cele de tip „ecran”. Cele din sală apar astfel și pe live.</li>
    <li>Fiecare dedicație apare pe stream <b>o singură dată</b>, în ordinea sosirii.</li>
    <li>Durata este cea din „Interval rotație overlay stream” (implicit 12 secunde). Un text lung poate rula puțin mai mult.</li>
    <li>Cele trei overlay-uri (YouTube, Instagram, TikTok) arată aceeași dedicație în același moment.</li>
    <li>Fără dedicații în coadă, overlay-ul nu afișează nimic (la YouTube rămâne doar codul QR din colț).</li>
  </ul>

  <h3>Prezentatorul <span class="roluri" style="margin-left:6px"><span class="rol admin">Admin</span><span class="rol op">Operator</span></span></h3>
  <p><span class="path">/admin/regie</span> este făcută pentru o tabletă. Arată doar dedicațiile de tip „prezentator”, aprobate și plătite.</p>
  <ol class="pasi">
    <li><b>Alegi ediția</b>din lista de sus (implicit cea live).</li>
    <li><b>Apeși „▶ Pe rând”</b>pe un mesaj din „Coada aprobată”. Mesajul urcă la „Acum la prezentator”, unde prezentatorul îl citește.</li>
    <li><b>Apeși „✓ Citit — următorul”</b>după ce a fost citit. Mesajul trece pe „difuzat”, iar următorul poate fi trimis.</li>
  </ol>
  <figure class="fig ingust">
  <img src="{{img:regie}}" alt="Pagina Regie, pe care o folosește operatorul">
  <figcaption>Regia, gândită pentru tabletă. <span class="cn">1</span> este mesajul care se citește acum, iar <span class="cn">2</span> îl marchează ca citit. În „Coada aprobată”, <span class="cn">3</span> trimite următorul mesaj la prezentator.</figcaption>
</figure>
<p>Poți avea un singur mesaj „Acum la prezentator”. Dacă încerci să mai trimiți unul, platforma cere să marchezi întâi ca „Citit” mesajul curent.</p>
</section>

<!-- ============ DEDICATII ============ -->
<section id="dedicatii">
  <div class="sec-head"><h2>Arhiva de dedicații</h2><span class="roluri"><span class="rol admin">Admin</span><span class="rol mod">Moderator</span></span></div>
  <p><span class="path">/admin/dedicatii</span> arată toate dedicațiile din toate edițiile. Aici cauți, corectezi și retrimiți.</p>

  <h3>Căutare și filtre</h3>
  <ul>
    <li>Taburi după difuzare: Toate, În așteptare, Programat, Difuzat, fiecare cu numărul ei.</li>
    <li>Filtre: ediție, stare plată, stare moderare, sursă (de exemplu „qr” sau „tiktok”), căutare în text, „de la” și „pentru”, interval de date.</li>
    <li>„Emailuri nereușite” arată dedicațiile al căror email de confirmare nu a plecat. „Facturi cu probleme” (doar admin) arată cele cu factura marcată manual sau cu eroare.</li>
    <li><b>Export CSV</b> descarcă rezultatele filtrate (până la 5.000 de rânduri). Pentru moderatori fișierul nu conține coloana cu sume.</li>
    <li>Lista are 25 de dedicații pe pagină.</li>
  </ul>

  <figure class="fig">
  <img src="{{img:dedicatii}}" alt="Arhiva de dedicații, cu filtre și o dedicație desfăcută">
  <figcaption>Arhiva de dedicații. <span class="cn">1</span> deschide formularul pentru dedicație manuală (doar admin). <span class="cn">2</span> sunt taburile după starea difuzării, cu numărul din fiecare. <span class="cn">3</span> sunt filtrele. <span class="cn">4</span> exportă rezultatele în CSV. Prima dedicație este desfăcută și arată acțiunile posibile: <span class="cn">5</span> rambursarea (doar admin) și <span class="cn">6</span> retrimiterea pe ecrane și pe stream.</figcaption>
</figure>
<h3>Ce poți face pe o dedicație</h3>
  <p>Click pe un rând îl desface. Acțiunile apar în funcție de situație:</p>
  <dl class="dl">
    <dt>Aprobă / Respinge</dt><dd>Doar dacă dedicația este încă „in_verificare”.</dd>
    <dt>Rambursează <span class="rol admin" style="font-size:12px">Admin</span></dt><dd>Pentru dedicațiile plătite. Trimite rambursarea integrală prin Stripe și trece plata pe „refunded”. Dedicația nu mai este difuzată. Dacă factura fusese deja emisă, dedicația apare la „Facturi cu probleme”, cu mențiunea „necesită stornare”: factura se stornează manual în SmartBill.</dd>
    <dt>↺ Arată din nou pe ecran + stream</dt><dd>Pentru dedicațiile de tip „ecran” deja difuzate. O pune în fața cozii, pe ecrane și pe stream.</dd>
    <dt>↺ Retrimite pe stream</dt><dd>Pentru dedicațiile de tip „stream”, plătite și aprobate. O pune în fața cozii de pe overlay.</dd>
    <dt>Reîncearcă emiterea <span class="rol admin" style="font-size:12px">Admin</span></dt><dd>Pe dedicațiile cu problemă de facturare. Corectezi numele complet al clientului și apeși butonul; factura se emite din nou prin integrare.</dd>
    <dt>Retrimite email</dt><dd>Pe dedicațiile cu email nereușit. Platforma arată și motivul erorii.</dd>
  </dl>

  <h3>Dedicație manuală <span class="rol admin" style="margin-left:6px">Admin</span></h3>
  <p>Cardul „+ Adaugă dedicație manuală (fără plată)” este rezerva pentru situația în care plățile online au o problemă, sau pentru teste și dedicații oferite gratuit.</p>
  <ul>
    <li>Alegi ediția, tipul, „de la”, „pentru”, mesajul, cadoul (pentru ecran și stream) și suma în lei (0 dacă este gratuită).</li>
    <li>Dedicația intră direct ca „plătită”, cu sursa <code>admin-manual</code>, ca s-o găsești ușor în filtre.</li>
    <li>Bifa „Aprobă automat” o ocolește pe cea de moderare. Debifează-o dacă vrei să treacă prin Moderare.</li>
  </ul>
  <figure class="fig">
  <img src="{{img:dedicatie-manuala}}" alt="Formularul de dedicație manuală">
  <figcaption>Formularul de dedicație manuală, desfăcut. Alegi <span class="cn">1</span> ediția și <span class="cn">2</span> tipul, apoi completezi <span class="cn">3</span> „de la”, <span class="cn">4</span> „pentru”, <span class="cn">5</span> suma în lei (0 dacă e gratuită) și <span class="cn">6</span> mesajul. Pentru ecran și stream alegi <span class="cn">7</span> cadoul. <span class="cn">8</span> decide dacă trece prin Moderare sau intră direct aprobată. <span class="cn">9</span> adaugă dedicația.</figcaption>
</figure>
<div class="nota stiai"><span class="eticheta">De știut</span>
    <p>Dedicațiile manuale rămân în listă și în statistici. Pentru teste, pune suma 0 și filtrează după sursa <code>admin-manual</code>.</p>
  </div>
</section>

<!-- ============ ECRANE ============ -->
<section id="ecrane">
  <div class="sec-head"><h2>Ecrane din sală</h2><span class="roluri"><span class="rol admin">Admin</span></span></div>
  <p><span class="path">/admin/ecrane</span> gestionează ecranele fizice (TV, tabletă, monitor). Poți avea oricâte, iar fiecare are propriul link cu cheie unică.</p>

  <h3>Cum conectezi un ecran</h3>
  <ol class="pasi">
    <li><b>Apasă „+ Adaugă ecran”.</b>Se creează un ecran nou, cu un link complet și o cheie generată automat.</li>
    <li><b>Apasă „Copiază link”.</b></li>
    <li><b>Deschide linkul pe dispozitivul din sală,</b>într-un browser în ecran complet (mod kiosk). De acolo, ecranul rulează singur.</li>
    <li><b>Verifică în panou</b>că apare „● online”. Un ecran este online dacă a cerut conținut în ultimele 15 secunde.</li>
  </ol>

  <figure class="fig ingust">
  <img src="{{img:ecrane}}" alt="Pagina Ecrane, cu trei ecrane configurate">
  <figcaption>Lista ecranelor. <span class="cn">1</span> adaugă un ecran nou. <span class="cn">2</span> arată că ecranul a cerut conținut în ultimele 15 secunde. <span class="cn">3</span> copiază linkul pe care îl deschizi pe dispozitivul din sală. <span class="cn">4</span> oprește ecranul, iar <span class="cn">5</span> schimbă cheia, ca vechiul link să nu mai funcționeze.</figcaption>
</figure>
<h3>Ce poți face cu fiecare ecran</h3>
  <dl class="dl">
    <dt>Redenumește</dt><dd>De exemplu „Bar” sau „Scenă stânga”.</dd>
    <dt>Dezactivează / Activează</dt><dd>Un ecran dezactivat nu mai afișează nimic.</dd>
    <dt>Regenerează token</dt><dd>Creează o cheie nouă. Vechiul link nu mai funcționează. Folosește-l dacă linkul a ajuns unde nu trebuie.</dd>
    <dt>Șterge</dt><dd>Elimină ecranul definitiv. Linkul lui nu mai merge.</dd>
  </dl>
  <p>Fiecare ecran arată și ce afișează acum („Acum: …”).</p>
  <div class="nota atentie"><span class="eticheta">Atenție</span>
    <p>Linkul unui ecran este secret. Trimite-l doar dispozitivului care îl afișează. Ecranele funcționează și când site-ul este protejat cu parolă.</p>
  </div>
</section>

<!-- ============ OVERLAY ============ -->
<section id="overlay">
  <div class="sec-head"><h2>Overlay pentru stream</h2><span class="roluri"><span class="rol admin">Admin</span></span></div>
  <p>Overlay-ul este o pagină cu fundal transparent, pusă în OBS sau vMix peste imaginea camerei. Linkurile sunt în editorul ediției, la secțiunea „Overlay stream (OBS / vMix)”, unde fiecare are buton de copiere.</p>

  <div class="tabel"><table>
    <thead><tr><th>Platformă</th><th>Format</th><th>Adresă</th></tr></thead>
    <tbody>
      <tr><td>YouTube</td><td>16:9, 1920×1080</td><td><code>/overlay/slug/16-9?key=…</code></td></tr>
      <tr><td>Instagram</td><td>9:16, 1080×1920</td><td><code>/overlay/slug/instagram?key=…</code></td></tr>
      <tr><td>TikTok</td><td>9:16, 1080×1920</td><td><code>/overlay/slug/tiktok?key=…</code></td></tr>
    </tbody>
  </table></div>

  <figure class="fig ingust">
  <img src="{{img:overlay-16-9}}" alt="Overlay-ul 16:9 pentru YouTube, peste imaginea camerei">
  <figcaption>Overlay-ul pentru YouTube (16:9) cu o dedicație activă, peste imaginea camerei (în imagine, un fundal de exemplu). Fundalul overlay-ului este transparent, deci camera se vede în rest.</figcaption>
</figure>
<h3>Cum îl adaugi în OBS sau vMix</h3>
  <ol class="pasi">
    <li><b>Adaugă o sursă „Browser”.</b>Lipește linkul copiat din editor.</li>
    <li><b>Setează dimensiunea</b>din tabelul de mai sus.</li>
    <li><b>Pune câte o scenă pentru fiecare platformă.</b>Poți ține toate trei deschise simultan, în surse separate. Arată aceeași dedicație în același moment.</li>
  </ol>

  <h3>Layout-ul pentru Instagram și TikTok</h3>
  <p>Pe formatul vertical, overlay-ul nu este un card mic peste imagine, ci un layout complet, cu trei zone:</p>
  <ul>
    <li><b>Zona video</b>, o fereastră transparentă pentru camera live.</li>
    <li><b>Coloana din dreapta</b>, unde apare dedicația cu cadoul animat. Este mereu vizibilă, ca element de grafică.</li>
    <li><b>Zona de jos</b>, un fundal întunecat rezervat comentariilor afișate de platformă.</li>
  </ul>
  <div class="tabel"><table>
    <thead><tr><th>Platformă</th><th>Poziția camerei (în canvasul 1080×1920)</th></tr></thead>
    <tbody>
      <tr><td>Instagram</td><td>x 4 · y 104 · lățime 748 · înălțime 1180</td></tr>
      <tr><td>TikTok</td><td>x 4 · y 200 · lățime 748 · înălțime 1060</td></tr>
    </tbody>
  </table></div>
  <figure class="fig ingust">
  <img src="{{img:overlay-9-16}}" alt="Layout-urile verticale pentru Instagram și TikTok">
  <figcaption>Layout-urile verticale (9:16) cu o dedicație activă. Camera se vede în fereastra din stânga, dedicația apare în coloana din dreapta, iar zona întunecată de jos este rezervată comentariilor platformei. Fereastra camerei diferă puțin între Instagram și TikTok.</figcaption>
</figure>
<div class="nota atentie"><span class="eticheta">Atenție</span>
    <p>Pentru Instagram și TikTok, sursa video (camera) trebuie poziționată în dreptunghiul de mai sus, nu pe tot canvasul. Fiecare platformă are propria scenă în OBS.</p>
  </div>

  <h3>Reguli de știut</h3>
  <ul>
    <li>Overlay-ul arată dedicații <b>doar cât timp ediția este live</b>. Înainte de „Pornește LIVE” și după „Încheie show-ul” rămâne gol.</li>
    <li>Linkul conține o cheie secretă. Nu-l publica și nu-l trimite în afara echipei.</li>
    <li>Vechiul link <code>/overlay/slug/9-16</code> te redirecționează automat către cel de Instagram, deci configurările mai vechi nu se strică.</li>
    <li>Linkul <code>/overlay?key=…</code>, fără slug, alege singur ediția live. E o variantă de rezervă, în format 16:9.</li>
    <li>Dacă în editor apare mesajul „Lipsește OVERLAY_SECRET”, cheia nu este configurată pe server. Spune-i dezvoltatorului.</li>
  </ul>
</section>

<!-- ============ ALTE ============ -->
<section id="alte">
  <div class="sec-head"><h2>Sponsori, Statistici, Setări</h2><span class="roluri"><span class="rol admin">Admin</span></span></div>

  <h3>Sponsori</h3>
  <p><span class="path">/admin/sponsori</span> controlează secțiunea „Parteneri” de pe prima pagină. Fără niciun sponsor activ, secțiunea nu apare.</p>
  <ul>
    <li><b>Adaugi un sponsor</b> cu nume, nivel (partener principal sau susținător), ediție (sau „Global” pentru toate edițiile), link, ordine (numărul mai mic apare mai în față) și logo. Fără logo, apare doar numele.</li>
    <li><b>Dezactivezi</b> un sponsor ca să dispară temporar, fără să-l ștergi. <b>Ștergi</b> doar când nu mai ai nevoie de el.</li>
    <li>Un sponsor existent nu se editează. Pentru a-i schimba datele, îl ștergi și îl adaugi din nou.</li>
  </ul>

  <h3>Statistici</h3>
  <p><span class="path">/admin/statistici</span> arată, pentru o ediție la alegere:</p>
  <ul>
    <li>total încasat și total rambursat;</li>
    <li>numărul de dedicații pe tip, cu procente;</li>
    <li>sursa dedicațiilor (qr, tiktok, youtube…), ca să știi ce canal aduce vânzări;</li>
    <li>câte mesaje au fost aprobate și câte respinse;</li>
    <li>câte au fost difuzate din total.</li>
  </ul>
  <p>Se numără dedicațiile plătite și cele rambursate.</p>

  <h3>Setări</h3>
  <p><span class="path">/admin/setari</span> conține setările valabile pentru tot site-ul, indiferent de ediție.</p>
  <dl class="dl">
    <dt>Acces la site</dt><dd>Comută între „public (fără parolă)” și „protejat”. Când este protejat, vizitatorii văd „Revenim în curând” până introduc parola. Rămân libere oricând ecranele din sală, overlay-urile și webhook-ul Stripe. Schimbarea ajunge la vizitatori în cel mult 15 secunde.</dd>
    <dt>Google Tag ID</dt><dd>Codul din Google Analytics (de forma <code>G-XXXXXXXXXX</code>). Se încarcă pe tot site-ul public, dar nu pe ecrane și pe overlay. Lăsat gol, Analytics este oprit.</dd>
  </dl>
</section>

<!-- ============ SEARA ============ -->
<section id="seara">
  <div class="sec-head"><h2>Liste de verificare</h2></div>
  <p>Bifele se păstrează în acest browser. Le poți folosi ca listă de lucru în seara show-ului.</p>

  <h3>Înainte de eveniment</h3>
  <ul class="lista-verif" data-grup="inainte">
    <li><label><input type="checkbox" id="v1"><span>Ediția are titlu, dată, locație, artiști, copertă și informații importante.</span></label></li>
    <li><label><input type="checkbox" id="v2"><span>Tarifele sunt setate (tipuri active, prețuri) și ordinea este cea dorită.</span></label></li>
    <li><label><input type="checkbox" id="v3"><span>Linkurile de stream sunt completate (cel puțin YouTube, pentru emailuri).</span></label></li>
    <li><label><input type="checkbox" id="v4"><span>Sponsorii activi sunt cei corecți.</span></label></li>
    <li><label><input type="checkbox" id="v5"><span>Ecranele sunt adăugate și apar „online”.</span></label></li>
    <li><label><input type="checkbox" id="v6"><span>Cele trei overlay-uri sunt adăugate în OBS sau vMix, iar camera este poziționată corect pe Instagram și TikTok.</span></label></li>
    <li><label><input type="checkbox" id="v7"><span>Contul fiecărui moderator și operator a fost testat cu login.</span></label></li>
  </ul>

  <h3>Seara show-ului</h3>
  <ul class="lista-verif" data-grup="seara">
    <li><label><input type="checkbox" id="s1"><span>Site-ul este public (Setări) și formularul de dedicații este <b>activat</b> în editorul ediției.</span></label></li>
    <li><label><input type="checkbox" id="s2"><span>Statusul ediției este „live”, iar nicio altă ediție nu este live.</span></label></li>
    <li><label><input type="checkbox" id="s3"><span>Moderarea este deschisă, cu sunetul pornit.</span></label></li>
    <li><label><input type="checkbox" id="s4"><span>Regia este deschisă pe tabletă la operator.</span></label></li>
    <li><label><input type="checkbox" id="s5"><span>Test: o dedicație manuală (suma 0, aprobată automat) apare pe ecrane și pe cele trei overlay-uri.</span></label></li>
    <li><label><input type="checkbox" id="s6"><span>Pe parcurs: mesajele noi se aprobă sau se resping repede, iar mesajele „prezentator” se trimit „Pe rând” la ritmul show-ului.</span></label></li>
    <li><label><input type="checkbox" id="s7"><span>La final: „Încheie show-ul”.</span></label></li>
  </ul>

  <h3>După eveniment</h3>
  <ul class="lista-verif" data-grup="dupa">
    <li><label><input type="checkbox" id="d1"><span>Completezi cifrele ediției (spectatori, momente live) și adaugi pozele în galerie.</span></label></li>
    <li><label><input type="checkbox" id="d2"><span>Verifici în Arhivă filtrele „Facturi cu probleme” și „Emailuri nereușite” și rezolvi cazurile.</span></label></li>
    <li><label><input type="checkbox" id="d3"><span>Rambursezi mesajele respinse, dacă nu ai făcut-o deja la moderare.</span></label></li>
    <li><label><input type="checkbox" id="d4"><span>Te uiți în Statistici la încasări și surse.</span></label></li>
    <li><label><input type="checkbox" id="d5"><span>Rulezi „Curăță poze vechi” din Dashboard.</span></label></li>
  </ul>
  <button type="button" class="reset" id="reset-verif">Șterge toate bifele</button>
</section>

<!-- ============ PROBLEME ============ -->
<section id="probleme">
  <div class="sec-head"><h2>Când ceva nu merge</h2></div>
  <div class="tabel"><table>
    <thead><tr><th>Ce vezi</th><th>De ce se întâmplă și ce faci</th></tr></thead>
    <tbody>
      <tr><td>Ecranul din sală arată doar logo-ul</td><td>Ediția nu este „live”, nu există dedicații aprobate încă sau toate au fost deja afișate de două ori. Verifică statusul și coada din Moderare. Dacă ecranul apare „offline”, verifică internetul dispozitivului și redeschide linkul.</td></tr>
      <tr><td>Overlay-ul de stream nu arată nimic</td><td>La fel ca mai sus: ediția trebuie să fie live și să existe dedicații aprobate, neafișate încă pe stream. Verifică și că linkul conține cheia corectă (copiază-l din nou din editor).</td></tr>
      <tr><td>O dedicație aprobată nu apare pe stream</td><td>Pe stream apare o singură dată. Dacă a trecut deja, folosește „↺ Retrimite pe stream” (sau „↺ Arată din nou pe ecran + stream” la cele de tip ecran), din Arhivă.</td></tr>
      <tr><td>Plățile online nu merg</td><td>Folosește „Adaugă dedicație manuală” ca rezervă. Suma poate fi cea încasată prin alt canal. Dedicația intră ca plătită și o poți aproba automat.</td></tr>
      <tr><td>Un client spune că a plătit, dar mesajul nu apare la Moderare</td><td>Caută-l în Arhivă după text sau „de la”, cu filtrul de plată pe „toate”. O plată nefinalizată rămâne „pending” sau devine „expired” și nu intră la moderare.</td></tr>
      <tr><td>Marcaj „factură: eroare” sau „manual”</td><td>De obicei lipsește numele complet al clientului. Deschide dedicația în Arhivă, completează numele și apasă „Reîncearcă emiterea”. La rambursări, factura emisă trebuie stornată manual în SmartBill.</td></tr>
      <tr><td>Marcaj „email nereușit”</td><td>Deschide dedicația, citește motivul erorii și apasă „Retrimite email”. Verifică dacă adresa clientului este corectă.</td></tr>
      <tr><td>Un mesaj a fost respins din greșeală</td><td>Panoul nu are „Reaprobă”. Cere clientului să trimită din nou mesajul, sau creează o dedicație manuală cu textul corect (și rambursează-o pe cea respinsă, dacă e cazul).</td></tr>
      <tr><td>Vezi „Acces restricționat”</td><td>Rolul contului tău nu are drept pe pagina respectivă. Vezi tabelul din <a href="#acces">Acces și roluri</a>.</td></tr>
      <tr><td>Site-ul arată „Revenim în curând”</td><td>Site-ul este protejat cu parolă. Un admin îl face public din Setări, sau introduci parola de acces. Dacă și Supabase este oprit (de exemplu pus pe pauză), site-ul nu poate verifica setarea și rămâne protejat.</td></tr>
    </tbody>
  </table></div>
</section>

<!-- ============ LIMITE ============ -->
<section id="limite">
  <div class="sec-head"><h2>Ce nu face (încă) panoul</h2></div>
  <p>Lucruri pe care le-ai putea căuta în admin și nu există, ca să nu pierzi timp:</p>
  <ul>
    <li>Nu poți <b>șterge</b> o dedicație și nu o poți <b>reaproba</b> după ce a fost respinsă.</li>
    <li>Nu există <b>rambursare în masă</b>; fiecare se face separat.</li>
    <li>Nu poți <b>edita un sponsor</b> existent, doar îl activezi, dezactivezi sau ștergi.</li>
    <li>Nu poți <b>crea conturi de echipă</b> din panou; se fac în Supabase.</li>
    <li>Durata afișării pe ecranele din sală (implicit 12 secunde) nu se poate schimba din editor; durata de pe overlay de stream, da.</li>
    <li>La dedicațiile de tip <b>stream</b>, afișarea pe overlay nu schimbă starea „difuzare” din panou: ele pot rămâne „în așteptare” în Arhivă, iar clientul nu vede pasul „Difuzat” pe pagina lui. Nu înseamnă că nu au fost afișate.</li>
  </ul>
</section>

<!-- ============ ADRESE ============ -->
<section id="adrese">
  <div class="sec-head"><h2>Adrese utile</h2></div>
  <div class="tabel"><table>
    <thead><tr><th>Adresă</th><th>Ce este</th></tr></thead>
    <tbody>
      <tr><td><code>12rounds.ro</code></td><td>Homepage public</td></tr>
      <tr><td><code>/eveniment/slug</code></td><td>Pagina publică a unei ediții, cu formularul de dedicații</td></tr>
      <tr><td><code>/live</code></td><td>Duce la ediția live; este adresa din codul QR</td></tr>
      <tr><td><code>/status/…</code> · <code>/dedicatiile-mele</code></td><td>Pagina clientului, unde își urmărește dedicațiile</td></tr>
      <tr><td><code>/admin/login</code></td><td>Autentificare echipă</td></tr>
      <tr><td><code>/admin</code></td><td>Dashboard (admin)</td></tr>
      <tr><td><code>/admin/evenimente/…</code></td><td>Editorul unei ediții (admin)</td></tr>
      <tr><td><code>/admin/moderare</code></td><td>Coada de moderare (admin, moderator)</td></tr>
      <tr><td><code>/admin/regie</code></td><td>Coada prezentatorului (admin, operator)</td></tr>
      <tr><td><code>/admin/dedicatii</code></td><td>Arhiva de dedicații (admin, moderator)</td></tr>
      <tr><td><code>/admin/ecrane</code></td><td>Ecranele din sală (admin)</td></tr>
      <tr><td><code>/admin/sponsori</code> · <code>/admin/statistici</code> · <code>/admin/setari</code></td><td>Sponsori, statistici, setări (admin)</td></tr>
      <tr><td><code>/ecran/…?key=…</code></td><td>Pagina kiosk a unui ecran din sală</td></tr>
      <tr><td><code>/overlay/slug/16-9</code> · <code>/instagram</code> · <code>/tiktok</code></td><td>Overlay-urile de stream, cu <code>?key=…</code></td></tr>
    </tbody>
  </table></div>
</section>

  </main>
</div>

<footer class="sfarsit">
  Ghid scris după codul platformei de pe branch-ul main, la 22 octombrie 2026. Dacă o pagină din panou arată altfel decât în acest ghid, panoul a fost modificat între timp.
</footer>

<script>
(function () {
  /* cuprins: pe ecran lat rămâne deschis, pe telefon pornește închis */
  var toc = document.getElementById('toc');
  var larg = window.matchMedia('(min-width: 900px)');
  function aplica() { if (larg.matches) toc.setAttribute('open', ''); else toc.removeAttribute('open'); }
  aplica();
  if (larg.addEventListener) larg.addEventListener('change', aplica);
  var linkuri = Array.prototype.slice.call(document.querySelectorAll('.toc a'));
  linkuri.forEach(function (a) {
    a.addEventListener('click', function () { if (!larg.matches) toc.removeAttribute('open'); });
  });

  /* cuprinsul pentru versiunea tipărită, copiat din cel de pe ecran */
  var tocPrint = document.getElementById('toc-print');
  var tocInner = document.querySelector('.toc-inner');
  if (tocPrint && tocInner) {
    var grup = null;
    Array.prototype.forEach.call(tocInner.children, function (el) {
      if (el.classList.contains('toc-group')) { grup = document.createElement('div'); grup.className = 'tp-group'; tocPrint.appendChild(grup); }
      if (grup) grup.appendChild(el.cloneNode(true));
    });
  }

  /* linkurile din pagină derulează local, fără să schimbe adresa documentului */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var tinta = document.getElementById(a.getAttribute('href').slice(1));
    if (!tinta) return;
    e.preventDefault();
    tinta.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });

  /* secțiunea curentă în cuprins */
  var sectiuni = linkuri.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (intrari) {
      intrari.forEach(function (i) {
        if (i.isIntersecting) {
          linkuri.forEach(function (a) { a.classList.toggle('activ', a.getAttribute('href') === '#' + i.target.id); });
        }
      });
    }, { rootMargin: '-15% 0px -70% 0px' });
    sectiuni.forEach(function (s) { if (s) obs.observe(s); });
  }

  /* liste de verificare, memorate în acest browser */
  var CHEIE = '12rounds_ghid_verif';
  var bife = Array.prototype.slice.call(document.querySelectorAll('.lista-verif input'));
  var stare = {};
  try { stare = JSON.parse(localStorage.getItem(CHEIE) || '{}') || {}; } catch (e) { stare = {}; }
  bife.forEach(function (b) {
    if (stare[b.id]) b.checked = true;
    b.addEventListener('change', function () {
      stare[b.id] = b.checked;
      try { localStorage.setItem(CHEIE, JSON.stringify(stare)); } catch (e) {}
    });
  });
  document.getElementById('reset-verif').addEventListener('click', function () {
    bife.forEach(function (b) { b.checked = false; });
    stare = {};
    try { localStorage.removeItem(CHEIE); } catch (e) {}
  });
})();
</script>
</body>
</html>
`;
