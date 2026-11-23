// Page logic: loading the terms, navigation, search and the term pages.

import { copyButton, el } from './dom.js';
import { icon } from './icons.js';
import { addPhrase, onPhraseCount, phraseCount, renderAgentPage, renderPromptPage } from './tools.js';
import { LEGEND, Viewer, renderThumb } from './viewer.js';

const main = document.getElementById('main');
const nav = document.getElementById('nav');
const input = document.getElementById('q');
const clearBtn = document.getElementById('search-clear');
const keyHint = document.getElementById('search-key');
const themeBtn = document.getElementById('theme-btn');
const menuBtn = document.getElementById('menu-btn');
const scrim = document.getElementById('scrim');

const store = {
  categories: [],
  terms: [],
  byId: new Map(),
  query: '',
  results: [], // [{ term, why }] for the current query
  picked: 0, // which search result the arrow keys are on
};

const models = new Map(); // term id -> Promise of its model file
const stills = new Map(); // "id|theme" -> PNG data URL
let viewer = null;
let ticket = 0; // guards against a slow page load finishing after you moved on

// ---- small helpers --------------------------------------------------------

const termUrl = (term) => `#/t/${term.id}`;
const groupUrl = (category) => `#/c/${category.id}`;
const countOf = (n) => `${n} ${n === 1 ? 'term' : 'terms'}`;

/** A small coloured tile holding the icon of a group of terms. */
function groupIcon(category, size = 16, extra = '') {
  return el('span', { class: `cat-ico ${extra}`.trim(), 'data-cat': category.id }, icon(category.icon, size));
}

function currentTheme() {
  const set = document.documentElement.dataset.theme;
  if (set) return set;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function loadModel(id) {
  if (!models.has(id)) {
    const request = fetch(`data/models/${id}.json`, { cache: 'no-cache' }).then((response) => {
      if (!response.ok) throw new Error(`No model file for ${id}`);
      return response.json();
    });
    request.catch(() => models.delete(id));
    models.set(id, request);
  }
  return models.get(id);
}

// ---- small pictures on cards ----------------------------------------------

const lazy = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      lazy.unobserve(entry.target);
      fillThumb(entry.target);
    }
  },
  { rootMargin: '400px' },
);

function thumbBox(term) {
  const box = el('div', { class: 'thumb', 'data-term': term.id });
  const ready = stills.get(`${term.id}|${currentTheme()}`);
  if (ready) box.append(el('img', { src: ready, alt: '' }));
  else lazy.observe(box);
  return box;
}

async function fillThumb(box) {
  const id = box.dataset.term;
  try {
    const model = await loadModel(id);
    const state = model.states[model.thumb];
    if (state.type === 'svg') {
      box.innerHTML = state.svg; // made by our own build script
      return;
    }
    const key = `${id}|${currentTheme()}`;
    if (!stills.has(key)) stills.set(key, renderThumb(model, model.thumb));
    box.replaceChildren(el('img', { src: stills.get(key), alt: '' }));
  } catch (error) {
    console.warn(error);
  }
}

// ---- search ---------------------------------------------------------------

function find(query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return store.terms.map((term) => ({ term, why: null }));

  const found = [];
  for (const term of store.terms) {
    let total = 0;
    let why = null;
    for (const word of words) {
      let score = 0;
      const alias = term.aka.find((a) => a.toLowerCase().includes(word));
      if (term.lowName.startsWith(word)) score = 100;
      else if (term.lowName.includes(word)) score = 70;
      else if (alias) { score = 50; why = `also called ${alias}`; }
      else if (term.lowKeywords.includes(word)) score = 25;
      else if (term.lowText.includes(word)) score = 10;
      if (!score) { total = 0; break; }
      total += score;
    }
    if (total) found.push({ term, why, total });
  }
  found.sort((a, b) => b.total - a.total || a.term.order - b.term.order);
  return found;
}

/** The term name with the letters you typed marked. */
function marked(name, query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const low = name.toLowerCase();
  const hit = new Array(name.length).fill(false);
  for (const word of words) {
    const at = low.indexOf(word);
    if (at >= 0) hit.fill(true, at, at + word.length);
  }
  const parts = [];
  for (let i = 0; i < name.length; ) {
    let j = i;
    while (j < name.length && hit[j] === hit[i]) j++;
    const piece = name.slice(i, j);
    parts.push(hit[i] ? el('mark', { text: piece }) : piece);
    i = j;
  }
  return parts;
}

