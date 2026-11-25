// Rebuild the data files for the website.
//
//   node generate/build.mjs                 every term and every example
//   node generate/build.mjs via trace       only the named terms or examples
//   node generate/build.mjs --no-run        draw the pictures, but do not run the code
//   node generate/build.mjs --force         run the code again even if it did not change
//   node generate/build.mjs --files=4-routing   load only these term files (a quick, partial build:
//                                               model files are written, terms.json and pcb-terms.md are not)
//
// For each term it draws the pictures (pic.mjs), runs the tscircuit code and
// keeps what tscircuit drew, then writes:
//
//   data/terms.json            the words
//   data/models/<id>.json      the pictures and the code of one term or example
//   pcb-terms.md               the whole glossary as one text file for an AI agent
//
// Running the code needs the packages in generate/package.json (npm install).
// Without them the pictures are still drawn and the last tscircuit output is kept.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { AGENT_RULES, CATEGORIES } from './categories.mjs';
import { writeGlossary } from './glossary.mjs';
import { Pic } from './pic.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(HERE);
const MODELS = join(ROOT, 'data', 'models');
const CACHE = join(HERE, '.cache', String(process.pid));

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith('--')));
const wanted = new Set(args.filter((arg) => !arg.startsWith('--')));
const onlyFiles = args.find((arg) => arg.startsWith('--files='))?.slice(8).split(',') ?? null;

// ---- loading ---------------------------------------------------------------------

async function loadFolder(name) {
  const folder = join(HERE, name);
  if (!existsSync(folder)) return [];
  const out = [];
  for (const file of readdirSync(folder).filter((f) => f.endsWith('.mjs')).sort()) {
    if (onlyFiles && !onlyFiles.includes(file.replace(/\.mjs$/, ''))) continue;
    const mod = await import(pathToFileURL(join(folder, file)).href);
    out.push(...mod.default);
  }
  return out;
}

// ---- running tscircuit code ------------------------------------------------------

let tools = null; // { esbuild, RootCircuit, toSvg, createElement } or false when not installed

async function loadTools() {
  if (tools !== null) return tools;
  try {
    const [esbuild, tscircuit, svg, react] = await Promise.all([
      import('esbuild'), import('tscircuit'), import('circuit-to-svg'), import('react'),
    ]);
    tools = {
      esbuild,
      RootCircuit: tscircuit.RootCircuit,
      toSvg: svg.convertCircuitJsonToPcbSvg,
      createElement: react.createElement,
    };
  } catch (error) {
    console.log(`  (tscircuit is not installed here, so the code is not run: ${error.code ?? error.message})`);
    console.log('  (to install it:  cd generate && npm install)');
    tools = false;
  }
  return tools;
}

