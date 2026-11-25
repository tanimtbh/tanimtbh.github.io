// Page logic: loading the terms, navigation, search and the term pages.

import { copyButton, el, fillIn, highlight } from './dom.js';
import { EXAMPLES } from './examples-data.js';
import { renderExample, renderExamples, renderSetup, renderWhy } from './guide.js';
import { icon } from './icons.js';

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
  lazy.observe(box);
  return box;
}

async function fillThumb(box) {
  try {
    const model = await loadModel(box.dataset.term);
    const state = model.states[model.thumb] ?? model.states[0];
    if (!state) return;
    box.innerHTML = state.svg; // made by our own build script
    box.classList.toggle('is-render', Boolean(state.render));
    // a hand-drawn picture is cropped to its art: the labels are too small to read on a card
    const art = box.querySelector('.pic')?.dataset.art;
    if (art) box.firstElementChild.setAttribute('viewBox', art);
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

const NO_MATCH = 'Try describing the thing instead, like “hole between layers” or “gap between copper”.';

function applySearch() {
  const query = store.query.trim();
  clearBtn.hidden = !store.query;
  keyHint.hidden = Boolean(store.query);
  store.results = find(query);
  store.picked = 0;
  renderNav();
  if (isGuidePage()) {
    if (query) location.hash = '#/'; // searching from a guide page shows the results
  } else if (!currentTermId()) renderHome();
  else if (query) nav.scrollTop = 0;
}

function clearSearch() {
  input.value = '';
  store.query = '';
  applySearch();
}

// ---- sidebar --------------------------------------------------------------

const GUIDE_PAGES = [
  { hash: 'examples', name: 'Example prompts', icon: 'say', note: 'Prompts that work, step by step, with the board tscircuit drew after each one.' },
  { hash: 'setup', name: 'Setup', icon: 'wrench', note: 'Install tscircuit and Claude Code, and see your first board, step by step.' },
  { hash: 'why', name: 'Why tscircuit', icon: 'versus', note: 'Why a board written as code suits an AI agent better than a click-based tool.' },
];
const currentPage = () => location.hash.replace(/^#\/?/, '');
const currentExample = () => {
  const match = location.hash.match(/^#\/e\/([^/?]+)/);
  return match ? EXAMPLES.find((example) => example.id === decodeURIComponent(match[1])) : null;
};
const isGuidePage = () => GUIDE_PAGES.some((page) => page.hash === currentPage()) || Boolean(currentExample());

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
      nav.replaceChildren(el('p', { class: 'nav-note', text: `No term matches “${query}”. ${NO_MATCH}` }));
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
    GUIDE_PAGES.map((page) => {
      const active = currentPage() === page.hash || (page.hash === 'examples' && Boolean(currentExample()));
      return el('li', {},
        el('a', { href: `#/${page.hash}`, class: 'nav-group', 'aria-current': active && 'page' },
          el('span', { class: 'cat-ico' }, icon(page.icon, 15)),
          el('span', { class: 'nav-group-name', text: page.name }),
          page.hash === 'examples' && el('span', { class: 'count', text: String(EXAMPLES.length) })));
    })),
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
  document.title = group ? `${shown[0].name} · PCB Terms` : 'PCB Terms';
  const query = store.query.trim();
  const page = [
    el('header', {},
      el('h1', { text: 'PCB terms, with pictures' }),
      el('p', { class: 'lede', text: `${store.terms.length} terms in ${store.categories.length} groups, for designing circuit boards with an AI agent. Each one has a picture, a plain explanation, ready-made phrases for your agent, and tscircuit code that was run. Pick a group or a picture, or search by name or by what the thing looks like.` })),
  ];

  if (query) {
    const count = store.results.length;
    if (count) {
      page.push(el('section', { class: 'group' },
        el('div', { class: 'group-head' },
          el('div', {}, el('h2', {}, `Results for “${query}”`, el('span', { text: countOf(count) })))),
        el('div', { class: 'cards' }, store.results.map(({ term }) => card(term, true)))));
    } else {
      page.push(el('p', { class: 'empty' }, el('strong', { text: `No term matches “${query}”. ` }), NO_MATCH));
    }
  } else {
    if (!group) {
      page.push(el('div', { class: 'tools' }, GUIDE_PAGES.map((item) =>
        el('a', { class: 'tool', href: `#/${item.hash}` },
          el('span', { class: 'cat-ico cat-ico-lg' }, icon(item.icon, 22)),
          el('span', {}, el('strong', { text: item.name }), el('small', { text: item.note }))))));
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

function heading(shape, title) {
  return el('h2', {}, icon(shape, 15), title);
}

function section(shape, title, ...content) {
  return el('section', {}, el('div', { class: 'sec-head' }, heading(shape, title)), ...content);
}

const plain = (text) => text.replace(/[{}]/g, '');

function sayList(term) {
  if (!term.say.length) return null;
  const hasSlots = term.say.some((entry) => entry.text.includes('{'));
  return el('section', {},
    el('div', { class: 'sec-head' }, heading('say', 'Say it to your agent')),
    el('ul', { class: 'say-list' }, term.say.map((entry) => {
      const line = el('p', {}, fillIn(entry.text));
      // the button copies the line as it is now, with any values you changed
      return el('li', { class: 'say' },
        el('div', { class: 'say-top' },
          el('span', { class: 'say-for', text: entry.for }),
          copyButton(() => line.textContent)),
        line);
    })),
    hasSlots && el('p', { class: 'note' }, el('span', { class: 'slot slot-demo', text: 'Marked values' }),
      ' are examples. Click one to type your own, then copy the phrase. See how whole prompts are put together in the ',
      el('a', { href: '#/examples', text: 'example prompts' }), '.'));
}

function sizeTable(table) {
  return el('section', {},
    el('div', { class: 'sec-head' }, heading('table', table.caption)),
    el('div', { class: 'table-wrap table-term', tabindex: '0', role: 'region', 'aria-label': table.caption },
      el('table', {},
        el('thead', {}, el('tr', {}, table.columns.map((name) => el('th', { scope: 'col', text: name })))),
        el('tbody', {}, table.rows.map((row) =>
          el('tr', {}, row.map((cell, i) => el(i ? 'td' : 'th', { scope: !i && 'row', text: cell }))))))),
    table.note && el('p', { class: 'note', text: table.note }));
}

// What the colours of a picture mean. Only the ones that appear in it are listed.
const LEGEND = [
  [/class="[^"]*\b(cu|cuf|f-cu)\b/, 'top copper', 'var(--p-cu)'],
  [/class="[^"]*\b(cu-b|cuf-b|f-cub|pad-b)\b/, 'bottom copper', 'var(--p-cu-b)'],
  [/class="[^"]*\b(cu-i|cuf-i|f-cui)\b/, 'inner copper', 'var(--p-cu-i)'],
  [/class="[^"]*\b(pad|f-pad)\b/, 'bare pad', 'var(--p-pad)'],
  [/class="[^"]*\b(brd|f-mask)\b/, 'solder mask', 'var(--p-board)'],
  [/class="[^"]*\bf-(fr4|pp)\b/, 'board material', 'var(--p-fr4)'],
  [/class="[^"]*\bf-solder\b/, 'solder', 'var(--p-solder)'],
];
// The colours tscircuit itself draws with, exactly as they are written in its pictures.
const LEGEND_RENDER = [['top copper', 'rgb(200, 52, 52)'], ['bottom copper', 'rgb(77, 127, 196)'], ['silkscreen', '#f2eda1'], ['drilled hole', '#FF26E2']];