function applySearch() {
  const query = store.query.trim();
  clearBtn.hidden = !store.query;
  keyHint.hidden = Boolean(store.query);
  store.results = find(query);
  store.picked = 0;
  renderNav();
  if (TOOL_PAGES.includes(currentPage())) {
    if (query) location.hash = '#/'; // searching from a tool page shows the results
  } else if (!currentTermId()) renderHome();
  else if (query) nav.scrollTop = 0;
}

function clearSearch() {
  input.value = '';
  store.query = '';
  applySearch();
}

// ---- sidebar --------------------------------------------------------------

const TOOL_PAGES = ['prompt', 'agent'];
const currentPage = () => location.hash.replace(/^#\/?/, '');

function currentTermId() {
  const match = location.hash.match(/^#\/t\/([^/?]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function currentGroupId() {
  const match = location.hash.match(/^#\/c\/([^/?]+)/);
  const id = match ? decodeURIComponent(match[1]) : null;
  return store.categories.some((category) => category.id === id) ? id : null;
}

function renderNav() {
  const query = store.query.trim();
  const here = currentTermId();
  const group = currentGroupId();

  if (query) {
    if (!store.results.length) {
      nav.replaceChildren(
        el('p', { class: 'nav-note', text: `No term matches “${query}”. Try describing the shape instead, like “round edge” or “screw head”.` }),
      );
      return;
    }
    const count = store.results.length;
    nav.replaceChildren(
      el('p', { class: 'nav-note', text: `${count} ${count === 1 ? 'match' : 'matches'}. Press Enter to open the marked one.` }),
      el('ul', {}, store.results.map(({ term, why }, index) =>
        el('li', {},
          el('a', {
            href: termUrl(term),
            class: `result${index === store.picked ? ' is-picked' : ''}`,
            'aria-current': term.id === here && 'page',
          },
          el('span', {}, marked(term.name, query)),
          el('span', { class: 'why', text: why ?? term.categoryName }))))),
    );
    return;
  }

  nav.replaceChildren(
    el('ul', {}, el('li', {},
      el('a', { href: '#/', class: 'nav-group', 'aria-current': !currentPage() && 'page' },
        el('span', { class: 'cat-ico' }, icon('grid', 15)),
        el('span', { class: 'nav-group-name', text: 'All terms' }),
        el('span', { class: 'count', text: String(store.terms.length) }))),
    el('li', {},
      el('a', { href: '#/prompt', class: 'nav-group', 'aria-current': currentPage() === 'prompt' && 'page' },
        el('span', { class: 'cat-ico' }, icon('pen', 15)),
        el('span', { class: 'nav-group-name', text: 'Prompt builder' }),
        phraseCount() > 0 && el('span', { class: 'badge', title: 'Phrases collected', text: String(phraseCount()) }))),
    el('li', {},
      el('a', { href: '#/agent', class: 'nav-group', 'aria-current': currentPage() === 'agent' && 'page' },
        el('span', { class: 'cat-ico' }, icon('book', 15)),
        el('span', { class: 'nav-group-name', text: 'Glossary for your agent' })))),
    ...store.categories.map((category) =>
      el('section', {},
        el('h2', {},
          el('a', { href: groupUrl(category), class: 'nav-group', 'aria-current': group === category.id && 'page' },
            groupIcon(category, 15),
            el('span', { class: 'nav-group-name', text: category.name }),
            el('span', { class: 'count', text: String(category.terms.length) }))),
        el('ul', { class: 'nav-terms' }, category.terms.map((term) =>
          el('li', {}, el('a', { href: termUrl(term), 'aria-current': term.id === here && 'page', text: term.name })))))),
  );
}

// ---- home page ------------------------------------------------------------

function card(term, showGroup = false) {
  return el('a', { class: 'card', href: termUrl(term) },
    thumbBox(term),
    el('div', { class: 'card-body' },
      el('h3', { text: term.name }),
      el('p', { text: term.summary }),
      showGroup && el('span', { class: 'card-cat' }, groupIcon(term.group, 13), term.categoryName)));
}

/** A row of buttons, one per group of terms, to show only that group. */
function chips(active) {
  return el('nav', { class: 'chips', 'aria-label': 'Groups of terms' },
    el('a', { class: 'chip', href: '#/', 'aria-current': !active && 'page' },
      el('span', { class: 'cat-ico' }, icon('grid', 16)), 'All',
      el('span', { class: 'count', text: String(store.terms.length) })),
    store.categories.map((category) =>
      el('a', { class: 'chip', href: groupUrl(category), 'aria-current': active === category.id && 'page' },
        groupIcon(category, 16), category.name,
        el('span', { class: 'count', text: String(category.terms.length) }))));
}

function renderHome(group = currentGroupId()) {
  const shown = store.categories.filter((category) => !group || category.id === group);
  document.title = group ? `${shown[0].name} · CAD Terms` : 'CAD Terms';
  const query = store.query.trim();
  const page = [
    el('header', {},
      el('h1', { text: 'CAD terms, with pictures' }),
      el('p', { class: 'lede', text: `${store.terms.length} terms in ${store.categories.length} groups. Each one has a picture you can turn, a plain explanation, ready-made phrases for your AI agent, and the build123d code. Pick a group or a picture, or search by name or by what the shape looks like.` })),
  ];

  if (query) {
    const count = store.results.length;
    if (count) {
      page.push(el('section', { class: 'group' },
        el('div', { class: 'group-head' },
          el('div', {}, el('h2', {}, `Results for “${query}”`, el('span', { text: countOf(count) })))),
        el('div', { class: 'cards' }, store.results.map(({ term }) => card(term, true)))));
    } else {
      page.push(el('p', { class: 'empty' },
        el('strong', { text: `No term matches “${query}”. ` }),
        'Try describing the shape instead, like “round edge” or “screw head”.'));
    }
  } else {
    if (!group) {
      page.push(el('div', { class: 'tools' },
        el('a', { class: 'tool', href: '#/prompt' },
          el('span', { class: 'cat-ico cat-ico-lg' }, icon('pen', 22)),
          el('span', {}, el('strong', { text: 'Prompt builder' }),
            el('small', { text: 'Collect phrases and a project brief into one prompt for your agent.' }))),
        el('a', { class: 'tool', href: '#/agent' },
          el('span', { class: 'cat-ico cat-ico-lg' }, icon('book', 22)),
          el('span', {}, el('strong', { text: 'Glossary for your agent' }),
            el('small', { text: 'Every term and build123d note in one text file your agent can read.' })))));
    }
    page.push(chips(group));
    for (const category of shown) {
      page.push(el('section', { class: 'group' },
        el('div', { class: 'group-head' },
          groupIcon(category, 22, 'cat-ico-lg'),
          el('div', {},
            el('h2', {},
              group ? category.name : el('a', { href: groupUrl(category), text: category.name }),
              el('span', { text: countOf(category.terms.length) })),
            el('p', { text: category.blurb }))),
        el('div', { class: 'cards' }, category.terms.map((term) => card(term)))));
    }
  }
  main.replaceChildren(...page);
}

// ---- term page ------------------------------------------------------------

const PYTHON = /(#.*$)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b(\d+(?:\.\d+)?)\b|\b(with|as|from|import|for|in|def|return|lambda|if|else|not|and|or|None|True|False)\b|\b([A-Z][A-Za-z0-9_]*)\b/gm;
const TOKEN_CLASS = ['', 'tok-c', 'tok-s', 'tok-n', 'tok-k', 'tok-t'];

function highlight(code) {
  const out = [];
  let last = 0;
  for (const match of code.matchAll(PYTHON)) {
    if (match.index > last) out.push(code.slice(last, match.index));
    const kind = match.findIndex((group, i) => i > 0 && group !== undefined);
    out.push(el('span', { class: TOKEN_CLASS[kind], text: match[0] }));
    last = match.index + match[0].length;
  }
  out.push(code.slice(last));
  return out;
}

function heading(shape, title) {
  return el('h2', {}, icon(shape, 15), title);
}

function section(shape, title, ...content) {
  return el('section', {}, el('div', { class: 'sec-head' }, heading(shape, title)), ...content);
}

/** Text with {marked values}: the parts you are meant to change. */
function fillIn(text) {
  return text.split(/(\{[^}]*\})/).filter(Boolean).map((piece) =>
    piece.startsWith('{') ? slot(piece.slice(1, -1)) : piece);
}

/** One marked value. Click it and type to put in your own. */
function slot(value) {
  const node = el('span', { class: 'slot', role: 'textbox', spellcheck: 'false', title: 'Click to change', 'aria-label': 'Example value, click to change', text: value });
  try {
    node.contentEditable = 'plaintext-only';
  } catch {
    node.contentEditable = 'true'; // older browsers
  }
  // the first click selects the whole value, so typing replaces it
  node.addEventListener('focus', () => setTimeout(() => {
    if (document.activeElement === node) getSelection().selectAllChildren(node);
  }, 0));
  node.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === 'Escape') {
      event.preventDefault();
      node.blur();
    }
  });
  return node;
}

