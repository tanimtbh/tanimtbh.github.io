// The guide pages: example prompts, setup, and why build123d.
// The words are in guide-data.js. The pictures come from data/models/ex-*.json.

import { copyButton, el, fillIn, highlight } from './dom.js';
import {
  BOUGHT_FACTS, BOUGHT_TEMPLATE, COMPARE, EXAMPLES, GROUPS, OPENING, RULES, SETUP, TROUBLE, VERSUS, WHY_LIMITS, WHY_POINTS,
} from './guide-data.js';
import { icon } from './icons.js';

const exampleUrl = (example) => `#/e/${example.id}`;

function crumbs(...trail) {
  const parts = [el('a', { href: '#/', text: 'All terms' })];
  for (const item of trail) {
    parts.push(el('span', { text: '/' }), typeof item === 'string' ? item : el('a', { href: item.href, text: item.text }));
  }
  return el('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' }, parts);
}

const h2 = (shape, title) => el('h2', {}, icon(shape, 15), title);

/** A block of text to copy, such as a prompt or a command. */
function textBlock(text, label = 'Copy') {
  return el('div', { class: 'block' },
    el('pre', { class: 'block-text', tabindex: '0', text }),
    copyButton(text, label));
}

function codeBlock(code, title) {
  return el('div', { class: 'code' },
    el('div', { class: 'code-head' }, el('span', { text: title }), copyButton(code)),
    el('pre', {}, el('code', {}, highlight(code))));
}

function table(data, kind = '') {
  return el('div', { class: `table-wrap ${kind}`.trim(), tabindex: '0', role: 'region', 'aria-label': data.caption },
    el('table', {},
      el('thead', {}, el('tr', {}, data.columns.map((name) => el('th', { scope: 'col', text: name })))),
      el('tbody', {}, data.rows.map((row) =>
        el('tr', {}, row.map((cell, i) => el(i ? 'td' : 'th', { scope: !i && 'row', text: cell })))))));
}

// ---- example prompts: the list ------------------------------------------------

export function renderExamples(main, app) {
  document.title = 'Example prompts · CAD Terms';

  const template = el('p', { class: 'template' }, fillIn(BOUGHT_TEMPLATE));

  main.replaceChildren(
    crumbs('Example prompts'),
    el('header', {},
      el('h1', { text: 'Example prompts, and what they made' }),
      el('p', { class: 'lede', text: `${EXAMPLES.length} small projects, each shown as the prompts that were typed, what the agent answered, the part in the viewer after every step, and the build123d code that came out. Copy a prompt, change the numbers, and use it.` })),

    el('section', { class: 'guide-sec' },
      el('div', { class: 'sec-head' }, h2('info', 'Two things every first prompt says')),
      el('div', { class: 'two' },
        el('div', { class: 'point' },
          el('strong', { text: 'Use build123d' }),
          el('p', { text: 'Name the tool. Without it, an agent may pick another CAD library, or mix two.' })),
        el('div', { class: 'point' },
          el('strong', { text: 'Push every change to the OCP viewer' }),
          el('p', { text: 'Ask for one geometric change at a time, shown with show() before the next one starts. You see a mistake the moment it is made.' }))),
      el('p', { class: 'note', text: 'As one sentence, to start any prompt with:' }),
      textBlock(OPENING),
      el('p', { class: 'note' }, 'Better still, save the full rules once as CLAUDE.md in your project. The agent then reads them at the start of every session. ',
        el('a', { href: '#/setup', text: 'Setup, step 8' }), ' shows how.'),
      el('details', { class: 'fold' },
        el('summary', { text: 'Show the full rules' }),
        textBlock(RULES, 'Copy rules'))),

    ...GROUPS.map((group) => {
      const items = EXAMPLES.filter((example) => example.group === group.id);
      return el('section', { class: 'group' },
        el('div', { class: 'group-head' },
          el('div', {},
            el('h2', {}, group.name, el('span', { text: `${items.length} ${items.length === 1 ? 'example' : 'examples'}` })),
            el('p', { text: group.blurb }))),
        el('div', { class: 'cards cards-wide' }, items.map((example) =>
          el('a', { class: 'card', href: exampleUrl(example) },
            app.thumb(example.id),
            el('div', { class: 'card-body' },
              el('h3', { text: example.title }),
              el('p', { text: example.summary }),
              el('span', { class: 'card-cat', text: `${example.steps.length} prompts` }))))));
    }),

    el('section', { class: 'guide-sec' },
      el('div', { class: 'sec-head' }, h2('say', 'A prompt for any bought part'), copyButton(() => template.textContent, 'Copy prompt')),
      el('p', { class: 'note', text: 'Motors, actuators, bearings, displays: the prompt has the same shape for all of them. Click a marked value to type your own.' }),
      template),

    el('section', { class: 'guide-sec' },
      el('div', { class: 'sec-head' }, h2('table', BOUGHT_FACTS.caption)),
      table(BOUGHT_FACTS, 'table-text'),
      el('p', { class: 'note', text: BOUGHT_FACTS.note })),
  );
}