/**
 * The picture area: buttons to choose a picture, the picture and a legend.
 * options.start    which picture to show first (default: the model's own choice)
 * options.onSelect called with the number of the picture whenever it changes
 * The element returned has a select(number) function, to change the picture from outside.
 */
function buildStage(model, options = {}) {
  const start = options.start ?? 0;
  const view = el('div', { class: 'stage-svg' });
  const legend = el('ul', { class: 'legend' });
  const hint = el('span', { class: 'hint' });

  const buttons = model.states.map((state, index) =>
    el('button', { type: 'button', class: 'seg-btn', text: state.label, onclick: () => select(index) }));

  function select(index) {
    const state = model.states[index];
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    view.innerHTML = state.svg; // made by our own build script
    view.classList.toggle('is-render', Boolean(state.render));
    const entries = state.render
      ? LEGEND_RENDER.filter(([, colour]) => state.svg.includes(colour))
      : LEGEND.filter(([test]) => test.test(state.svg)).map(([, name, colour]) => [name, colour]);
    legend.replaceChildren(...entries.map(([name, colour]) => el('li', {}, el('i', { style: `background: ${colour}` }), name)));
    hint.textContent = state.render ? 'Drawn by tscircuit from the code on this page' : 'A drawing, not to scale';
    options.onSelect?.(index);
  }

  const stage = el('div', { class: 'stage' },
    el('div', { class: 'stage-bar' },
      model.states.length > 1 ? el('div', { class: 'seg', role: 'group', 'aria-label': 'Choose a picture' }, buttons) : el('span')),
    el('div', { class: 'stage-frame' }, view),
    el('div', { class: 'stage-foot' }, legend, hint));
  stage.select = select;
  select(model.states[start] ? start : 0);
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
  document.title = `${term.name} · PCB Terms`;

  const stageSlot = el('div', { class: 'stage' },
    el('div', { class: 'stage-bar' }),
    el('div', { class: 'stage-frame' }, el('p', { class: 'stage-msg', text: 'Loading picture…' })));
  const codeSlot = el('div');
  const body = el('div', { class: 'term-body' },
    el('p', { class: 'definition', text: term.definition }),
    term.table && sizeTable(term.table),
    sayList(term),
    codeSlot,
    term.cli && el('section', {},
      el('div', { class: 'sec-head' }, heading('terminal', 'On the command line'), copyButton(term.cli)),
      el('div', { class: 'code' }, el('pre', {}, el('code', { text: term.cli })))),
    term.fabTip && el('section', { class: 'tip' }, heading('factory', 'At the factory'), el('p', { text: term.fabTip })),
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
      'No picture has been built for this term yet. Run:  node generate/build.mjs';
    return;
  }
  if (mine !== ticket) return;

  stageSlot.replaceWith(buildStage(model));
  if (model.code) {
    codeSlot.replaceWith(el('section', {},
      el('div', { class: 'sec-head' }, heading('code', 'In tscircuit'), copyButton(model.code)),
      el('div', { class: 'code' }, el('pre', {}, el('code', {}, highlight(model.code)))),
      term.codeNote && el('p', { class: 'note', text: term.codeNote })));
  } else if (term.codeNote) {
    codeSlot.replaceWith(section('code', 'In tscircuit', el('p', { text: term.codeNote })));
  }
}