const plain = (text) => text.replace(/[{}]/g, '');

function sayList(term) {
  if (!term.say.length) return null;
  const marked = term.say.some((entry) => entry.text.includes('{'));
  return el('section', {},
    el('div', { class: 'sec-head' }, heading('say', 'Say it to your agent')),
    el('ul', { class: 'say-list' }, term.say.map((entry) => {
      const line = el('p', {}, fillIn(entry.text));
      const idle = () => [icon('plus', 12), 'Add to prompt'];
      const add = el('button', { type: 'button', class: 'copy', title: 'Collect this phrase in the prompt builder' }, idle());
      add.addEventListener('click', () => {
        addPhrase(term.name, term.id, line.textContent);
        add.replaceChildren('Added');
        setTimeout(() => add.replaceChildren(...idle()), 1600);
      });
      // both buttons read the line as it is now, with any values you changed
      return el('li', { class: 'say' },
        el('div', { class: 'say-top' },
          el('span', { class: 'say-for', text: entry.for }),
          el('span', { class: 'say-tools' }, add, copyButton(() => line.textContent))),
        line);
    })),
    marked && el('p', { class: 'note' }, el('span', { class: 'slot slot-demo', text: 'Marked values' }),
      ' are examples. Click one to type your own, then copy the phrase or add it to the ',
      el('a', { href: '#/prompt', text: 'prompt builder' }), '.'));
}

