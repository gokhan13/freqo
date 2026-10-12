import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

// Optional documentation export. Requires Pandoc and Chromium; it does not build
// or change the application. Run from any directory: node scripts/build-user-guide.mjs.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docs = join(root, 'docs');
const output = resolve(process.argv[2] ?? join(docs, 'downloads'));
const name = 'freq-uygulama-kilavuzu-0.9';
const temporary = await mkdtemp(join(tmpdir(), 'freq-user-guide-'));
await mkdir(output, { recursive: true });

const css = `
@font-face { font-family: FreqDocument; src: url('${pathToFileURL(join(root, 'public/fonts/DejaVuSans.ttf')).href}'); }
@page { size: A4; margin: 21mm 18mm 20mm; }
html { font-family: FreqDocument, sans-serif; color: #243630; background: #fff; font-size: 10.2pt; line-height: 1.46; }
body { margin: 0; max-width: none !important; }
p { margin: 0 0 3.2mm; orphans: 3; widows: 3; }
a { color: #276354; text-decoration: underline; overflow-wrap: anywhere; }
strong { color: #1c4035; }
header#title-block-header { min-height: 226mm; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; break-after: page; border-top: 3mm solid #c8ed86; }
header#title-block-header::before { content: 'ÜRÜN VE KULLANIM DOKÜMANI'; color: #526864; font-size: 9pt; letter-spacing: 2px; }
h1.title { font-size: 61pt; color: #245c4d; margin: 6mm 0; border: 0; break-before: auto; }
p.subtitle { font-size: 21pt; line-height: 1.3; max-width: 145mm; color: #2f5145; }
p.date { margin-top: 12mm; color: #526864; font-size: 11pt; }
#TOC { break-after: page; }
#TOC::before { content: 'İçindekiler'; display: block; font-size: 23pt; color: #245c4d; margin-bottom: 6mm; }
#TOC ul { list-style: none; padding-left: 0; }
#TOC > ul > li { margin: 3.4mm 0; font-weight: bold; }
#TOC li ul { margin: 1.4mm 0 2.8mm; padding-left: 4mm; font-size: 8.8pt; font-weight: normal; line-height: 1.3; }
#TOC li ul li { margin-bottom: 1mm; }
#TOC a { text-decoration: none; }
body > h1 { break-before: page; font-size: 22pt; color: #245c4d; line-height: 1.23; margin: 0 0 7mm; padding: 3mm 0 3mm; border-bottom: 0.6mm solid #c8ed86; }
h2 { font-size: 14.2pt; line-height: 1.28; color: #276354; margin: 6mm 0 3mm; }
h3 { font-size: 11.4pt; color: #276354; margin: 4mm 0 2mm; }
h1, h2, h3 { break-after: avoid; }
ul, ol { padding-left: 6mm; margin: 2mm 0 4mm; }
li { margin-bottom: 1.5mm; orphans: 2; widows: 2; }
li > p { margin-bottom: 1.5mm; }
table { width: 100%; border-collapse: collapse; font-size: 9.1pt; line-height: 1.35; margin: 4mm 0 5mm; }
thead { display: table-header-group; }
th { color: #fff; background: #276354; text-align: left; padding: 2.2mm; vertical-align: top; }
td { padding: 2.1mm; border-bottom: 0.2mm solid #d6e1d9; vertical-align: top; overflow-wrap: anywhere; }
tr:nth-child(even) td { background: #f3f7f1; }
tr { break-inside: avoid; }
figure { margin: 5mm 0; text-align: center; break-inside: avoid; }
figure img { max-width: 100%; height: auto; max-height: 205mm; object-fit: contain; }
figcaption { font-size: 8.4pt; line-height: 1.35; color: #526864; margin-top: 2mm; }
code { font-family: FreqDocument, monospace; font-size: 8.8pt; overflow-wrap: anywhere; }
pre { background: #eff5ef; padding: 4mm; border-left: 0.8mm solid #a6c97c; white-space: pre-wrap; break-inside: avoid; }
`;

try {
  const cssPath = join(temporary, 'guide.css');
  await writeFile(cssPath, css);
  const linkFilter = join(temporary, 'guide-links.lua');
  await writeFile(
    linkFilter,
    `function Link(el)
    if not el.target:match('^#') and not el.target:match('^[%a][%w+.-]*:') and not el.target:match('^/') then
      el.target = 'https://github.com/bayraktarersan/freq/blob/main/docs/' .. el.target
    end
    return el
  end`,
  );
  const source = join(docs, 'uygulama-kilavuzu.md');
  const htmlPath = join(temporary, 'guide.html');
  execFileSync(
    'pandoc',
    [
      source,
      '--standalone',
      '--toc',
      '--toc-depth=2',
      '--embed-resources',
      '--resource-path',
      docs,
      '--lua-filter',
      linkFilter,
      '--css',
      cssPath,
      '-o',
      htmlPath,
    ],
    { cwd: docs },
  );
  const fontLicense = await readFile(join(root, 'public/fonts/LICENSE-DejaVu.txt'), 'utf8');
  const escapedLicense = fontLicense
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  const html = (await readFile(htmlPath, 'utf8')).replace(
    '</body>',
    `<template id="embedded-font-license">${escapedLicense}</template>\n</body>`,
  );
  await writeFile(join(output, 'LICENSE-DejaVu.txt'), fontLicense);
  await writeFile(join(output, `${name}.html`), html);
  execFileSync(
    'pandoc',
    [
      source,
      '--standalone',
      '--toc',
      '--toc-depth=2',
      '--resource-path',
      docs,
      '--lua-filter',
      linkFilter,
      '--reference-doc',
      join(docs, 'assets/kilavuz-reference.docx'),
      '-o',
      join(output, `${name}.docx`),
    ],
    { cwd: docs },
  );

  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  try {
    const page = await browser.newPage();
    const external = [];
    await page.route(/^https?:\/\//, route => {
      external.push(route.request().url());
      return route.abort();
    });
    // The export is self-contained. Rendering the trusted HTML directly also
    // works in managed browsers where navigation to local file URLs is disabled.
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    if (external.length) throw new Error('The document attempted to load external resources.');
    const info = await page.evaluate(() => ({
      title: document.title,
      headings: document.querySelectorAll('h1,h2,h3').length,
      unloadedImages: [...document.images].filter(img => !img.complete || !img.naturalWidth).length,
    }));
    if (info.unloadedImages) throw new Error('A guide illustration did not load.');
    await page.pdf({
      path: join(output, `${name}.pdf`),
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      outline: true,
      tagged: true,
      displayHeaderFooter: true,
      headerTemplate:
        '<div style="font-size:8px;color:#526864;width:100%;margin:0 18mm;display:flex;justify-content:space-between"><span>FREQ · Uygulama tanıtımı ve kullanım kılavuzu</span><span>0.9 önizleme</span></div>',
      footerTemplate:
        '<div style="font-size:8px;color:#526864;width:100%;margin:0 18mm;display:flex;justify-content:space-between"><span>12 Ekim 2026 · Türkçe</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
    });
    console.log(JSON.stringify({ output, ...info, externalRequests: external.length }));
  } finally {
    await browser.close();
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}
