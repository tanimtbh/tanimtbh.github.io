// Put pictures side by side on one page, to check them by eye.
//
//   node generate/preview.mjs                 every picture
//   node generate/preview.mjs via trace       only these terms
//   node generate/preview.mjs --dark via      on the dark theme
//   node generate/preview.mjs --thumbs        the small pictures used on cards
//   node generate/preview.mjs --tag=a via     write preview-a.html, so two runs do not overwrite each other
//
// Run build.mjs first. Then open generate/preview.html in a browser.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MODELS = join(HERE, '..', 'data', 'models');

const args = process.argv.slice(2);
const dark = args.includes('--dark');
const thumbs = args.includes('--thumbs');
const tag = args.find((arg) => arg.startsWith('--tag='))?.slice(6);
const out = tag ? `preview-${tag}.html` : 'preview.html';
const wanted = args.filter((arg) => !arg.startsWith('--'));
const ids = wanted.length ? wanted : readdirSync(MODELS).map((file) => file.replace(/\.json$/, '')).sort();

const tiles = [];
for (const id of ids) {
  const model = JSON.parse(readFileSync(join(MODELS, `${id}.json`), 'utf8'));
  model.states.forEach((state, index) => {
    if (thumbs && index !== model.thumb) return;
    tiles.push(`<figure><div class="${thumbs ? 'thumb' : `frame${state.render ? ' is-render' : ''}`}">${state.svg}</div><figcaption>${id} · ${state.label}</figcaption></figure>`);
  });
}

writeFileSync(join(HERE, out), `<!doctype html>
<html lang="en" data-theme="${dark ? 'dark' : 'light'}">
<meta charset="utf-8">
<title>PCB pictures</title>
<link rel="stylesheet" href="../css/style.css">
<style>
  body { margin: 0; padding: 12px; display: grid; grid-template-columns: repeat(${thumbs ? 5 : 2}, 1fr); gap: 12px; }
  figure { margin: 0; }
  .frame { aspect-ratio: 4 / 3; padding: 14px; background: var(--stage); border: 1px solid var(--border); border-radius: 10px; }
  .frame.is-render { padding: 0; background: #000; overflow: hidden; }
  .thumb { border: 1px solid var(--border); border-radius: 10px; }
  figcaption { font: 13px var(--mono); color: var(--muted); padding: 4px 2px 0; }
</style>
${tiles.join('\n')}
<script>
  // small pictures are cropped to the art, as on the website
  for (const svg of document.querySelectorAll('.thumb .pic')) svg.setAttribute('viewBox', svg.dataset.art);
</script>
</html>
`);
console.log(`Wrote ${out} with ${tiles.length} picture(s)`);
