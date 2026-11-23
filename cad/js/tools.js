// Two pages that help when you work with an AI agent:
// the prompt builder, and the glossary file an agent can read.

import { copyButton, el } from './dom.js';
import { icon } from './icons.js';

// ---- the prompt you are building (kept in this browser) ---------------------

const KEY = 'cad-terms-prompt';

const FIELDS = [
  { key: 'part', label: 'What are you making?', placeholder: 'e.g. a case for an ESP32 board with a USB-C opening at the front', area: true, wide: true },
  { key: 'size', label: 'Overall size or limits', placeholder: 'e.g. fits a 70 × 30 mm board, at most 25 mm tall', wide: true },
  { key: 'printer', label: 'Printer and nozzle', value: 'FDM printer, 0.4 mm nozzle, 0.2 mm layers' },
  { key: 'material', label: 'Material', value: 'PLA', options: ['PLA', 'PETG', 'ABS or ASA', 'TPU (flexible)', 'Resin'] },
  { key: 'bed', label: 'Which face goes on the print bed?', placeholder: 'e.g. the large flat bottom', wide: true },
  { key: 'wall', label: 'Thinnest wall allowed (mm)', value: '1.2' },
  { key: 'clearance', label: 'Clearance between parts (mm per side)', value: '0.2' },
  {
    key: 'screws', label: 'Screws', value: 'Not decided yet', wide: true,
    options: ['Not decided yet', 'M3, threaded straight into the plastic', 'M3 with heat-set inserts', 'M3 with nuts in nut traps',
      'M2.5, threaded straight into the plastic', 'M2.5 with heat-set inserts', 'No screws: snap fits only'],
  },
];

const RULES = [
  { key: 'axes', label: 'Millimetres, Z up, sitting on the XY plane', text: 'Units are millimetres. Z is up. The part sits on the XY plane with its bottom at z = 0, centred in X and Y. Front is the side facing −Y.' },
  { key: 'diameter', label: 'Sizes of round things are diameters', text: 'Every size I give for a hole, pin or cylinder is a diameter unless I say radius.' },
  { key: 'params', label: 'Named dimensions at the top of the script', text: 'Put every dimension in a named variable at the top of the script, and work out positions from those variables.' },
  { key: 'support', label: 'Design it to print without support', text: 'Design it to print without support: no overhang flatter than 45° and no bridge longer than 30 mm.' },
  { key: 'ask', label: 'Ask before guessing', text: 'If a dimension, a position or a side is missing, ask me. Do not guess silently, and list any assumption you make.' },
  { key: 'show', label: 'Show the result in the OCP viewer', text: 'Show the result in the OCP viewer with show().' },
  { key: 'report', label: 'Report the sizes when done', text: 'When you finish, tell me the overall size, the thinnest wall, and anything that would need support.' },
];

function fresh() {
  return {
    brief: Object.fromEntries(FIELDS.map((field) => [field.key, field.value ?? ''])),
    rules: Object.fromEntries(RULES.map((rule) => [rule.key, true])),
    items: [],
  };
}

function load() {
  const start = fresh();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && Array.isArray(saved.items)) {
      return { brief: { ...start.brief, ...saved.brief }, rules: { ...start.rules, ...saved.rules }, items: saved.items };
    }
  } catch { /* nothing saved, or storage is off: start empty */ }
  return start;
}

let draft = load();
let lastCount = draft.items.length;
const watchers = new Set();

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(draft)); } catch { /* not remembered, still works */ }
  if (draft.items.length !== lastCount) {
    lastCount = draft.items.length;
    watchers.forEach((fn) => fn());
  }
}

export const phraseCount = () => draft.items.length;

/** Call fn whenever the number of collected phrases changes. */
export function onPhraseCount(fn) {
  watchers.add(fn);
}

export function addPhrase(termName, termId, text) {
  draft.items.push({ term: termName, termId, text });
  save();
}

function compose() {
  const brief = Object.fromEntries(Object.entries(draft.brief).map(([key, value]) => [key, String(value ?? '').trim()]));
  const lines = ['Model this part in build123d (Python).'];

  if (brief.part || brief.size) {
    lines.push('', '## The part');
    if (brief.part) lines.push(brief.part);
    if (brief.size) lines.push(`Size: ${brief.size}`);
  }

  const printing = [];
  const machine = [brief.printer, brief.material].filter(Boolean).join(', ');
  if (machine) printing.push(`- ${machine}.`);
  if (brief.bed) printing.push(`- It prints with ${brief.bed} on the bed.`);
  if (brief.wall) printing.push(`- No wall thinner than ${brief.wall} mm.`);
  if (brief.clearance) printing.push(`- Leave ${brief.clearance} mm of clearance per side between parts that fit together.`);
  if (brief.screws && brief.screws !== 'Not decided yet') printing.push(`- Screws: ${brief.screws}.`);
  if (printing.length) lines.push('', '## How it will be printed', ...printing);

  const rules = RULES.filter((rule) => draft.rules[rule.key]).map((rule) => `- ${rule.text}`);
  if (rules.length) lines.push('', '## Rules', ...rules);

  const wanted = draft.items.map((item) => item.text.trim()).filter(Boolean);
  if (wanted.length) lines.push('', '## What I want', ...wanted.map((text, index) => `${index + 1}. ${text}`));
  return lines.join('\n');
}

