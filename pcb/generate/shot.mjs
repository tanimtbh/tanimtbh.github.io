// Take pictures of preview.html with a headless browser, to check the drawings by eye.
//
//   node generate/shot.mjs                 writes generate/preview-1.png, preview-2.png, ...
//   node generate/shot.mjs --dark via      the same arguments as preview.mjs
//   node generate/shot.mjs --tag=a via     writes preview-a-1.png, ...
//
// It looks for Chrome or Edge. Each picture holds six drawings.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BROWSERS = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const browser = BROWSERS.find((path) => existsSync(path));
if (!browser) {
  console.log('No Chrome or Edge found. Set CHROME_PATH, or open generate/preview.html yourself.');
  process.exit(1);
}

const tag = process.argv.find((arg) => arg.startsWith('--tag='))?.slice(6);
const name = tag ? `preview-${tag}` : 'preview';
execFileSync(process.execPath, [join(HERE, 'preview.mjs'), ...process.argv.slice(2)], { stdio: 'inherit' });
for (const file of readdirSync(HERE)) if (file.startsWith(`${name}-`) && /-\d+\.(png|html)$/.test(file)) rmSync(join(HERE, file));

// split the page into pieces of six drawings, so each screenshot stays readable
const page = readFileSync(join(HERE, `${name}.html`), 'utf8');
const [head, rest] = page.split(/(?=<figure>)/s, 1).concat(page.slice(page.indexOf('<figure>')));
const figures = rest.slice(0, rest.indexOf('<script>')).split(/(?=<figure>)/).filter((part) => part.trim());
const tail = rest.slice(rest.indexOf('<script>'));
const small = process.argv.includes('--thumbs');
const perPage = small ? 30 : 6;
const [width, height] = small ? [1500, 1700] : [1400, 1680];

for (let i = 0; i * perPage < figures.length; i++) {
  const html = join(HERE, `${name}-${i + 1}.html`);
  const png = join(HERE, `${name}-${i + 1}.png`);
  writeFileSync(html, head + figures.slice(i * perPage, (i + 1) * perPage).join('') + tail);
  execFileSync(browser, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', `--window-size=${width},${height}`,
    `--screenshot=${png}`, pathToFileURL(html).href,
  ], { stdio: 'ignore' });
  rmSync(html);
  console.log(`Wrote ${png}`);
}