function sizeTable(table) {
  return el('section', {},
    el('div', { class: 'sec-head' }, heading('table', table.caption)),
    el('div', { class: 'table-wrap', tabindex: '0', role: 'region', 'aria-label': table.caption },
      el('table', {},
        el('thead', {}, el('tr', {}, table.columns.map((name) => el('th', { scope: 'col', text: name })))),
        el('tbody', {}, table.rows.map((row) =>
          el('tr', {}, row.map((cell, i) => el(i ? 'td' : 'th', { scope: !i && 'row', text: cell }))))))),
    table.note && el('p', { class: 'note', text: table.note }));
}

function buildStage(term, model) {
  const start = model.thumb;
  const view3d = el('div', { class: 'stage-3d' });
  const viewSvg = el('div', { class: 'stage-svg', hidden: true });
  const legend = el('ul', { class: 'legend' });
  const hint = el('span', { class: 'hint', text: 'Drag to rotate · scroll to zoom · right-drag to move' });
  const reset = el('button', { type: 'button', class: 'ghost-btn', text: 'Reset view', onclick: () => viewer?.resetView() });

  const buttons = model.states.map((state, index) =>
    el('button', { type: 'button', class: 'seg-btn', text: state.label, onclick: () => select(index) }));

  if (model.states.some((state) => state.type === '3d')) {
    try {
      viewer = new Viewer(view3d);
      viewer.setModel(model, term.name);
    } catch (error) {
      console.warn(error);
      viewer = null;
      view3d.append(el('p', { class: 'stage-msg', text: 'This browser could not start the 3D view (WebGL is off or not supported).' }));
    }
  }

  function select(index) {
    const state = model.states[index];
    const flat = state.type === 'svg';
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    viewSvg.hidden = !flat;
    view3d.hidden = flat;
    hint.hidden = flat;
    reset.hidden = flat;
    if (flat) viewSvg.innerHTML = state.svg; // made by our own build script
    else viewer?.show(index);

    const roles = flat ? [] : state.meshes.map((mesh) => mesh.role).filter((role) => LEGEND[role]);
    legend.replaceChildren(...[...new Set(roles)].map((role) =>
      el('li', {}, el('i', { style: `background: var(--m-${role})` }), LEGEND[role])));
  }

  const stage = el('div', { class: 'stage' },
    el('div', { class: 'stage-bar' },
      model.states.length > 1 ? el('div', { class: 'seg', role: 'group', 'aria-label': 'Choose a picture' }, buttons) : el('span'),
      reset),
    el('div', { class: 'stage-frame' }, view3d, viewSvg),
    el('div', { class: 'stage-foot' }, legend, hint));
  select(start);
  return stage;
}