// ---- example prompts: one example ----------------------------------------------

/**
 * Draws the page at once, with an empty picture area. The caller loads the
 * model and then calls ready(model, makeStage), or failed().
 */
export function renderExample(main, app, example) {
  document.title = `${example.title} · CAD Terms`;
  const group = GROUPS.find((item) => item.id === example.group);
  const at = EXAMPLES.indexOf(example);
  const before = EXAMPLES[at - 1];
  const after = EXAMPLES[at + 1];

  const stageSlot = el('div', { class: 'stage' },
    el('div', { class: 'stage-bar' }),
    el('div', { class: 'stage-frame' }, el('p', { class: 'stage-msg', text: 'Loading picture…' })));
  const codeSlot = el('div');
  let stage = null;

  const cards = example.steps.map((step, index) => {
    const hasPicture = step.state !== null && step.state !== undefined;
    const view = hasPicture
      ? el('button', { type: 'button', class: 'copy', onclick: () => stage?.select(step.state) }, icon('cube', 12), 'Show in viewer')
      : el('span', { class: 'hint', text: 'no picture yet' });
    return el('li', { class: 'turn', 'data-state': hasPicture ? String(step.state) : '' },
      el('div', { class: 'turn-head' },
        el('span', { class: 'step-no', text: String(index + 1) }),
        el('h3', { text: step.title }),
        view),
      el('div', { class: 'said said-you' },
        el('div', { class: 'said-top' }, el('span', { class: 'said-who', text: 'You' }), copyButton(step.prompt)),
        el('p', { text: step.prompt })),
      el('div', { class: 'said said-agent' },
        el('div', { class: 'said-top' }, el('span', { class: 'said-who', text: 'Agent' })),
        el('p', { text: step.reply })));
  });

  const terms = example.terms.map((id) => app.term(id)).filter(Boolean);

  main.replaceChildren(
    crumbs({ href: '#/examples', text: 'Example prompts' }, group.name),
    el('header', {},
      el('h1', { text: example.title }),
      el('p', { class: 'lede', text: example.intro })),
    el('div', { class: 'term-grid' },
      stageSlot,
      el('div', { class: 'term-body' },
        example.aside && el('p', { class: 'aside', text: example.aside }),
        el('ol', { class: 'turns' }, cards))),
    codeSlot,
    el('section', { class: 'guide-sec' },
      el('div', { class: 'sec-head' }, h2('info', 'Why these prompts work')),
      el('ul', { class: 'ticks' }, example.why.map((text) => el('li', {}, icon('check', 16), el('span', { text }))))),
    terms.length ? el('section', { class: 'guide-sec' },
      el('div', { class: 'sec-head' }, h2('book', 'Terms used here')),
      el('div', { class: 'chips chips-flat' }, terms.map((term) =>
        el('a', { class: 'chip chip-term', href: app.termUrl(term), text: term.name })))) : null,
    el('nav', { class: 'pager', 'aria-label': 'More examples' },
      before && el('a', { class: 'prev', href: exampleUrl(before) }, el('small', { text: '← Previous' }), before.title),
      after && el('a', { class: 'next', href: exampleUrl(after) }, el('small', { text: 'Next →' }), after.title)),
  );

  /** Mark the step whose picture is showing. Several steps never share a picture. */
  function mark(state) {
    for (const card of cards) card.classList.toggle('is-shown', card.dataset.state === String(state));
  }

  return {
    failed() {
      stageSlot.querySelector('.stage-msg').textContent =
        'No picture has been built for this example yet. Run:  python generate/build.py';
    },
    ready(model, makeStage) {
      // a link may name the picture to open with: #/e/ex-box-lid?s=3
      const asked = Number(new URLSearchParams(location.hash.split('?')[1] ?? '').get('s') ?? NaN);
      const first = example.steps.find((step) => step.state !== null && step.state !== undefined);
      const start = model.states[asked] ? asked : first ? first.state : 0;
      const legend = { accent: 'added in this step', mate: 'second printed part', ...example.legend };
      stage = makeStage({ legend, start, onSelect: mark });
      stageSlot.replaceWith(stage);
      mark(start);
      if (model.files?.length) codeSlot.replaceWith(filesSection(model.files));
    },
  };
}

/** The code of an example, one file at a time. */
function filesSection(files) {
  const holder = el('div');
  const buttons = files.map((file, index) =>
    el('button', { type: 'button', class: 'seg-btn', text: file.name, onclick: () => pick(index) }));

  function pick(index) {
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    holder.replaceChildren(codeBlock(files[index].code, files[index].name));
  }

  pick(files.length - 1);
  return el('section', { class: 'guide-sec' },
    el('div', { class: 'sec-head' }, h2('code', files.length > 1 ? 'The files the agent wrote' : 'The file the agent wrote')),
    files.length > 1 && el('div', { class: 'seg seg-files', role: 'group', 'aria-label': 'Choose a file' }, buttons),
    holder,
    el('p', { class: 'note', text: 'This is the code that made the pictures above. show() is the one line that sends a shape to the viewer.' }));
}