// What the guide pages need from this file.
const guide = {
  thumb: (id) => thumbBox({ id }),
  term: (id) => store.byId.get(id),
  termUrl,
};

async function showExample(example) {
  const mine = ++ticket;
  const page = renderExample(main, guide, example);
  let model;
  try {
    model = await loadModel(example.id);
  } catch {
    if (mine === ticket) page.failed();
    return;
  }
  if (mine !== ticket) return;
  page.ready(model, (options) => buildStage(model, options));
}

function renderMissing() {
  document.title = 'Not found · PCB Terms';
  main.replaceChildren(
    el('h1', { text: 'No such term' }),
    el('p', { class: 'lede' }, 'That page does not exist. ', el('a', { href: '#/', text: 'See all terms' }), '.'));
}

// ---- moving between pages -------------------------------------------------

function route(moveFocus = true) {
  ticket++;
  setMenu(false);

  const id = currentTermId();
  const hash = currentPage();
  const example = currentExample();
  if (!hash || currentGroupId()) renderHome();
  else if (hash === 'examples') renderExamples(main, guide);
  else if (hash === 'setup') renderSetup(main, guide);
  else if (hash === 'why') renderWhy(main, guide);
  else if (example) showExample(example);
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
  themeBtn.innerHTML = dark
    ? '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><circle cx="10" cy="10" r="3.6" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M10 2v2.2M10 15.8V18M2 10h2.2M15.8 10H18M4.3 4.3l1.6 1.6M14.1 14.1l1.6 1.6M4.3 15.7l1.6-1.6M14.1 5.9l1.6-1.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>'
    : '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M16.5 11.8A7 7 0 0 1 8.2 3.5a7 7 0 1 0 8.3 8.3z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>';
  themeBtn.append(dark ? 'Switch to light' : 'Switch to dark');
}

themeBtn.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch { /* private mode: just not remembered */ }
  paintThemeButton(); // the pictures follow by themselves: their colours come from the stylesheet
});

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (!document.documentElement.dataset.theme) paintThemeButton();
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
  // a group with no terms yet is not shown
  store.categories = store.categories.filter((category) => category.terms.length);
  // reading order: category by category, as listed in the file
  store.terms = store.categories.flatMap((category) => category.terms);
  store.terms.forEach((term, index) => {
    term.order = index;
    store.byId.set(term.id, term);
  });

  store.results = find('');
  route(false);
}

start();