function versus(entry) {
  const other = entry.id && store.byId.get(entry.id);
  if (!other) {
    return el('div', { class: 'versus versus-plain' },
      el('div', {}, el('strong', { text: entry.name ?? entry.id }), el('p', { text: entry.diff })));
  }
  return el('a', { class: 'versus', href: termUrl(other) },
    thumbBox(other),
    el('div', {}, el('strong', { text: other.name }), el('p', { text: entry.diff })));
}

async function renderTerm(term) {
  const mine = ++ticket;
  document.title = `${term.name} · CAD Terms`;

  const stageSlot = el('div', { class: 'stage' },
    el('div', { class: 'stage-bar' }),
    el('div', { class: 'stage-frame' }, el('p', { class: 'stage-msg', text: 'Loading picture…' })));
  const codeSlot = el('div');
  const body = el('div', { class: 'term-body' },
    el('p', { class: 'definition', text: term.definition }),
    term.table && sizeTable(term.table),
    sayList(term),
    codeSlot,
    term.printTip && el('section', { class: 'tip' }, heading('layers', 'For 3D printing'), el('p', { text: term.printTip })),
    term.note && section('info', 'Good to know', el('p', { text: term.note })),
    term.confusedWith?.length ? section('versus', 'Often confused with', ...term.confusedWith.map(versus)) : null);

  const before = store.terms[term.order - 1];
  const after = store.terms[term.order + 1];
  main.replaceChildren(
    el('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' },
      el('a', { href: '#/', text: 'All terms' }), el('span', { text: '/' }),
      el('a', { class: 'crumb-cat', href: groupUrl(term.group) }, groupIcon(term.group, 14), term.categoryName)),
    el('header', {},
      el('h1', { text: term.name }),
      term.aka.length ? el('p', { class: 'aka', text: `Also called: ${term.aka.join(', ')}` }) : null),
    el('div', { class: 'term-grid' }, stageSlot, body),
    el('nav', { class: 'pager', 'aria-label': 'More terms' },
      before && el('a', { class: 'prev', href: termUrl(before) }, el('small', { text: '← Previous' }), before.name),
      after && el('a', { class: 'next', href: termUrl(after) }, el('small', { text: 'Next →' }), after.name)),
  );

  let model;
  try {
    model = await loadModel(term.id);
  } catch {
    if (mine !== ticket) return;
    stageSlot.querySelector('.stage-msg').textContent =
      'No picture has been built for this term yet. Run:  python generate/build.py';
    return;
  }
  if (mine !== ticket) return;

  stageSlot.replaceWith(buildStage(term, model));
  if (model.code) {
    codeSlot.replaceWith(el('section', {},
      el('div', { class: 'sec-head' }, heading('code', 'In build123d'), copyButton(model.code)),
      el('div', { class: 'code' }, el('pre', {}, el('code', {}, highlight(model.code)))),
      term.codeNote && el('p', { class: 'note', text: term.codeNote })));
  }
}

function renderMissing() {
  document.title = 'Not found · CAD Terms';
  main.replaceChildren(
    el('h1', { text: 'No such term' }),
    el('p', { class: 'lede' }, 'That page does not exist. ', el('a', { href: '#/', text: 'See all terms' }), '.'));
}

// ---- moving between pages -------------------------------------------------

function route(moveFocus = true) {
  ticket++;
  if (viewer) {
    viewer.dispose();
    viewer = null;
  }
  setMenu(false);

  const id = currentTermId();
  const hash = location.hash.replace(/^#\/?/, '');
  if (!hash || currentGroupId()) renderHome();
  else if (hash === 'prompt') renderPromptPage(main);
  else if (hash === 'agent') renderAgentPage(main, store.terms.length);
  else if (id && store.byId.has(id)) renderTerm(store.byId.get(id));
  else renderMissing();

  renderNav();
  nav.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest' });
  window.scrollTo(0, 0);
  if (moveFocus) main.focus({ preventScroll: true });
}

function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  scrim.hidden = !open;
}

