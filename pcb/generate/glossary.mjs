// Write pcb-terms.md: the whole glossary as one text file for an AI agent.
//
// It is made from the same terms as the website, so both always say the same
// thing. build.mjs runs this at the end.

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const plain = (text) => text.replace(/[{}]/g, '');

function table(data) {
  const lines = [`${data.caption}:`, '', `| ${data.columns.join(' | ')} |`, `|${'---|'.repeat(data.columns.length)}`];
  for (const row of data.rows) lines.push(`| ${row.join(' | ')} |`);
  if (data.note) lines.push('', data.note);
  return lines;
}

export function writeGlossary(root, data, terms) {
  const names = new Map(terms.map((term) => [term.id, term.name]));
  const out = [
    '# PCB terms for tscircuit',
    '',
    'A shared vocabulary between a person and an AI agent that writes tscircuit code for printed circuit boards. '
      + 'When the person uses one of these terms, it has the meaning given here.',
    '',
    '## Working rules',
    '',
    ...data.agentRules.map((rule) => `- ${rule}`),
    '',
    '## tscircuit notes to remember',
    '',
    ...terms.filter((term) => term.codeNote).map((term) => `- **${term.name}:** ${term.codeNote}`),
  ];

  for (const category of data.categories) {
    out.push('', `## ${category.name}`, '', category.blurb);
    for (const term of terms.filter((item) => item.category === category.id)) {
      out.push('', `### ${term.name}`, '');
      if (term.aka?.length) out.push(`Also called: ${term.aka.join(', ')}.`, '');
      out.push(term.definition);
      if (term.say?.length) {
        out.push('', 'How the person may say it:', ...term.say.map((entry) => `- ${plain(entry.text)}`));
      }
      if (term.code) out.push('', '```tsx', term.code, '```');
      if (term.cli) out.push('', '```sh', term.cli, '```');
      if (term.codeNote) out.push('', `Code note: ${term.codeNote}`);
      if (term.table) out.push('', ...table(term.table));
      if (term.fabTip) out.push('', `At the factory: ${term.fabTip}`);
      if (term.note) out.push('', `Good to know: ${term.note}`);
      for (const other of term.confusedWith ?? []) {
        out.push('', `Not the same as ${names.get(other.id) ?? other.name}: ${other.diff}`);
      }
    }
  }

  writeFileSync(join(root, 'pcb-terms.md'), `${out.join('\n')}\n`);
  return 'pcb-terms.md';
}