// ---- prompt builder page ----------------------------------------------------

function toolButton(shape, label, action, disabled = false) {
  return el('button', { type: 'button', class: 'tool-btn', 'aria-label': label, title: label, disabled, onclick: action }, icon(shape, 14));
}

export function renderPromptPage(main) {
  document.title = 'Prompt builder · CAD Terms';

  const output = el('pre', { class: 'prompt-out', tabindex: '0', 'aria-label': 'Your prompt' });
  const words = el('span', { class: 'hint' });
  const list = el('ol', { class: 'pick-list' });
  const empty = el('p', { class: 'pick-empty' },
    'Nothing collected yet. Open any term and press ', el('strong', { text: 'Add to prompt' }), ' beside a phrase, or write your own line below.');

  function refresh() {
    const text = compose();
    output.textContent = text;
    words.textContent = `${text.split(/\s+/).filter(Boolean).length} words`;
  }

  function field(spec) {
    const id = `brief-${spec.key}`;
    let control;
    if (spec.options) {
      control = el('select', { id }, spec.options.map((option) => el('option', { text: option })));
    } else if (spec.area) {
      control = el('textarea', { id, rows: '2', placeholder: spec.placeholder });
    } else {
      control = el('input', { id, type: 'text', placeholder: spec.placeholder, autocomplete: 'off' });
    }
    control.value = draft.brief[spec.key] ?? '';
    control.addEventListener('input', () => {
      draft.brief[spec.key] = control.value;
      save();
      refresh();
    });
    return el('div', { class: `field${spec.wide ? ' field-wide' : ''}` }, el('label', { for: id, text: spec.label }), control);
  }

  function rule(spec) {
    const box = el('input', { type: 'checkbox' });
    box.checked = Boolean(draft.rules[spec.key]);
    box.addEventListener('change', () => {
      draft.rules[spec.key] = box.checked;
      save();
      refresh();
    });
    return el('label', { class: 'check' }, box, el('span', {}, el('strong', { text: spec.label }), el('small', { text: spec.text })));
  }

  function paintList(focusLast = false) {
    const changed = () => { save(); paintList(); refresh(); };
    list.replaceChildren(...draft.items.map((item, index) => {
      const area = el('textarea', { rows: '2', 'aria-label': `Step ${index + 1}`, placeholder: 'Write what you want, in your own words' });
      area.value = item.text;
      const fit = () => {
        area.style.height = 'auto';
        area.style.height = `${area.scrollHeight + 2}px`;
      };
      area.addEventListener('input', () => {
        item.text = area.value;
        fit();
        save();
        refresh();
      });
      requestAnimationFrame(fit);
      const move = (to) => () => {
        draft.items.splice(to, 0, draft.items.splice(index, 1)[0]);
        changed();
      };
      return el('li', { class: 'pick' },
        el('div', { class: 'pick-top' },
          item.termId
            ? el('a', { class: 'pick-from', href: `#/t/${item.termId}`, text: item.term })
            : el('span', { class: 'pick-from', text: 'Your own line' }),
          el('span', { class: 'pick-tools' },
            toolButton('up', 'Move up', move(index - 1), index === 0),
            toolButton('down', 'Move down', move(index + 1), index === draft.items.length - 1),
            toolButton('remove', 'Remove', () => { draft.items.splice(index, 1); changed(); }))),
        area);
    }));
    empty.hidden = draft.items.length > 0;
    if (focusLast) list.querySelector('li:last-child textarea')?.focus();
  }

  const reset = el('button', { type: 'button', class: 'ghost-btn', text: 'Start over' });
  let armed = null;
  reset.addEventListener('click', () => {
    if (!armed) {
      reset.textContent = 'Press again to clear everything';
      armed = setTimeout(() => { armed = null; reset.textContent = 'Start over'; }, 3000);
      return;
    }
    clearTimeout(armed);
    draft = fresh();
    save();
    renderPromptPage(main);
  });

  const step = (number, title, note) =>
    el('div', { class: 'step-head' }, el('span', { class: 'step-no', text: String(number) }),
      el('div', {}, el('h2', { text: title }), el('p', { text: note })));

  main.replaceChildren(
    el('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' }, el('a', { href: '#/', text: 'All terms' }), el('span', { text: '/' }), 'Tools'),
    el('header', {},
      el('h1', { text: 'Prompt builder' }),
      el('p', { class: 'lede', text: 'Put a project brief, your standing rules and the phrases you collected into one prompt. Everything you type stays in this browser.' })),
    el('div', { class: 'builder' },
      el('div', { class: 'builder-form' },
        el('section', {},
          step(1, 'Project brief', 'The facts an agent cannot guess. Leave a box empty to leave it out.'),
          el('div', { class: 'fields' }, FIELDS.map(field))),
        el('section', {},
          step(2, 'Standing rules', 'Untick any you do not want in the prompt.'),
          el('div', { class: 'checks' }, RULES.map(rule))),
        el('section', {},
          step(3, 'What you want', 'One step per line, in the order the agent should do them.'),
          empty, list,
          el('div', { class: 'pick-add' },
            el('button', { type: 'button', class: 'ghost-btn', onclick: () => { draft.items.push({ term: '', termId: '', text: '' }); save(); paintList(true); refresh(); } },
              icon('plus', 13), 'Add your own line'),
            el('a', { class: 'ghost-btn', href: '#/' }, 'Browse terms for phrases')))),
      el('div', { class: 'builder-out' },
        el('div', { class: 'sec-head' }, el('h2', {}, icon('say', 15), 'Your prompt'), copyButton(compose, 'Copy prompt')),
        output,
        el('div', { class: 'stage-foot' }, words, reset))),
  );
  paintList();
  refresh();
}