/** Run one piece of tscircuit code. Returns { svg, errors, counts }. */
async function runCode(id, code, options = {}) {
  const { esbuild, RootCircuit, toSvg, createElement } = tools;
  mkdirSync(CACHE, { recursive: true });
  const js = await esbuild.transform(code, { loader: 'tsx', jsx: 'automatic', format: 'esm' });
  const file = join(CACHE, `${id}.mjs`);
  writeFileSync(file, js.code);
  const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`);
  const circuit = new RootCircuit();
  circuit.add(createElement(mod.default));
  await circuit.renderUntilSettled();
  const json = circuit.getCircuitJson();
  const errors = json.filter((item) => item.type.endsWith('_error')).map((item) => `${item.type}: ${item.message ?? ''}`.trim());
  const counts = {};
  for (const item of json) counts[item.type] = (counts[item.type] ?? 0) + 1;
  const svg = toSvg(json, { width: 800, height: 600, ...options })
    .replace(/^<svg ([^>]*?)width="800" height="600"/, '<svg class="tsc" viewBox="0 0 800 600" $1')
    .replace(/ data-software-used-string="[^"]*"/, '');
  return { svg, errors, counts };
}

// ---- one term or example ------------------------------------------------------------

const hash = (value) => createHash('sha1').update(JSON.stringify(value)).digest('hex').slice(0, 12);

function readModel(id) {
  const file = join(MODELS, `${id}.json`);
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
}

function draw(id, picture) {
  const pic = new Pic();
  picture.draw(pic);
  for (const problem of pic.problems) console.log(`  ${id} / ${picture.label}: ${problem}`);
  return { label: picture.label, type: 'svg', svg: pic.render() };
}

/**
 * The tscircuit picture of one piece of code: fresh, or the saved one if the code did not change.
 * Returns a picture state, or null when there is nothing to show.
 */
async function rendered(id, entry, old, label, problems) {
  if (!entry.code || entry.run === false) return null;
  const key = hash([entry.code, entry.renderOptions ?? null]);
  // code that was already run, and whose picture is not shown, needs nothing more
  if (entry.render === false && old?.checked === key && !flags.has('--force')) return { hidden: true, codeHash: key };
  const saved = old?.states?.find((state) => state.codeHash === key);
  let state = saved && !flags.has('--force') ? saved : null;
  if (!state && !flags.has('--no-run') && (await loadTools())) {
    try {
      const result = await runCode(id, entry.code, entry.renderOptions);
      if (result.errors.length && !entry.expectErrors) {
        problems.push(`${id}: tscircuit reports ${result.errors.length} error(s)\n    ${result.errors.slice(0, 4).join('\n    ')}`);
      }
      state = { label, type: 'svg', render: true, codeHash: key, svg: result.svg };
    } catch (error) {
      problems.push(`${id}: the code does not run\n    ${String(error.message).split('\n')[0]}`);
    }
  }
  if (!state) return null;
  return entry.render === false ? { hidden: true, ...state } : { ...state, label };
}

async function buildTerm(term, problems) {
  const old = readModel(term.id);
  const states = (term.pictures ?? []).map((picture) => draw(term.id, picture));
  const shot = await rendered(term.id, term, old, 'In tscircuit', problems);
  if (shot && !shot.hidden) states.push(shot);
  if (!states.length) problems.push(`${term.id}: no picture`);
  const model = { id: term.id, code: term.code ?? '', thumb: term.thumb ?? 0, states };
  if (shot?.hidden) model.checked = shot.codeHash; // the code was run, its picture is not shown
  writeFileSync(join(MODELS, `${term.id}.json`), JSON.stringify(model));
}

/** An example: a list of steps, each with its own code. Every step's picture is what tscircuit drew. */
async function buildExample(example, problems) {
  const old = readModel(example.id);
  const states = [];
  const files = [];
  for (const [index, step] of example.steps.entries()) {
    if (!step.code) continue;
    const shot = await rendered(`${example.id}-${index + 1}`, { code: step.code, renderOptions: step.renderOptions, expectErrors: step.expectErrors }, old, step.title, problems);
    if (shot) states.push(shot);
    files.push({ name: step.file ?? `step ${index + 1}`, code: step.code });
  }
  const model = { id: example.id, code: '', thumb: Math.max(0, states.length - 1), states, files: files.slice(-1) };
  writeFileSync(join(MODELS, `${example.id}.json`), JSON.stringify(model));
}

/** The words of the examples, as a file the website imports. Their code and pictures are in the model files. */
function writeExamples(examples) {
  const words = examples.map(({ steps, ...rest }) => ({
    ...rest,
    steps: steps.map(({ code, renderOptions, expectErrors, file, ...said }, index) => ({
      ...said,
      // which picture belongs to this step: steps without code have none
      state: code ? steps.slice(0, index).filter((step) => step.code).length : null,
    })),
  }));
  writeFileSync(join(ROOT, 'js', 'examples-data.js'),
    '// Made by generate/build.mjs from generate/examples/*.mjs. Do not edit by hand.\n'
    + `export const EXAMPLES = ${JSON.stringify(words, null, 1)};\n`);
}

// ---- everything -------------------------------------------------------------------

const TEXT_KEYS = ['id', 'name', 'category', 'aka', 'keywords', 'summary', 'definition', 'table', 'say', 'codeNote', 'cli', 'fabTip', 'note', 'confusedWith'];

async function main() {
  mkdirSync(MODELS, { recursive: true });
  const terms = await loadFolder('terms');
  const examples = await loadFolder('examples');
  const problems = [];

  // the same checks the website relies on
  const ids = new Set();
  for (const term of terms) {
    if (ids.has(term.id)) problems.push(`${term.id}: used twice`);
    ids.add(term.id);
    if (!CATEGORIES.some((category) => category.id === term.category)) problems.push(`${term.id}: unknown group "${term.category}"`);
  }
  if (!onlyFiles) {
    for (const term of terms) {
      for (const other of term.confusedWith ?? []) {
        if (other.id && !ids.has(other.id)) problems.push(`${term.id}: "confused with" names ${other.id}, which is not a term`);
      }
    }
    for (const example of examples) {
      for (const id of example.terms ?? []) if (!ids.has(id)) problems.push(`${example.id}: names ${id}, which is not a term`);
    }
  }

  const todo = [...terms, ...examples].filter((item) => !wanted.size || wanted.has(item.id));
  console.log(`Building ${todo.length} of ${terms.length} terms and ${examples.length} examples`);
  for (const item of todo) {
    if (item.steps) await buildExample(item, problems);
    else await buildTerm(item, problems);
  }

  if (existsSync(CACHE)) rmSync(CACHE, { recursive: true, force: true });
  // the words of the examples, for the website (a partial build writes them only if it loaded them)
  if (!onlyFiles || examples.length) writeExamples(examples);
  if (onlyFiles) {
    console.log(`Wrote ${todo.length} model file(s). A partial build: terms.json and pcb-terms.md were left alone.`);
    for (const problem of problems) console.log(`  ${problem}`);
    return problems.length ? 1 : 0;
  }

  // model files of terms that no longer exist
  if (!wanted.size) {
    const known = new Set([...terms, ...examples].map((item) => `${item.id}.json`));
    for (const file of readdirSync(MODELS)) if (!known.has(file)) rmSync(join(MODELS, file));
  }

  const data = {
    categories: CATEGORIES,
    agentRules: AGENT_RULES,
    terms: CATEGORIES.flatMap((category) => terms.filter((term) => term.category === category.id))
      .map((term) => Object.fromEntries(TEXT_KEYS.filter((key) => term[key] !== undefined).map((key) => [key, term[key]]))),
  };
  writeFileSync(join(ROOT, 'data', 'terms.json'), `${JSON.stringify(data, null, 1)}\n`);

  const glossary = writeGlossary(ROOT, data, terms);
  console.log(`Wrote data/terms.json, ${todo.length} model file(s) and ${glossary}`);

  if (problems.length) {
    console.log(`\n${problems.length} problem(s):`);
    for (const problem of problems) console.log(`  ${problem}`);
    return 1;
  }
  console.log('Done');
  return 0;
}

process.exit(await main());