// ---- theme ----------------------------------------------------------------

function paintThemeButton() {
  const dark = currentTheme() === 'dark';
  const icon = dark
    ? '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><circle cx="10" cy="10" r="3.6" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M10 2v2.2M10 15.8V18M2 10h2.2M15.8 10H18M4.3 4.3l1.6 1.6M14.1 14.1l1.6 1.6M4.3 15.7l1.6-1.6M14.1 5.9l1.6-1.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>'
    : '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M16.5 11.8A7 7 0 0 1 8.2 3.5a7 7 0 1 0 8.3 8.3z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>';
  themeBtn.innerHTML = icon;
  themeBtn.append(dark ? 'Switch to light' : 'Switch to dark');
}

function repaintPictures() {
  viewer?.refreshTheme();
  document.querySelectorAll('.thumb').forEach((box) => {
    if (box.querySelector('img')) fillThumb(box);
  });
}

themeBtn.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch { /* private mode: just not remembered */ }
  paintThemeButton();
  repaintPictures();
});

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (document.documentElement.dataset.theme) return;
  paintThemeButton();
  repaintPictures();
});

// ---- keyboard and input ---------------------------------------------------

input.addEventListener('input', () => {
  store.query = input.value;
  applySearch();
});

input.addEventListener('keydown', (event) => {
  const count = store.query.trim() ? store.results.length : 0;
  if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && count) {
    event.preventDefault();
    store.picked = (store.picked + (event.key === 'ArrowDown' ? 1 : count - 1)) % count;
    renderNav();
    nav.querySelector('.is-picked')?.scrollIntoView({ block: 'nearest' });
  } else if (event.key === 'Enter' && count) {
    event.preventDefault();
    const target = termUrl(store.results[store.picked].term);
    if (location.hash === target) route();
    else location.hash = target;
  } else if (event.key === 'Escape') {
    if (store.query) clearSearch();
    else input.blur();
  }
});

clearBtn.addEventListener('click', () => {
  clearSearch();
  input.focus();
});

document.addEventListener('keydown', (event) => {
  const typing = event.target.closest?.('input, textarea, [contenteditable]');
  const slash = event.key === '/' && !typing && !event.ctrlKey && !event.metaKey && !event.altKey;
  const ctrlK = event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey);
  if (slash || ctrlK) {
    event.preventDefault();
    if (menuBtn.offsetParent) setMenu(true);
    input.focus();
    input.select();
  } else if (event.key === 'Escape' && document.body.classList.contains('menu-open')) {
    setMenu(false);
  }
});

menuBtn.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
scrim.addEventListener('click', () => setMenu(false));
window.addEventListener('hashchange', () => route());

// ---- start ----------------------------------------------------------------

async function start() {
  paintThemeButton();
  let data;
  try {
    const response = await fetch('data/terms.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(response.statusText);
    data = await response.json();
  } catch (error) {
    main.replaceChildren(el('p', { class: 'empty', text: `Could not load data/terms.json (${error.message}).` }));
    return;
  }

  store.categories = data.categories.map((category) => ({ ...category, terms: [] }));
  const categories = new Map(store.categories.map((category) => [category.id, category]));
  for (const raw of data.terms) {
    const category = categories.get(raw.category);
    if (!category) continue;
    const term = {
      ...raw,
      aka: raw.aka ?? [],
      say: raw.say ?? [],
      group: category,
      categoryName: category.name,
      lowName: raw.name.toLowerCase(),
      lowKeywords: (raw.keywords ?? '').toLowerCase(),
      lowText: [raw.summary, raw.definition, category.name, ...(raw.say ?? []).map((entry) => plain(entry.text))].join(' ').toLowerCase(),
    };
    category.terms.push(term);
  }
  // reading order: category by category, as listed in the file
  store.terms = store.categories.flatMap((category) => category.terms);
  store.terms.forEach((term, index) => {
    term.order = index;
    store.byId.set(term.id, term);
  });

  store.results = find('');
  onPhraseCount(() => { if (!store.query.trim()) renderNav(); });
  route(false);
}

start();