// ---- glossary for the agent -------------------------------------------------

const FILE = 'cad-terms.md';
const INSTRUCTION =
  'Before any CAD work, read docs/cad-terms.md. Use its terms with the meanings given there, follow its working rules and build123d notes, and ask me when a request is unclear.';

export async function renderAgentPage(main, termCount) {
  document.title = 'Glossary for your agent · CAD Terms';
  const address = new URL(FILE, location.href).href;
  let text = '';

  const preview = el('pre', { class: 'prompt-out file-view', tabindex: '0', 'aria-label': 'The glossary file', text: 'Loading…' });
  const size = el('span', { class: 'hint' });
  const copyLine = (value) => el('div', { class: 'copy-line' }, el('code', { text: value }), copyButton(value));

  main.replaceChildren(
    el('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' }, el('a', { href: '#/', text: 'All terms' }), el('span', { text: '/' }), 'Tools'),
    el('header', {},
      el('h1', { text: 'Glossary for your agent' }),
      el('p', { class: 'lede', text: `All ${termCount} terms in one text file: what each word means, the build123d code, and the notes on what usually goes wrong. Give it to your AI agent once, and it will use these words the way you do.` })),
    el('div', { class: 'builder' },
      el('div', { class: 'builder-form' },
        el('section', {},
          el('div', { class: 'file-actions' },
            copyButton(() => text, 'Copy the whole file'),
            el('a', { class: 'copy', href: FILE, download: FILE }, icon('download', 13), `Download ${FILE}`),
            el('a', { class: 'copy', href: FILE, target: '_blank', rel: 'noopener' }, 'Open as plain text'))),
        el('section', {},
          el('div', { class: 'sec-head' }, el('h2', {}, icon('info', 15), 'How to use it')),
          el('ol', { class: 'steps' },
            el('li', {}, el('p', {}, 'Save the file inside your CAD project, for example as ', el('code', { text: 'docs/cad-terms.md' }), '.')),
            el('li', {},
              el('p', { text: 'Tell your agent to read it. Add this line to the instruction file your agent uses, such as CLAUDE.md or AGENTS.md:' }),
              copyLine(INSTRUCTION)),
            el('li', {}, el('p', { text: 'Then talk normally. Words like counterbore, flush and “0.2 mm clearance” now mean the same thing to both of you.' })))),
        el('section', {},
          el('div', { class: 'sec-head' }, el('h2', {}, icon('code', 15), 'Or give it the address')),
          el('p', { class: 'note', text: 'An agent that can open web pages can read the file straight from here. This is the address of the copy you are looking at now.' }),
          copyLine(address)),
        el('section', { class: 'tip' },
          el('h2', {}, icon('layers', 15), 'It stays up to date'),
          el('p', {}, 'The file is rebuilt every time you run ', el('code', { text: 'python generate/build.py' }), ', so it always matches the pictures and code on this site.'))),
      el('div', { class: 'builder-out' },
        el('div', { class: 'sec-head' }, el('h2', {}, icon('book', 15), 'What is in the file')),
        preview,
        el('div', { class: 'stage-foot' }, size))),
  );

  try {
    const response = await fetch(FILE, { cache: 'no-cache' });
    if (!response.ok) throw new Error(response.statusText);
    text = await response.text();
    preview.textContent = text;
    const tokens = Math.round(text.length / 4 / 500) * 500;
    size.textContent = `${(text.length / 1024).toFixed(0)} kB · roughly ${tokens.toLocaleString('en')} tokens of an agent's context`;
  } catch {
    preview.textContent = `Could not load ${FILE}. Run:  python generate/build.py`;
  }
}
