// The guide pages: example prompts, setup, and why tscircuit.
// The words are in guide-data.js and examples-data.js. The pictures of the
// examples come from data/models/ex-*.json.

import { copyButton, el, fillIn, highlight } from './dom.js';
import { EXAMPLES } from './examples-data.js';
import {
  COMPARE, GROUPS, OPENING, PART_FACTS, PART_TEMPLATE, RULES, SETUP, TROUBLE, VERSUS, WHY_LIMITS, WHY_POINTS,
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

/** A link that saves pcb-terms.md, the text version of the glossary. */
function glossaryLink() {
  return el('div', { class: 'tools' },
    el('a', { class: 'tool', href: 'pcb-terms.md', download: 'pcb-terms.md' },
      el('span', { class: 'cat-ico cat-ico-lg' }, icon('book', 22)),
      el('span', {}, el('strong', { text: 'pcb-terms.md' }),
        el('small', { text: 'Every term on this site, with its tscircuit code, as one text file.' }))));
}

// ---- example prompts: the list ------------------------------------------------

export function renderExamples(main, app) {
  document.title = 'Example prompts · PCB Terms';

  const template = el('p', { class: 'template' }, fillIn(PART_TEMPLATE));

  main.replaceChildren(
    crumbs('Example prompts'),
    el('header', {},
      el('h1', { text: 'Example prompts, and what they made' }),
      el('p', { class: 'lede', text: `${EXAMPLES.length} small boards, each shown as a short conversation: the prompt, the answer, and the board after every step. The conversations are written to show the kind of prompt that works. The code of every step was run through tscircuit, and each picture is what tscircuit drew from it. Copy a prompt, change the numbers, and use it.` })),

    el('section', { class: 'guide-sec' },
      el('div', { class: 'sec-head' }, h2('info', 'Three things every first prompt says')),
      el('div', { class: 'two three' },
        el('div', { class: 'point' },
          el('strong', { text: 'Use tscircuit' }),
          el('p', { text: 'Name the tool and the file. Without it, an agent may describe a board in words, or reach for another program.' })),
        el('div', { class: 'point' },
          el('strong', { text: 'Build after every change, and report' }),
          el('p', { text: 'The build prints every error and warning. Ask for all of them, every time. That list is how an agent that cannot see the board checks it.' })),
        el('div', { class: 'point' },
          el('strong', { text: 'Place first, then route' }),
          el('p', { text: 'Ask for the parts to be placed, and stop. Look. Only then ask for the connections. Most routing problems are placement problems.' }))),
      el('p', { class: 'note', text: 'As one sentence, to start any prompt with:' }),
      textBlock(OPENING),
      el('p', { class: 'note' }, 'Better still, save the full rules once as CLAUDE.md in your project. The agent then reads them at the start of every session. ',
        el('a', { href: '#/setup', text: 'Setup, step 8' }), ' shows how.'),
      el('details', { class: 'fold' },
        el('summary', { text: 'Show the full rules' }),
        textBlock(RULES, 'Copy rules'))),

    ...GROUPS.map((group) => {
      const items = EXAMPLES.filter((example) => example.group === group.id);
      if (!items.length) return null;
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
      el('div', { class: 'sec-head' }, h2('say', 'A prompt for adding any part'), copyButton(() => template.textContent, 'Copy prompt')),
      el('p', { class: 'note', text: 'Chips, connectors, modules: the prompt has the same shape for all of them. Click a marked value to type your own.' }),
      template),

    el('section', { class: 'guide-sec' },
      el('div', { class: 'sec-head' }, h2('table', PART_FACTS.caption)),
      table(PART_FACTS, 'table-text'),
      el('p', { class: 'note', text: PART_FACTS.note })),
  );
}

// ---- example prompts: one example ----------------------------------------------

/**
 * Draws the page at once, with an empty picture area. The caller loads the
 * model and then calls ready(model, makeStage), or failed().
 */
export function renderExample(main, app, example) {
  document.title = `${example.title} · PCB Terms`;
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
      ? el('button', { type: 'button', class: 'copy', onclick: () => stage?.select(step.state) }, icon('eye', 12), 'Show the board')
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
    crumbs({ href: '#/examples', text: 'Example prompts' }, group?.name ?? ''),
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

  /** Mark the step whose picture is showing. */
  function mark(state) {
    for (const card of cards) card.classList.toggle('is-shown', card.dataset.state === String(state));
  }

  return {
    failed() {
      stageSlot.querySelector('.stage-msg').textContent =
        'No picture has been built for this example yet. Run:  node generate/build.mjs';
    },
    ready(model, makeStage) {
      // a link may name the picture to open with: #/e/ex-led-board?s=2
      const asked = Number(new URLSearchParams(location.hash.split('?')[1] ?? '').get('s') ?? NaN);
      const first = example.steps.find((step) => step.state !== null && step.state !== undefined);
      const start = model.states[asked] ? asked : first ? first.state : 0;
      stage = makeStage({ start, onSelect: mark });
      stageSlot.replaceWith(stage);
      mark(start);
      if (model.files?.length) codeSlot.replaceWith(filesSection(model.files));
    },
  };
}

/** The code of an example as it is after the last step. */
function filesSection(files) {
  const file = files[files.length - 1];
  return el('section', { class: 'guide-sec' },
    el('div', { class: 'sec-head' }, h2('code', 'The file after the last step')),
    codeBlock(file.code, file.name),
    el('p', { class: 'note', text: 'This is the code that made the last picture above. Save it as index.circuit.tsx in a tscircuit project and it builds as it is.' }));
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
  document.title = 'Setup · PCB Terms';
  main.replaceChildren(
    crumbs('Setup'),
    el('header', {},
      el('h1', { text: 'Set up your computer' }),
      el('p', { class: 'lede', text: `From nothing to a board on the screen, in ${SETUP.length} steps: VS Code, Bun, tscircuit and the Claude Code extension. It takes about fifteen minutes.` })),
    el('ol', { class: 'setup' }, SETUP.map((step, index) =>
      el('li', { class: 'setup-step' },
        el('div', { class: 'step-head' },
          el('span', { class: 'step-no', text: String(index + 1) }),
          el('h2', { text: step.title })),
        el('div', { class: 'setup-body' },
          paragraphs(step.body),
          step.commands && commands(step.commands),
          step.rules && textBlock(RULES, 'Copy rules'),
          paragraphs(step.after),
          step.code && codeBlock(step.code, step.codeName),
          step.glossary && glossaryLink(),
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

// ---- why tscircuit --------------------------------------------------------------

export function renderWhy(main) {
  document.title = 'Why tscircuit · PCB Terms';
  main.replaceChildren(
    crumbs('Why tscircuit'),
    el('header', {},
      el('h1', { text: 'Why tscircuit for boards made with an agent' }),
      el('p', { class: 'lede', text: 'An AI coding agent is good at two things: reading and writing text, and running a program to see what happens. tscircuit turns a circuit board into exactly that, a short file of code and one command that builds it and says what is wrong.' })),
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
      el('h2', { class: 'plain-h2', text: 'Where tscircuit is the wrong tool' }),
      el('ul', { class: 'plain-list' }, WHY_LIMITS.map((text) => el('li', { text })))),
    el('div', { class: 'tools' },
      el('a', { class: 'tool', href: '#/setup' },
        el('span', { class: 'cat-ico cat-ico-lg' }, icon('wrench', 22)),
        el('span', {}, el('strong', { text: 'Setup' }), el('small', { text: 'Install everything, step by step.' }))),
      el('a', { class: 'tool', href: '#/examples' },
        el('span', { class: 'cat-ico cat-ico-lg' }, icon('say', 22)),
        el('span', {}, el('strong', { text: 'Example prompts' }), el('small', { text: 'See it work on real boards.' })))),
  );
}