// ---- setup --------------------------------------------------------------------

function commands(list) {
  return list.map((item) =>
    el('div', { class: 'cmd' },
      item.label && el('span', { class: 'cmd-label', text: item.label }),
      textBlock(item.code)));
}

const paragraphs = (list) => (list ?? []).map((text) => el('p', { text }));

export function renderSetup(main) {
  document.title = 'Setup · CAD Terms';
  main.replaceChildren(
    crumbs('Setup'),
    el('header', {},
      el('h1', { text: 'Set up your computer' }),
      el('p', { class: 'lede', text: 'From nothing to a part in the viewer, in nine steps: VS Code, the uv package manager, build123d, the OCP CAD Viewer and the Claude Code extension. It takes about fifteen minutes.' })),
    el('ol', { class: 'setup' }, SETUP.map((step, index) =>
      el('li', { class: 'setup-step' },
        el('div', { class: 'step-head' },
          el('span', { class: 'step-no', text: String(index + 1) }),
          el('h2', { text: step.title })),
        el('div', { class: 'setup-body' },
          paragraphs(step.body),
          step.list && el('ul', { class: 'ext-list' }, step.list.map(([name, what]) =>
            el('li', {}, el('strong', { text: name }), ` ${what}`))),
          step.commands && commands(step.commands),
          step.code && codeBlock(step.code, 'hello.py'),
          step.rules && textBlock(RULES, 'Copy rules'),
          paragraphs(step.after),
          step.commandsAfter && commands(step.commandsAfter),
          paragraphs(step.end),
          step.next && el('div', { class: 'tools' },
            el('a', { class: 'tool', href: '#/examples' },
              el('span', { class: 'cat-ico cat-ico-lg' }, icon('say', 22)),
              el('span', {}, el('strong', { text: 'Example prompts' }),
                el('small', { text: 'Start from a prompt that already works.' })))),
          step.links && el('p', { class: 'note' }, 'More: ', step.links.flatMap((link, i) => [
            i ? ', ' : null,
            el('a', { href: link.href, target: '_blank', rel: 'noopener', text: link.text }),
          ])))))),
    el('section', { class: 'guide-sec' },
      el('div', { class: 'sec-head' }, h2('info', 'If something does not work')),
      el('dl', { class: 'trouble' }, TROUBLE.flatMap(([problem, fix]) => [
        el('dt', { text: problem }), el('dd', { text: fix }),
      ]))),
  );
}

// ---- why build123d --------------------------------------------------------------

export function renderWhy(main) {
  document.title = 'Why build123d · CAD Terms';
  main.replaceChildren(
    crumbs('Why build123d'),
    el('header', {},
      el('h1', { text: 'Why build123d and the OCP viewer' }),
      el('p', { class: 'lede', text: 'An AI coding agent is good at two things: reading and writing text, and running a program to see what happens. build123d turns a 3D part into exactly that, a short Python program. The OCP viewer shows you the result after every run.' })),
    el('div', { class: 'points' }, WHY_POINTS.map((point, index) =>
      el('div', { class: 'point' },
        el('span', { class: 'step-no', text: String(index + 1) }),
        el('div', {}, el('strong', { text: point.title }), el('p', { text: point.text }))))),
    el('section', { class: 'guide-sec' },
      el('div', { class: 'sec-head' }, h2('table', COMPARE.caption)),
      table(COMPARE, 'table-text table-compare')),
    ...VERSUS.map((item) =>
      el('section', { class: 'guide-sec prose' },
        el('h2', { class: 'plain-h2', text: item.title }),
        paragraphs(item.text),
        item.fair && el('div', { class: 'tip' }, el('h2', {}, icon('info', 15), 'To be fair'), el('p', { text: item.fair })))),
    el('section', { class: 'guide-sec prose' },
      el('h2', { class: 'plain-h2', text: 'Where build123d is the wrong tool' }),
      el('ul', { class: 'plain-list' }, WHY_LIMITS.map((text) => el('li', { text })))),
    el('div', { class: 'tools' },
      el('a', { class: 'tool', href: '#/setup' },
        el('span', { class: 'cat-ico cat-ico-lg' }, icon('wrench', 22)),
        el('span', {}, el('strong', { text: 'Setup' }), el('small', { text: 'Install everything, step by step.' }))),
      el('a', { class: 'tool', href: '#/examples' },
        el('span', { class: 'cat-ico cat-ico-lg' }, icon('say', 22)),
        el('span', {}, el('strong', { text: 'Example prompts' }), el('small', { text: 'See it work on real parts.' })))),
  );
}
