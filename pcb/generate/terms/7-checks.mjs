// Rules and checks: what a factory can make, and the mistakes a check should catch.

const B = [8, 10, 104, 86]; // the usual board, leaving room for labels on the right
const LX = 117; // where those labels start

/** A small numbered tag on the picture, explained by a list beside it. */
function tag(p, x, y, number) {
  p.circle(x, y, 2.7, 'f-white s-ink', { note: true });
  p.label(x, y + 1.25, String(number), { anchor: 'middle', size: 3.5, cls: 'lbl-dark' });
}

/** A box of a flow diagram. */
const box = (p, x, y, w, h) => p.rect(x, y, w, h, 'f-stage s-ink', { r: 1.5 });

export default [
  {
    id: 'drc',
    name: 'Design rule check',
    category: 'checks',
    aka: ['DRC', 'rule check', 'board check', 'design check'],
    keywords: 'errors violations check verify rules clearance overlap edge unrouted report build',
    summary: 'The automatic check that compares the finished board with the rules.',
    definition: 'A design rule check, or DRC, is a program that measures the whole board and compares it with the rules. It looks for copper that is too close together, parts that overlap, parts that hang over the edge, and connections that were never routed. Each problem it finds is reported as an error, with the place and the numbers. In tscircuit the check runs every time the board is built. A board is not ready for the factory until the check comes back empty.',
    say: [
      { for: 'After every change', text: 'Build the board and show me every error and warning, word for word. Do not summarise them.' },
      { for: 'Fix, do not hide', text: 'Fix each error by moving parts or traces. Do not switch a check off and do not loosen a rule to make an error go away.' },
      { for: 'One at a time', text: 'Fix the placement errors first and build again. Only then look at the routing errors.' },
      { for: 'Before ordering', text: 'Run the full check one last time and confirm that there are zero errors.' },
    ],
    code: `export default () => (
  <board width="16mm" height="10mm">
    <resistor name="R1" resistance="1k" footprint="0603" pcbX={-7.4} pcbY={0} />
    <resistor name="R2" resistance="1k" footprint="0805" pcbX={3} pcbY={0} />
    <resistor name="R3" resistance="1k" footprint="0805" pcbX={5} pcbY={0.6} />
    <trace from="R1.pin2" to="R2.pin1" />
  </board>
)`,
    expectErrors: true,
    cli: `# build the board: every error is printed, and the exit code is 1 if there is one
tsci build index.circuit.tsx

# look at one kind of problem at a time
tsci check placement index.circuit.tsx
tsci check shorts index.circuit.tsx`,
    codeNote: 'This board is wrong on purpose. Building it prints: "SMT pad R1.pin1 violates copper-to-board-edge clearance (measured 0.000mm, required 0.200mm)", "Component R1 extends outside board boundaries by 0.88mm. Try moving it 0.88mm right to fit within the board edge." and "R2 overlaps R3: 1 footprint overlap, 1 pad clearance violation, 1 courtyard conflict. Move the components apart." Then it says that autorouting was skipped: tscircuit does not route a board that has placement errors, so the trace is reported as missing too.',
    note: 'One real mistake often causes several errors. Here, three placement errors stop the routing, and that adds three more. Fix the first error in the list, build again, and see what is left.',
    confusedWith: [
      { id: 'design-rules', diff: 'The design rules are the numbers. The design rule check is the program that measures the board against them.' },
      { id: 'circuit-json', diff: 'The check produces the errors. Circuit JSON is the file they are written into, together with the rest of the board.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          p.chip(12, 28);
          p.chip(48, 50, { len: 14, wid: 7 });
          p.chip(57, 54, { len: 14, wid: 7 });
          p.trace([[16, 82], [104, 82]]);
          p.pad(72, 78.5, 9, 6);
          p.ring(12, 28, 8).ring(52.5, 52, 12).ring(72, 80, 8);
          p.leader(LX, 24, 19.5, 26.5, 'part over the edge');
          p.leader(LX, 46, 64, 49, 'two parts overlap');
          p.leader(LX, 76, 79.5, 79, 'trace touches a pad');
          p.caption('Three things a check finds');
        },
      },
    ],
  },

  {
    id: 'design-rules',
    name: 'Design rules',
    category: 'checks',
    aka: ['fab rules', 'manufacturing limits', 'capabilities', 'minimum trace and space', 'DFM rules'],
    keywords: 'minimum limits factory can make smallest trace space drill ring edge tolerance jlcpcb pcbway',
    summary: 'The smallest sizes and gaps that the factory can make reliably.',
    definition: 'Design rules are a short list of limits: the thinnest trace, the smallest gap, the smallest hole, and so on. They come from the factory, because each factory can only make things down to a certain size. A board that breaks a rule may be refused, or made badly. Choose the factory first, read its limits, and then design with some margin above them: a board drawn exactly at the limit is the hardest and the most expensive to make.',
    say: [
      { for: 'State them once', text: 'Design rules for this board: traces {0.2 mm} or wider, clearance {0.2 mm}, vias {0.6 / 0.3 mm}, copper {0.3 mm} from the board edge.' },
      { for: 'Name the factory', text: 'This board will be made by {JLCPCB, standard 2-layer service}. Ask me for its limits if you are not sure of them. Do not guess.' },
      { for: 'Report the margins', text: 'Tell me the thinnest trace, the smallest gap and the smallest via on the board, and compare each with the rule.' },
      { for: 'An exception', text: 'You may go down to {0.15 mm} traces only between the pads of {U1}. Everywhere else the normal rules apply.' },
    ],
    table: {
      caption: 'Typical rules for a simple two-layer board',
      columns: ['Rule', 'Common low-cost limit', 'Safe default'],
      rows: [
        ['Trace width', 'about 0.13 mm', '0.2 mm'],
        ['Clearance between copper', 'about 0.13 mm', '0.2 mm'],
        ['Via hole', 'about 0.3 mm', '0.3 mm'],
        ['Via copper diameter', 'about 0.5 mm', '0.6 mm'],
        ['Annular ring', 'about 0.13 mm', '0.15 mm'],
        ['Copper to board edge', 'about 0.2 mm', '0.3 mm'],
        ['Silkscreen text height', 'about 0.8 mm', '1.0 mm'],
      ],
      note: 'The limits are rough numbers for popular prototype services. They differ from factory to factory and change over time, so read the capabilities page of your factory before you go below the safe default.',
    },
    code: `export default () => (
  <board width="16mm" height="10mm" minTraceWidth="0.2mm" minBoardEdgeClearance="0.3mm">
    <resistor name="R1" resistance="1k" footprint="0603" pcbX={-5} pcbY={0} />
    <resistor name="R2" resistance="1k" footprint="0603" pcbX={5} pcbY={0} />
    <trace from="R1.pin2" to="R2.pin1" />
  </board>
)`,
    render: false,
    codeNote: 'minTraceWidth on <board> is the width the autorouter gives a trace that has no width of its own: here 0.2 mm, where it would be 0.15 mm. minBoardEdgeClearance is checked: a pad nearer to the edge is reported as an error. With no rules given, tscircuit checks against its own: 0.2 mm from copper to the board edge and 0.1 mm between pads. Be careful: a thickness you write on a <trace> is used as it is, even when it is thinner than minTraceWidth, and no error is reported. <board> also takes fabricatorPreset, such as "jlcpcb_standard". In the version this page was built with, it adds the layer stackup of that service to the circuit JSON and leaves the checks as they are.',
    fabTip: 'Thicker copper needs wider traces and gaps. So do the inner layers of some services. Read the limits for the exact service you will order, not only for the factory.',
    confusedWith: [
      { id: 'drc', diff: 'The rules are the limits you set. The design rule check is the test that finds where the board breaks them.' },
      { id: 'clearance', diff: 'Clearance is one of the design rules. The design rules are the whole list.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          p.trace([[16, 22], [76, 22]], { w: 3 }).trace([[16, 31], [76, 31]], { w: 3 });
          p.dim([84, 20.5], [84, 23.5], '');
          p.dim([56, 23.5], [56, 29.5], '');
          p.via(36, 60, { d: 22, hole: 9 });
          p.dim([31.5, 60], [40.5, 60], '');
          p.dim([25, 60], [47, 60], '', { off: 15 });
          p.trace([[62, 88], [104, 88]], { w: 3 });
          p.dim([80, 89.5], [80, 96], '');
          p.silkText(78, 62, 'R12', { size: 10 });
          p.dim([94, 55], [94, 62], '');
          tag(p, 90, 22, 1);
          tag(p, 62, 26.5, 2);
          tag(p, 36, 54.5, 3);
          tag(p, 36, 79.5, 4);
          tag(p, 86, 92.7, 5);
          tag(p, 100, 58.5, 6);
          ['1  trace width', '2  clearance', '3  via hole', '4  via copper', '5  copper to edge', '6  text height'].forEach((text, i) => p.label(LX, 26 + i * 10, text));
          p.caption('Each rule is one small distance');
        },
      },
    ],
  },

  {
    id: 'short-open',
    name: 'Short circuit and open circuit',
    category: 'checks',
    aka: ['short', 'open', 'unrouted', 'missing connection', 'bridge', 'broken trace'],
    keywords: 'touch connected by mistake not connected unrouted missing trace net error accidental',
    summary: 'Two nets that touch by mistake, and a connection that was never made.',
    definition: 'A short circuit is copper that joins two nets that should be separate. An open circuit is the opposite: two pins that should be joined, with no copper between them. Both are found by comparing the copper on the board with the list of nets. A short between power and ground can burn a trace or a part. An open usually just means the board does nothing. Neither should ever reach the factory, because both are found by a check that takes a second.',
    say: [
      { for: 'Check for both', text: 'Build the board and tell me how many shorts and how many unrouted connections it has. I expect zero of each.' },
      { for: 'Find the cause', text: 'There is a short between {V3_3} and {GND}. Find the exact place where the two touch and show me the coordinates.' },
      { for: 'Finish the routing', text: '{2} connections are still open. Route them, or tell me why they cannot be routed.' },
    ],
    code: `export default () => (
  <board width="20mm" height="14mm">
    <resistor name="R1" resistance="1k" footprint="0603" pcbX={-6} pcbY={0} />
    <resistor name="R2" resistance="1k" footprint="0603" pcbX={6} pcbY={0} />
    <resistor name="R3" resistance="1k" footprint="0603" pcbX={0} pcbY={-4} pcbRotation={90} />
    <resistor name="R4" resistance="1k" footprint="0603" pcbX={0} pcbY={4} pcbRotation={90} />
    <trace from="R1.pin2" to="R2.pin1" pcbStraightLine />
    <trace from="R3.pin2" to="R4.pin1" pcbStraightLine />
  </board>
)`,
    expectErrors: true,
    cli: `tsci check shorts index.circuit.tsx`,
    codeNote: 'These two traces are forced to be straight lines, so they cross on the same layer. The build reports the short as pcb_trace_error: "PCB trace R1.pin2 to R2.pin1 overlaps with R3.pin2 to R4.pin1 (accidental contact)". An open is reported as pcb_trace_missing_error: "Trace [R1.pin2 to R2.pin1] is not connected (it has no PCB trace)". The autorouter does not make shorts by itself. They come from routes fixed by hand, and from parts placed on top of each other.',
    fabTip: 'Factories test bare boards for shorts and opens, but only against your own files. If the files say two nets are joined, the factory will make them joined.',
    confusedWith: [
      { id: 'solder-bridge', diff: 'A short circuit is in the design: the copper itself is wrong. A solder bridge happens during assembly, on a board that was designed correctly.' },
      { id: 'ratsnest', diff: 'An open circuit is a connection that is missing from the finished board. The ratsnest shows the connections that are still to be routed while you work.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          p.trace([[16, 24], [104, 24]], { w: 2.6 }).trace([[16, 36], [104, 36]], { w: 2.6 });
          p.rect(57, 24, 4, 12, 'f-bad');
          p.label(22, 20.5, 'V3_3', { size: 3.6, cls: 'lbl-on' });
          p.label(22, 43, 'GND', { size: 3.6, cls: 'lbl-on' });
          p.ring(59, 30, 9.5);
          p.trace([[22, 74], [50, 74]], { w: 2.6 }).trace([[72, 74], [100, 74]], { w: 2.6 });
          p.pad(22, 74, 6, 7).pad(100, 74, 6, 7);
          p.line([[50, 74], [72, 74]], 'rats');
          p.ring(61, 74, 9.5);
          p.leader(LX, 26, 66, 26, 'short: copper joins');
          p.label(LX, 31.5, 'two nets');
          p.leader(LX, 68, 69, 70.5, 'open: a piece of');
          p.label(LX, 73.5, 'the path is missing');
          p.caption('Two faults a check must find');
        },
      },
    ],
  },

  {
    id: 'solder-bridge',
    name: 'Solder bridge and mask dam',
    category: 'checks',
    aka: ['bridging', 'solder short', 'mask web', 'solder mask sliver', 'mask bridge'],
    keywords: 'solder joins pins short fine pitch mask between pads dam web sliver gang opening assembly',
    summary: 'Solder that joins two neighbouring pins, and the strip of mask that prevents it.',
    definition: 'A solder bridge is a blob of solder that joins two pins which should be separate. It happens during soldering, mostly on chips whose pins are close together. A mask dam is the thin strip of solder mask between two neighbouring pads. Solder does not stick to mask, so the dam keeps the solder of each pad on its own pad. When pads are too close, the strip becomes too thin to make, the factory leaves it out, and bridges become likely.',
    say: [
      { for: 'Keep the dams', text: 'Keep a strip of solder mask between every pair of neighbouring pads. Tell me where the gap is too small for one.' },
      { for: 'Choose the part', text: 'Do not use a pitch below {0.5 mm} on this board, so that mask fits between the pads.' },
      { for: 'Vias and pads', text: 'Keep vias at least {0.3 mm} away from pads and cover them with mask, so they cannot pull solder across.' },
    ],
    fabTip: 'A mask dam usually needs to be about 0.1 mm wide, and the mask opening is a little larger than the pad on each side. So the copper gap between two pads must be about 0.2 mm or more for a dam to fit. The number depends on the factory and even on the colour of the mask: check it.',
    note: 'A bridge is repaired by dragging a clean, hot iron tip along the pins, with flux. It is much easier to prevent one than to find one under a chip with no legs.',
    confusedWith: [
      { id: 'short-open', diff: 'A solder bridge is made in assembly, by solder. A short circuit is drawn into the design, in copper.' },
      { id: 'solder-mask', diff: 'Solder mask is the coating on the whole board. A mask dam is the narrow piece of it that is left between two pads.' },
      { id: 'tombstoning', diff: 'A bridge joins two pins that should be apart. Tombstoning lifts one end of a part off its pad.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          const xs = [26, 40, 54, 68, 82];
          for (const x of xs) p.rect(x - 5.2, 19, 10.4, 24, 'f-shade', { r: 0.8 });
          for (const x of xs) p.pad(x, 31, 7, 20);
          p.rect(18.8, 61, 70.4, 24, 'f-shade', { r: 0.8 });
          for (const x of xs) p.pad(x, 73, 7, 20);
          p.rect(42, 66.5, 24, 13, 'f-solder s-soft', { r: 6, sw: 0.3 });
          p.badge(98, 31, 'ok').badge(98, 73, 'no');
          p.leader(LX, 24, 61, 25, 'mask dam: mask');
          p.label(LX, 29.5, 'between two pads');
          p.leader(LX, 58, 75, 64, 'no dam: one big');
          p.label(LX, 63.5, 'opening in the mask');
          p.leader(LX, 80, 63, 76, 'solder bridge');
          p.caption('Mask between pads keeps solder apart');
        },
      },
    ],
  },

  {
    id: 'tombstoning',
    name: 'Tombstoning',
    category: 'checks',
    aka: ['tombstone', 'Manhattan effect', 'drawbridging', 'lifted part'],
    keywords: 'part stands up lifted one end reflow uneven heat small resistor capacitor 0402 pad copper',
    summary: 'A small part that stands up on one end after soldering.',
    definition: 'Tombstoning is a soldering fault of small two-pad parts. In the oven, the solder on one pad melts a moment before the other. Liquid solder pulls, so it drags the part upright onto that pad, and the other end is left in the air. The cause is almost always uneven heat: one pad is joined to a lot of copper, which heats slowly, and the other to a thin trace, which heats fast. Parts of size 0402 and smaller are the most likely to do it.',
    say: [
      { for: 'Balance the pads', text: 'For every {0402 and 0603} part, give both pads the same amount of copper: traces of the same width on each side.' },
      { for: 'Pads in a pour', text: 'Where a pad of a small part sits in a copper pour, connect it with a thermal relief, not with solid copper.' },
      { for: 'Find the risks', text: 'List every small part that has one pad in a pour or on a wide trace and the other on a thin trace.' },
    ],
    fabTip: 'Use the pad sizes that the footprint recommends. Pads that are too long give the solder more leverage to lift the part.',
    confusedWith: [
      { id: 'thermal-relief', diff: 'Tombstoning is the fault. A thermal relief is one way to prevent it: it stops a big copper area from keeping one pad cold.' },
      { id: 'solder-bridge', diff: 'Tombstoning leaves a pin with no connection. A solder bridge makes a connection that should not exist.' },
    ],
    pictures: [
      {
        label: 'Side view',
        draw(p) {
          p.rect(10, 70, 140, 16, 'f-fr4 s-soft');
          // a part that soldered flat
          p.rect(20, 67, 13, 3, 'f-pad').rect(47, 67, 13, 3, 'f-pad');
          p.area([[21, 67], [27, 67], [27, 60]], 'f-solder').area([[59, 67], [53, 67], [53, 60]], 'f-solder');
          p.rect(27, 58, 26, 9, 'f-body s-soft', { sw: 0.3 });
          p.rect(27, 58, 5.5, 9, 'f-lead').rect(47.5, 58, 5.5, 9, 'f-lead');
          // a part pulled upright onto its left pad
          p.rect(88, 67, 14, 3, 'f-pad').rect(116, 67, 12, 3, 'f-pad').rect(128, 67, 22, 3, 'f-cu');
          p.rect(117.5, 64.8, 9, 2.2, 'f-paste', { r: 0.8 });
          const at = (along, across) => [100 + along * 0.342 - across * 0.94, 67 - along * 0.94 - across * 0.342];
          p.area([[89.5, 67], [101, 67], [93, 61]], 'f-solder');
          p.area([at(0, 0), at(26, 0), at(26, 9), at(0, 9)], 'f-body s-soft', { sw: 0.3 });
          p.area([at(0, 0), at(5.5, 0), at(5.5, 9), at(0, 9)], 'f-lead');
          p.area([at(20.5, 0), at(26, 0), at(26, 9), at(20.5, 9)], 'f-lead');
          p.badge(40, 46, 'ok').badge(118, 46, 'no');
          p.leader(40, 100, 40, 69, 'both ends melted together', { anchor: 'middle', size: 3.8 });
          p.leader(84, 30, 90.5, 65, 'melted first', { anchor: 'middle' });
          p.label(84, 24.5, 'this pad', { anchor: 'middle' });
          p.leader(134, 98, 138, 69.5, 'wide copper:', { anchor: 'middle' });
          p.label(134, 103.5, 'still cold', { anchor: 'middle' });
          p.caption('One end melts first and pulls the part up');
        },
      },
    ],
  },

  {
    id: 'circuit-json',
    name: 'Circuit JSON',
    category: 'checks',
    aka: ['circuit.json', 'build output', 'soup'],
    keywords: 'file output build list elements errors positions read agent machine data export format',
    summary: 'The file tscircuit builds from your code: a list of every part, pad, trace and error.',
    definition: 'Circuit JSON is what tscircuit produces when it builds your code. It is one long list. Each item describes one thing: a part and its value, where that part sits on the board, a pad, a trace with every corner of its path, a via, the board itself. Every problem the checks find is an item in the same list. All the other outputs are made from this file: the PCB view, the schematic and the Gerber files. It matters to an agent for a simple reason: an agent cannot see the picture, but it can read this list and work with exact numbers.',
    say: [
      { for: 'Read the errors', text: 'Build the board and read the circuit JSON. List every item whose type ends in _error, with its message.' },
      { for: 'Measure, do not guess', text: 'From the circuit JSON, give me a table of every part with its centre, its rotation and its layer.' },
      { for: 'Check the routing', text: 'From the circuit JSON, list every pcb_trace with its layer, its width and its number of vias.' },
      { for: 'Prove a change', text: 'After moving {C1}, show me its old and new position from the circuit JSON.' },
    ],
    table: {
      caption: 'Some of the items in the list',
      columns: ['Type', 'What it describes'],
      rows: [
        ['source_component', 'A part: its name and its value'],
        ['pcb_component', 'Where that part is on the board: centre and layer'],
        ['pcb_smtpad, pcb_plated_hole', 'One pad or one plated hole, with its position and size'],
        ['pcb_trace', 'One trace: every point of its route, with width and layer'],
        ['pcb_via', 'One via: position, hole and copper diameter, layers'],
        ['pcb_board', 'The board: size, thickness, number of layers'],
        ['anything ending in _error', 'A problem that a check found, with a message'],
      ],
      note: 'There are also items ending in _warning. They do not stop a build, but read them: a pin with no trace is reported that way.',
    },
    cli: `# build: writes dist/index/circuit.json, and dist/index/errors.json if there are errors
tsci build index.circuit.tsx

# or write the circuit JSON to a file you name
tsci export index.circuit.tsx -f circuit-json -o board.circuit.json`,
    note: 'The file is large, even for a small board. Ask the agent to search it for what it needs, such as all the errors or one part, and not to read it from top to bottom.',
    confusedWith: [
      { id: 'gerber', diff: 'Circuit JSON is for you and the agent: it knows parts, nets and errors. Gerber files are for the factory: they hold only shapes to be made in copper, mask and ink.' },
      { id: 'drc', diff: 'The design rule check finds the problems. Circuit JSON is where they are written down.' },
    ],
    pictures: [
      {
        label: 'What it is for',
        draw(p) {
          box(p, 8, 38, 34, 30);
          for (const [x, w, y] of [[13, 16, 45], [17, 20, 50], [17, 14, 55], [13, 10, 60]]) p.line([[x, y], [x + w, y]], 's-soft', { w: 0.9 });
          box(p, 58, 30, 40, 46);
          for (let i = 0; i < 6; i++) p.line([[64, 38 + i * 6], [64 + [26, 20, 28, 22, 26, 16][i], 38 + i * 6]], i === 4 ? 's-bad' : 's-soft', { w: 0.9 });
          const outs = [16, 42, 68, 94];
          for (const y of outs) box(p, 116, y - 8, 22, 16);
          p.rect(120, 11.5, 14, 9, 'brd', { r: 1 });
          p.line([[123, 14], [127, 14], [130, 17.5]], 'cu', { w: 0.9 });
          p.line([[119, 42], [122, 42], [123.5, 39], [126, 45], [128.5, 39], [131, 45], [132, 42], [135, 42]], 's-ink', { w: 0.5 });
          for (const d of [0, 2.5, 5]) p.rect(120 + d, 63 + d - 1, 11, 6, 'f-stage s-ink', { sw: 0.4 });
          p.line([[123, 90], [131, 98]], 's-bad', { w: 1.1 }).line([[131, 90], [123, 98]], 's-bad', { w: 1.1 });
          p.arrow([42, 53], [57, 53]);
          for (const y of outs) p.arrow([98, 53], [115, y]);
          p.label(25, 75, 'your code', { anchor: 'middle', size: 4 });
          p.label(78, 83, 'circuit JSON', { anchor: 'middle', size: 4 });
          p.label(78, 88.5, 'one list of everything', { anchor: 'middle', size: 3.4 });
          ['PCB view', 'schematic', 'Gerbers', 'errors'].forEach((text, i) => p.label(141, outs[i] + 1.4, text, { size: 3.8 }));
          p.caption('Everything is made from one file');
        },
      },
    ],
  },
];
