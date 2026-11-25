// Routing: traces, vias and the rules they follow.

const B = [8, 10, 104, 86]; // the usual board, leaving room for labels on the right
const LX = 117; // where those labels start

export default [
  {
    id: 'trace',
    name: 'Trace',
    category: 'routing',
    aka: ['track', 'copper track', 'route'],
    keywords: 'wire line copper strip connection path conductor',
    summary: 'A flat strip of copper that carries a signal from one pad to another.',
    definition: 'A trace is a flat strip of copper on the board. It does the job of a wire: it carries current from one pad to another. A trace is drawn as straight pieces joined by 45° bends. It has a width, it lies on one layer, and it belongs to one net.',
    say: [
      { for: 'The basic ask', text: 'Connect {R1 pin 2} to {the anode of LED1} with a trace on the {top} layer.' },
      { for: 'Keep it short', text: 'Keep the trace from {C1} to {U1.VDD} shorter than {3 mm}.' },
      { for: 'Keep it on one side', text: 'Route {SDA and SCL} on the top layer only, with no vias.' },
      { for: 'Ask what was drawn', text: 'List every trace with its net, its layer, its width and its length.' },
    ],
    code: `export default () => (
  <board width="24mm" height="12mm">
    <resistor name="R1" resistance="1k" footprint="0603" pcbX={-7} pcbY={2} />
    <led name="LED1" color="red" footprint="0603" pcbX={7} pcbY={-2} />
    <trace from="R1.pin2" to="LED1.anode" />
  </board>
)`,
    codeNote: 'A <trace> only says which two pins must be joined. The autorouter chooses the path. Without a width, a trace is 0.15 mm wide.',
    fabTip: 'Most factories can make traces down to about 0.1 mm, but thin traces cost more and break more easily. Use 0.2 mm or wider wherever there is room.',
    confusedWith: [
      { id: 'net', diff: 'A net is the idea that some pins are connected. A trace is the copper that makes it true. One net is often made of several traces.' },
      { id: 'copper-pour', diff: 'A trace is a narrow path between two points. A pour is a wide area of copper that fills the free space.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          p.trace([[35.74, 34], [50, 34], [80, 64], [86.26, 64]]);
          p.chip(32, 34);
          p.chip(90, 64, { kind: 'led' });
          p.silkText(32, 27.5, 'R1', { size: 3.6 });
          p.silkText(90, 57.5, 'LED1', { size: 3.6 });
          p.leader(LX, 30, 50, 34, '45° bend');
          p.leader(LX, 46, 66, 50, 'trace');
          p.leader(LX, 62, 93.8, 63, 'pad');
          p.caption('A trace joins two pads');
        },
      },
      {
        label: 'Cut through',
        draw(p) {
          p.rect(20, 62, 120, 26, 'f-fr4 s-soft');
          p.rect(64, 54, 32, 8, 'f-cu');
          p.area([[20, 62], [20, 58], [60, 58], [60, 50], [100, 50], [100, 58], [140, 58], [140, 62], [96, 62], [96, 54], [64, 54], [64, 62]], 'f-mask');
          p.dim([64, 50], [96, 50], 'width', { off: 8, side: -1 });
          p.leader(50, 30, 61, 52, 'solder mask', { anchor: 'end' });
          p.leader(108, 30, 92, 57, 'copper, about 0.035 mm');
          p.label(80, 77, 'board (FR-4)', { anchor: 'middle', cls: 'lbl-dark' });
          p.caption('Cut across a trace. Not to scale');
        },
      },
    ],
  },

  {
    id: 'trace-width',
    name: 'Trace width',
    category: 'routing',
    aka: ['track width', 'trace thickness', 'neck-down'],
    keywords: 'wide thin narrow current amps power heat thick mm mil',
    summary: 'How wide the copper strip is. Wider traces carry more current.',
    definition: 'Trace width is the width of the copper strip, seen from above. A wider trace has less resistance, so it carries more current and heats up less. Signals need only a thin trace. Power needs a wide one. A neck-down is a short narrow piece of a wide trace, used only where it must squeeze into a small pin.',
    say: [
      { for: 'One trace', text: 'Make the trace from {J1.VBUS} to {U1.VIN} {0.8 mm} wide.' },
      { for: 'By current', text: 'The {5 V} net carries up to {2 A}. Choose a trace width for that and tell me the number.' },
      { for: 'A default for the board', text: 'Use {0.25 mm} traces for signals and {0.5 mm} for every power and ground trace.' },
      { for: 'Neck-down', text: 'Keep the {VIN} trace {1 mm} wide, and narrow it only for the last {2 mm} into the pin of {U1}.' },
    ],
    table: {
      caption: 'Width and current, for outer layers',
      columns: ['Width', 'Current, about', 'Typical use'],
      rows: [
        ['0.15 mm', '0.6 A', 'Signals on a crowded board'],
        ['0.25 mm', '0.9 A', 'Signals, the comfortable default'],
        ['0.5 mm', '1.4 A', 'Power to one chip'],
        ['1.0 mm', '2.4 A', 'Power input, motors, LEDs'],
        ['2.0 mm', '4.0 A', 'Battery and motor current'],
      ],
      note: 'For ordinary copper (1 oz, 0.035 mm thick) and a 10 °C rise in temperature, from the IPC-2221 formula. Traces on inner layers carry about half as much.',
    },
    code: `export default () => (
  <board width="24mm" height="14mm">
    <resistor name="R1" resistance="1k" footprint="0805" pcbX={-7} pcbY={3} />
    <resistor name="R2" resistance="1k" footprint="0805" pcbX={7} pcbY={3} />
    <resistor name="R3" resistance="1k" footprint="0805" pcbX={-7} pcbY={-3} />
    <resistor name="R4" resistance="1k" footprint="0805" pcbX={7} pcbY={-3} />
    <trace from="R1.pin2" to="R2.pin1" />
    <trace from="R3.pin2" to="R4.pin1" thickness="0.8mm" />
  </board>
)`,
    codeNote: 'On a <trace>, thickness is the width seen from above, and width means the same. To set it for a whole net use <net name="VIN" nominalTraceWidth="0.5mm" />. To set it for the whole board use nominalTraceWidth on <board>.',
    fabTip: 'If a wide trace does not fit, use a short neck-down, a copper pour, or thicker copper (2 oz). Do not make a long trace thinner than the current needs.',
    confusedWith: [
      { id: 'clearance', diff: 'Width is the size of the copper. Clearance is the size of the gap beside it.' },
      { id: 'copper-weight', diff: 'Width is measured across the board, and you choose it for each trace. Copper weight is how thick the copper layer is, and it is the same for the whole board.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          p.trace([[22, 26], [98, 26]], { w: 1.3 });
          p.pad(22, 26, 5, 5).pad(98, 26, 5, 5);
          p.trace([[22, 50], [98, 50]], { w: 5 });
          p.pad(22, 50, 6, 8).pad(98, 50, 6, 8);
          p.trace([[22, 76], [78, 76]], { w: 5 });
          p.trace([[78, 76], [97, 76]], { w: 1.3 });
          p.pad(22, 76, 6, 8);
          for (const y of [71.6, 76, 80.4]) p.pad(98, y, 7, 2.6, { r: 0.5 });
          p.leader(LX, 22, 62, 26, '0.2 mm: a signal');
          p.leader(LX, 46, 62, 49, '1 mm: about 2.4 A');
          p.leader(LX, 70, 86, 76, 'neck-down: narrow');
          p.label(LX, 75.5, 'only at the pin');
          p.caption('Wider copper carries more current');
        },
      },
    ],
  },

  {
    id: 'via',
    name: 'Via',
    category: 'routing',
    aka: ['plated via', 'through via', 'layer change'],
    keywords: 'hole layer change top bottom connect drill plated barrel jump cross',
    summary: 'A small plated hole that carries a trace from one layer to another.',
    definition: 'A via is a small hole through the board with copper plated on its wall. It joins a trace on one layer to a trace on another layer. A via is how one trace crosses another: it dives to the other side, passes underneath, and comes back up. A via is given as two numbers, the copper diameter and the hole diameter, such as 0.6 / 0.3 mm.',
    say: [
      { for: 'Change layer', text: 'Take the {SCK} trace to the bottom layer with a via next to {U1}, and bring it back up beside {J2}.' },
      { for: 'Set the size', text: 'Use {0.6 mm} vias with a {0.3 mm} hole everywhere on this board.' },
      { for: 'Tie to ground', text: 'Put a via to the ground plane right next to the ground pad of {C3}.' },
      { for: 'Limit them', text: 'Route {USB_DP and USB_DM} with no vias at all.' },
    ],
    code: `export default () => (
  <board
    width="24mm"
    height="14mm"
    pcbStyle={{ viaPadDiameter: "0.6mm", viaHoleDiameter: "0.3mm" }}
  >
    <resistor name="R1" resistance="1k" footprint="0603" pcbX={-8} pcbY={3} />
    <resistor name="R2" resistance="1k" footprint="0603" pcbX={8} pcbY={3} />
    <resistor name="R3" resistance="1k" footprint="0603" pcbX={-8} pcbY={-3} />
    <resistor name="R4" resistance="1k" footprint="0603" pcbX={8} pcbY={-3} />
    <trace from="R1.pin2" to="R4.pin1" />
    <trace from="R3.pin2" to="R2.pin1" />
  </board>
)`,
    codeNote: 'These two traces cross, so the autorouter sends one of them under the other through two vias. It adds vias by itself. pcbStyle on <board> sets their size: without it they are only 0.3 / 0.2 mm. To place a via yourself, add <via pcbX={0} pcbY={3} fromLayer="top" toLayer="bottom" holeDiameter="0.3mm" outerDiameter="0.6mm" connectsTo="net.GND" />. To cap how many a trace may use, set maxViaCount on the <trace>.',
    fabTip: 'A 0.6 / 0.3 mm via is cheap at every factory. Smaller than 0.45 / 0.2 mm usually costs extra. Each via adds a little resistance and a possible point of failure, so use the ones you need and no more.',
    confusedWith: [
      { id: 'through-hole', diff: 'A via only joins layers, and nothing is soldered into it. A plated through hole is bigger and holds the leg of a part.' },
      { id: 'mounting-hole', diff: 'A via is tiny and plated, and it is part of a net. A mounting hole is large, usually without copper, and holds a screw.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          p.trace([[40, 53], [80, 53]], { layer: 'bottom' });
          p.trace([[60, 18], [60, 88]]);
          p.trace([[20, 53], [40, 53]]).trace([[80, 53], [100, 53]]);
          p.via(40, 53).via(80, 53);
          p.pad(20, 53, 5, 6).pad(100, 53, 5, 6);
          p.leader(LX, 28, 60, 30, 'another trace');
          p.leader(LX, 46, 81.5, 51.5, 'via');
          p.leader(LX, 64, 92, 54, 'on the top layer');
          p.leader(40, 104, 50, 54.4, 'on the bottom layer', { anchor: 'middle' });
          p.caption('A via lets one trace pass under another');
        },
      },
      {
        label: 'Cut through',
        draw(p) {
          p.rect(16, 44, 128, 30, 'f-fr4 s-soft');
          p.rect(16, 39, 54, 5, 'f-cu');
          p.rect(90, 74, 54, 5, 'f-cub');
          p.rect(68, 39, 24, 5, 'f-pad').rect(68, 74, 24, 5, 'f-pad').rect(74, 39, 12, 40, 'f-pad');
          p.rect(76, 38.6, 8, 40.8, 'f-stage');
          p.dim([76, 39], [84, 39], 'hole: 0.3 mm', { off: 9, side: -1 });
          p.dim([68, 79], [92, 79], 'copper: 0.6 mm', { off: 8 });
          p.leader(36, 30, 36, 40.5, 'trace on top', { anchor: 'middle' });
          p.leader(124, 94, 124, 77.5, 'trace on the bottom', { anchor: 'middle' });
          p.leader(116, 60, 85.2, 58, 'plated wall', { size: 4, cls: 'lbl-dark' });
          p.caption('Cut through a via. Not to scale');
        },
      },
    ],
  },

  {
    id: 'via-types',
    name: 'Through, blind and buried vias',
    category: 'routing',
    aka: ['blind via', 'buried via', 'microvia', 'HDI'],
    keywords: 'layers inner outer laser drill multilayer four layer six layer',
    summary: 'Vias that go through every layer, or only through some of them.',
    definition: 'A through via goes through the whole board and can join any of its layers. A blind via starts on an outer layer and stops at an inner layer. A buried via joins inner layers only and cannot be seen from outside. A microvia is a very small blind via made with a laser, usually one layer deep. Blind, buried and micro vias save space on crowded boards, but they cost much more.',
    say: [
      { for: 'Keep it cheap', text: 'Use through vias only. No blind or buried vias.' },
      { for: 'Allow them', text: 'This is a {6}-layer board and the factory can make blind vias from the top layer to inner layer 1. You may use them under {U1}.' },
      { for: 'Ask first', text: 'If the board cannot be routed with through vias only, stop and tell me. Do not add blind vias by yourself.' },
    ],
    table: {
      caption: 'The four kinds of via',
      columns: ['Kind', 'Joins', 'Cost'],
      rows: [
        ['Through', 'Any layers, top to bottom', 'Standard'],
        ['Blind', 'An outer layer to an inner layer', 'High'],
        ['Buried', 'Inner layers only', 'High'],
        ['Micro', 'Two layers next to each other', 'Highest'],
      ],
    },
    code: `export default () => (
  <board width="20mm" height="12mm" layers={4} allowBlindAndBuriedVias>
    <resistor name="R1" resistance="1k" footprint="0603" pcbX={-7} pcbY={0} />
    <resistor name="R2" resistance="1k" footprint="0603" pcbX={7} pcbY={0} />
    <via pcbX={0} pcbY={3} fromLayer="top" toLayer="inner1" holeDiameter="0.2mm" outerDiameter="0.45mm" />
    <trace from="R1.pin2" to="R2.pin1" />
  </board>
)`,
    render: false,
    codeNote: 'The copper layers of a four-layer board are named top, inner1, inner2 and bottom. The autorouter makes only through vias unless <board> has allowBlindAndBuriedVias.',
    fabTip: 'Ask the factory before you use anything but through vias. Many low-cost services do not offer blind or buried vias at all.',
    confusedWith: [
      { id: 'tented-via', diff: 'Through, blind and buried say which layers a via joins. Tented and exposed say whether solder mask covers it.' },
    ],
    pictures: [
      {
        label: 'Cut through',
        draw(p) {
          const layers = [24, 43, 62, 81]; // the top of each copper layer, 4 thick
          p.rect(26, 28, 126, 53, 'f-fr4');
          p.rect(26, 28, 126, 15, 'f-pp').rect(26, 66, 126, 15, 'f-pp');
          p.rect(26, 28, 126, 53, 'f-none s-soft');
          // traces on each layer
          p.rect(26, 24, 10, 4, 'f-cu').rect(52, 24, 16, 4, 'f-cu').rect(144, 24, 8, 4, 'f-cu');
          p.rect(84, 43, 14, 4, 'f-cui').rect(114, 43, 14, 4, 'f-cui');
          p.rect(114, 62, 38, 4, 'f-cui');
          p.rect(52, 81, 60, 4, 'f-cub');
          const pads = (x, rows) => { for (const row of rows) p.rect(x - 8, layers[row], 16, 4, 'f-pad s-pad', { sw: 0.25 }); };
          const barrel = (x, from, to) => p.rect(x - 4, layers[from], 8, layers[to] + 4 - layers[from], 'f-pad s-pad', { sw: 0.25 });
          // through: all four layers
          pads(44, [0, 1, 2, 3]);
          barrel(44, 0, 3).rect(42, 23.6, 4, 61.8, 'f-stage');
          // blind: top to inner 1
          pads(76, [0, 1]);
          barrel(76, 0, 1).rect(74, 23.6, 4, 19.4, 'f-stage');
          // buried: inner 1 to inner 2
          pads(106, [1, 2]);
          barrel(106, 1, 2).rect(104, 47, 4, 15, 'f-pp');
          // micro: top to inner 1, made by a laser
          pads(136, [0, 1]);
          p.area([[131.5, 24], [140.5, 24], [138.5, 43], [133.5, 43]], 'f-pad s-pad', { sw: 0.25 });
          p.area([[133.6, 23.6], [138.4, 23.6], [137, 40], [135, 40]], 'f-stage');
          ['top', 'inner 1', 'inner 2', 'bottom'].forEach((name, i) => p.label(23, layers[i] + 3.6, name, { anchor: 'end', size: 3.8 }));
          [[44, 'through'], [76, 'blind'], [106, 'buried'], [136, 'micro']].forEach(([x, name]) => p.label(x, 95, name, { anchor: 'middle' }));
          p.caption('Four kinds of via in a four-layer board');
        },
      },
    ],
  },

  {
    id: 'tented-via',
    name: 'Tented via',
    category: 'routing',
    aka: ['via tenting', 'covered via', 'exposed via', 'via-in-pad'],
    keywords: 'solder mask cover open plug short bridge under component',
    summary: 'A via that is covered by solder mask, so solder cannot stick to it.',
    definition: 'A tented via is covered by solder mask, like a tent over the hole. Solder cannot stick to it, and it cannot touch a metal part that sits on top of it. An exposed via has a bare copper ring. Most vias should be tented. A via is left exposed only when it is used as a test point, or to let heat out.',
    say: [
      { for: 'The default', text: 'Tent every via on both sides.' },
      { for: 'One exception', text: 'Tent all vias, but leave the vias under {U3} exposed so heat can leave through them.' },
      { for: 'Close to a pad', text: 'Keep every via at least {0.3 mm} away from any pad, and tent it, so solder is not pulled into the hole.' },
    ],
    code: `export default () => (
  <board width="20mm" height="12mm">
    <via pcbX={-4} pcbY={0} fromLayer="top" toLayer="bottom" holeDiameter="0.3mm" outerDiameter="0.6mm" tented />
    <via pcbX={4} pcbY={0} fromLayer="top" toLayer="bottom" holeDiameter="0.3mm" outerDiameter="0.6mm" tented={false} />
  </board>
)`,
    render: false,
    codeNote: 'tented on a <via> covers it on both sides. It also accepts "top_tented", "bottom_tented" and "exposed". To choose once for the whole board, set defaultViaTenting on <board>.',
    fabTip: 'A via placed inside a pad (via-in-pad) pulls the solder down its hole unless the factory fills and caps it, which costs extra. Put the via beside the pad and tent it.',
    confusedWith: [
      { id: 'solder-mask', diff: 'Solder mask is the coating over the whole board. Tenting is the choice to let it cover a via as well.' },
    ],
    pictures: [
      {
        label: 'Cut through',
        draw(p) {
          p.rect(14, 50, 132, 26, 'f-fr4 s-soft');
          for (const x of [48, 112]) {
            p.rect(x - 10, 46, 20, 4, 'f-pad').rect(x - 10, 76, 20, 4, 'f-pad').rect(x - 4, 46, 8, 34, 'f-pad');
            p.rect(x - 2.5, 45.6, 5, 34.8, 'f-stage');
          }
          // mask over the left via, on both sides
          p.area([[14, 50], [14, 46], [36, 46], [36, 42], [60, 42], [60, 46], [80, 46], [80, 50], [58, 50], [58, 46], [38, 46], [38, 50]], 'f-mask');
          p.area([[14, 76], [14, 80], [36, 80], [36, 84], [60, 84], [60, 80], [80, 80], [80, 76], [58, 76], [58, 80], [38, 80], [38, 76]], 'f-mask');
          // mask that stops short of the right via
          for (const y of [46, 76]) p.rect(80, y, 19, 4, 'f-mask').rect(125, y, 21, 4, 'f-mask');
          p.leader(48, 30, 48, 42.5, 'mask covers the via', { anchor: 'middle' });
          p.leader(112, 30, 105, 46, 'bare copper ring', { anchor: 'middle' });
          p.label(48, 96, 'tented', { anchor: 'middle' });
          p.label(112, 96, 'exposed', { anchor: 'middle' });
          p.caption('Tenting hides a via under solder mask');
        },
      },
    ],
  },

  {
    id: 'clearance',
    name: 'Clearance',
    category: 'routing',
    aka: ['spacing', 'gap', 'trace spacing', 'isolation'],
    keywords: 'distance between copper trace pad via edge minimum short voltage',
    summary: 'The gap that must stay free between two pieces of copper.',
    definition: 'Clearance is the smallest gap allowed between two pieces of copper that belong to different nets. It is measured from edge to edge. There is one number for each pair of things: trace to trace, trace to pad, trace to via, and copper to the edge of the board. If the gap is too small, the factory may leave a sliver of copper that joins the two, or a high voltage may jump across.',
    say: [
      { for: 'A rule for the board', text: 'Keep at least {0.2 mm} between any two pieces of copper on different nets.' },
      { for: 'More for one net', text: 'The {VIN} net carries {24 V}. Keep {0.6 mm} between it and everything else.' },
      { for: 'Away from the edge', text: 'Keep all copper at least {0.3 mm} from the edge of the board.' },
      { for: 'Check it', text: 'Run the checks and list every place where the clearance is smaller than the rule.' },
    ],
    code: `export default () => (
  <board width="24mm" height="14mm">
    <net name="VIN" minTraceClearance="0.6mm" nominalTraceWidth="0.5mm" />
    <resistor name="R1" resistance="1k" footprint="0603" pcbX={-8} pcbY={1} />
    <resistor name="R2" resistance="1k" footprint="0603" pcbX={8} pcbY={1} />
    <resistor name="R3" resistance="1k" footprint="0603" pcbX={-8} pcbY={-1} />
    <resistor name="R4" resistance="1k" footprint="0603" pcbX={8} pcbY={-1} />
    <trace from="R1.pin2" to="net.VIN" />
    <trace from="R2.pin1" to="net.VIN" />
    <trace from="R3.pin2" to="R4.pin1" />
  </board>
)`,
    codeNote: 'minTraceClearance on a <net> is the gap that net keeps from every other net. For a gap that applies to every trace, give the autorouter a setting: autorouter={{ traceClearance: "0.2mm" }} on <board>.',
    fabTip: 'A common low-cost limit is about 0.13 mm (5 mil). Design with 0.2 mm, and keep the smaller number for the few places that need it.',
    confusedWith: [
      { id: 'trace-width', diff: 'Clearance is the gap. Width is the copper.' },
      { id: 'pitch', diff: 'Clearance is measured from edge to edge. Pitch is measured from centre to centre.' },
      { id: 'keepout', diff: 'Clearance is a small gap around every piece of copper. A keep-out is a whole area that you close off.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          p.trace([[16, 20], [104, 20]]).trace([[16, 29], [104, 29]]);
          p.trace([[16, 62], [104, 62]]);
          p.pad(40, 50, 9, 9);
          p.via(74, 51.5, { d: 7, hole: 3 });
          p.trace([[16, 87], [104, 87]]);
          p.dim([90, 21.1], [90, 27.9], '');
          p.dim([40, 54.5], [40, 60.9], '');
          p.dim([74, 55], [74, 60.9], '');
          p.dim([60, 88.1], [60, 96], '');
          p.leader(LX, 22, 91, 24.5, 'trace to trace');
          p.leader(LX, 40, 41, 57.5, 'trace to pad');
          p.leader(LX, 58, 75, 58, 'trace to via');
          p.leader(LX, 84, 61, 92, 'copper to edge');
          p.caption('Clearance: the gap between copper');
        },
      },
    ],
  },

  {
    id: 'trace-corner',
    name: 'Trace corners',
    category: 'routing',
    aka: ['45° routing', 'mitred corner', 'acute angle', 'acid trap'],
    keywords: 'bend turn angle 90 degree right angle sharp diagonal',
    summary: 'How a trace turns: with 45° bends, not with sharp angles.',
    definition: 'A trace normally turns a corner in two 45° bends. A right-angle corner works for ordinary signals, but it wastes space and is not the usual style. A corner sharper than 90° is a real fault: etching liquid gets caught in the narrow pocket and can eat the copper away. That pocket is called an acid trap.',
    say: [
      { for: 'The usual rule', text: 'Route with 45° bends only. No right angles and no angles sharper than 90°.' },
      { for: 'Leaving a pad', text: 'Let each trace leave its pad straight, from the middle of the pad edge, before the first bend.' },
      { for: 'Check it', text: 'Look for any place where two traces meet at less than 90° and fix it.' },
    ],
    fabTip: 'Modern factories etch right angles without trouble. The reason to avoid sharp angles is the acid trap, and the reason to use 45° is that traces pack together more tightly.',
    confusedWith: [
      { id: 'teardrop', diff: 'A corner is where a trace changes direction. A teardrop is extra copper where a trace meets a pad or via.' },
    ],
    pictures: [
      {
        label: 'Three corners',
        draw(p) {
          p.board(8, 10, 144, 78);
          p.trace([[16, 76], [46, 76], [24, 38]]);
          p.trace([[62, 76], [94, 76], [94, 38]]);
          p.trace([[108, 76], [128, 76], [142, 62], [142, 38]]);
          p.ring(42.5, 72.5, 5.5);
          p.badge(34, 22, 'no').badge(126, 22, 'ok');
          p.label(34, 96, 'sharp angle', { anchor: 'middle' });
          p.label(34, 101.5, 'copper can etch away', { anchor: 'middle', size: 3.5 });
          p.label(80, 96, 'right angle', { anchor: 'middle' });
          p.label(80, 101.5, 'works, but not usual', { anchor: 'middle', size: 3.5 });
          p.label(126, 96, 'two 45° bends', { anchor: 'middle' });
          p.label(126, 101.5, 'the usual way', { anchor: 'middle', size: 3.5 });
          p.caption('How a trace turns a corner');
        },
      },
    ],
  },

  {
    id: 'autorouter',
    name: 'Autorouter',
    category: 'routing',
    aka: ['auto-routing', 'automatic routing'],
    keywords: 'route automatically algorithm solve connect all traces effort retry failed unrouted',
    summary: 'The program that draws the traces for you, from the list of connections.',
    definition: 'An autorouter is a program that draws the traces. You give it the placed parts, the list of what must be connected, and the rules. It gives back traces and vias that obey the rules. In tscircuit the autorouter runs every time the board is built, so you never draw a trace by hand unless you want to. Its result depends very much on placement: parts that are placed well are easy to route.',
    say: [
      { for: 'Let it run', text: 'Route the board with the autorouter and tell me how many traces it could not finish.' },
      { for: 'When it fails', text: 'The autorouter left {2} traces unrouted. Do not change the rules. Move {C4 and R7} to give it more room and try again.' },
      { for: 'Protect a route', text: 'Keep the route I fixed for {USB_DP and USB_DM}, and let the autorouter do the rest.' },
      { for: 'Try harder', text: 'Run the autorouter again with a higher effort level and compare the number of vias.' },
    ],
    code: `export default () => (
  <board width="24mm" height="16mm" autorouter="auto_local" autorouterEffortLevel="2x">
    <chip name="U1" footprint="soic8" pcbX={0} pcbY={0} />
    <resistor name="R1" resistance="10k" footprint="0603" pcbX={-8} pcbY={4} />
    <capacitor name="C1" capacitance="100nF" footprint="0603" pcbX={-8} pcbY={-4} />
    <led name="LED1" color="green" footprint="0603" pcbX={8} pcbY={0} />
    <trace from="R1.pin2" to="U1.pin1" />
    <trace from="C1.pin2" to="U1.pin4" />
    <trace from="R1.pin1" to="C1.pin1" />
    <trace from="U1.pin7" to="LED1.anode" />
  </board>
)`,
    codeNote: 'autorouter="auto_local" routes on your own computer and "auto_cloud" uses the tscircuit servers. With no autorouter prop, the default router is used. autorouterEffortLevel, from "1x" to "100x", lets it search longer. routingDisabled on <board> skips routing, which is useful while you are still placing parts.',
    note: 'An autorouter can only work with what it is told. It does not know that a crystal must sit next to its chip, or that a capacitor belongs beside a power pin. Say those things as placement, before you route.',
    confusedWith: [
      { id: 'fixed-route', diff: 'The autorouter chooses the path of a trace. A fixed route is a path that you chose, which the autorouter leaves alone.' },
      { id: 'ratsnest', diff: 'The ratsnest shows what still has to be connected. The autorouter is what connects it.' },
    ],
    pictures: [
      {
        label: 'Before',
        draw(p) {
          p.board(...B);
          const pins = p.soic(58, 53);
          const r1 = p.chip(22, 30);
          const c1 = p.chip(22, 76, { kind: 'c' });
          for (const y of [36, 53, 70]) p.pth(98, y, { square: y === 36 });
          const lines = [[r1.b, pins[0]], [c1.b, pins[3]], [r1.a, c1.a], [pins[7], [98, 36]], [pins[6], [98, 53]], [pins[4], [98, 70]]];
          for (const line of lines) p.line(line, 'rats');
          p.leader(LX, 28, 84, 40.6, 'still to connect');
          p.leader(LX, 60, 62, 53, 'parts are placed');
          p.caption('What the autorouter is given');
        },
      },
      {
        label: 'After',
        draw(p) {
          p.board(...B);
          p.trace([[25.74, 30], [32.4, 30], [47.9, 45.5]], { w: 1.6 });
          p.trace([[25.74, 76], [32.4, 76], [47.9, 60.5]], { w: 1.6 });
          p.trace([[18.26, 30], [13.5, 34.76], [13.5, 71.24], [18.26, 76]], { w: 1.6 });
          p.trace([[68.1, 45.5], [78, 45.5], [87.5, 36], [98, 36]], { w: 1.6 });
          p.trace([[68.1, 50.5], [82, 50.5], [84.5, 53], [98, 53]], { w: 1.6 });
          p.trace([[68.1, 60.5], [78, 60.5], [87.5, 70], [98, 70]], { w: 1.6 });
          p.soic(58, 53);
          p.chip(22, 30);
          p.chip(22, 76, { kind: 'c' });
          for (const y of [36, 53, 70]) p.pth(98, y, { square: y === 36 });
          p.leader(LX, 28, 83, 40.5, 'traces it drew');
          p.leader(LX, 60, 40, 53.2, 'rules were obeyed');
          p.caption('What the autorouter gives back');
        },
      },
    ],
  },

  {
    id: 'fixed-route',
    name: 'Fixed route',
    category: 'routing',
    aka: ['manual route', 'pcbPath', 'route by hand', 'waypoints'],
    keywords: 'manual hand path points corner exact pin lock keep protect',
    summary: 'A trace whose path you give yourself, point by point.',
    definition: 'A fixed route is a trace that follows a path you chose. You give the corner points, in order, and the trace goes through them. The autorouter does not move it, and it routes every other trace around it. Use a fixed route for the few traces that matter most, such as an antenna feed, a USB pair or a high-current path.',
    say: [
      { for: 'Give the path', text: 'Route {VBUS} from {J1} to {U1} by hand: go {3 mm right}, then {4 mm up at 45°}, then straight into the pin.' },
      { for: 'Straight line', text: 'Draw the trace from {ANT1} to {U2.RF} as one straight line.' },
      { for: 'Lock it', text: 'Keep the route of {the 5 V trace} exactly as it is now. Route everything else around it.' },
    ],
    code: `export default () => (
  <board width="24mm" height="14mm">
    <resistor name="R1" resistance="1k" footprint="0603" pcbX={-8} pcbY={-3} />
    <resistor name="R2" resistance="1k" footprint="0603" pcbX={8} pcbY={3} />
    <trace
      from="R1.pin2"
      to="R2.pin1"
      thickness="0.3mm"
      pcbPath={[{ x: 4, y: 0 }, { x: 10, y: 6 }]}
    />
  </board>
)`,
    codeNote: 'The points of pcbPath are not measured from the centre of the board. They are measured from the part the trace starts at: here { x: 4, y: 0 } is 4 mm to the right of the centre of R1. For one straight line between the two pins, use pcbStraightLine on the <trace>.',
    note: 'A fixed route is not checked while you write it. Build the board afterwards and read the errors: a hand-made path can run over a pad or too close to the edge.',
    confusedWith: [
      { id: 'autorouter', diff: 'You draw a fixed route. The autorouter draws all the others.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          const path = [[20, 80], [42, 80], [62, 60], [62, 44], [80, 26], [100, 26]];
          p.hole(40, 50, 12);
          p.hole(84, 62, 12);
          p.trace(path, { w: 2.6 });
          p.pad(20, 80, 6, 7).pad(100, 26, 6, 7);
          path.slice(1, -1).forEach(([x, y], i) => {
            p.circle(x, y, 2.5, 'f-white s-ink', { note: true });
            p.label(x, y + 1.25, String(i + 1), { anchor: 'middle', size: 3.4, cls: 'lbl-dark' });
          });
          p.leader(LX, 30, 82.5, 25.5, 'corner points');
          p.label(LX, 35.5, 'that you choose');
          p.leader(LX, 58, 62, 52, 'the trace goes');
          p.label(LX, 63.5, 'through each one');
          p.caption('A route fixed by hand');
        },
      },
    ],
  },

  {
    id: 'fanout',
    name: 'Fanout',
    category: 'routing',
    aka: ['escape routing', 'breakout', 'dog bone'],
    keywords: 'chip pins dense bga qfn spread out vias short stub escape',
    summary: 'Short traces that lead every pin of a dense chip out to open space.',
    definition: 'Fanout is the first step of routing a chip with many pins close together. Each pin gets a short trace that leads away from the chip, often to a via. After that, every signal has a starting point in open space, and the long traces can be routed from there. Without fanout, the first few traces block the pins behind them.',
    say: [
      { for: 'Do it first', text: 'Before routing anything else, fan out every pin of {U1}: a short trace to a via, all pointing away from the chip.' },
      { for: 'Power pins', text: 'Give each power and ground pin of {U1} its own via, as close to the pin as the rules allow.' },
      { for: 'Leave room', text: 'Keep the area {2 mm} around {U1} free of other parts, so its pins can fan out.' },
    ],
    note: 'On a two-layer board, fanout vias lead to the bottom layer. On a four-layer board, power and ground pins drop straight to the inner planes, which leaves the outer layers free for signals.',
    confusedWith: [
      { id: 'via', diff: 'A via is one hole. Fanout is the pattern of short traces and vias around a whole chip.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          const [cx, cy] = [60, 53];
          const pads = p.quad(cx, cy, { body: false });
          const ends = pads.map(([x, y], i) => {
            const side = Math.floor(i / 5);
            const far = 9 + (i % 2) * 6.5;
            const [dx, dy] = [[-1, 0], [0, 1], [1, 0], [0, -1]][side];
            return [x + dx * far, y + dy * far];
          });
          pads.forEach((pad, i) => p.trace([pad, ends[i]], { w: 1.1 }));
          p.quad(cx, cy);
          for (const [x, y] of ends) p.via(x, y, { d: 3.6, hole: 1.5 });
          p.leader(LX, 26, 73, 50, 'chip with many pins');
          p.leader(LX, 44, 80, 53, 'short trace');
          p.leader(LX, 62, 86.5, 59.4, 'via');
          p.label(LX, 67.5, 'to another layer');
          p.caption('Fanout: every pin escapes to a via');
        },
      },
    ],
  },

  {
    id: 'differential-pair',
    name: 'Differential pair',
    category: 'routing',
    aka: ['diff pair', 'paired traces', 'D+ and D−'],
    keywords: 'usb ethernet hdmi can lvds two traces together parallel positive negative noise',
    summary: 'Two traces that carry one signal and must run side by side.',
    definition: 'A differential pair is two traces that carry one signal as a pair: when one goes up, the other goes down. The receiver looks only at the difference between them, so noise that hits both is cancelled. For this to work, the two traces must stay side by side with a constant gap, have the same length, and change layer together. USB, Ethernet, CAN and HDMI all use differential pairs.',
    say: [
      { for: 'Name the pair', text: '{USB_DP and USB_DM} are a differential pair. Route them side by side with a {0.2 mm} gap, on the top layer, with no vias.' },
      { for: 'Match the length', text: 'Keep the two traces of the pair within {0.5 mm} of each other in length.' },
      { for: 'Keep others away', text: 'Keep every other trace at least {0.5 mm} away from the pair.' },
      { for: 'Short and direct', text: 'Place {the USB connector} so the pair to {U1} is shorter than {20 mm}.' },
    ],
    code: `export default () => (
  <board width="30mm" height="16mm">
    <pinheader name="J1" pinCount={2} pitch="2.54mm" pcbX={-11} pcbY={0} pcbRotation={90} />
    <pinheader name="J2" pinCount={2} pitch="2.54mm" pcbX={11} pcbY={3} pcbRotation={90} />
    <trace name="DP" from="J1.pin1" to="J2.pin1" />
    <trace name="DM" from="J1.pin2" to="J2.pin2" />
    <differentialpair
      positiveConnection="DP"
      negativeConnection="DM"
      pcbTraceGap="0.2mm"
      maxLengthSkew="0.5mm"
    />
  </board>
)`,
    codeNote: '<differentialpair> names the two traces and states the rules for them: pcbTraceGap is the gap between the two, maxLengthSkew is how much their lengths may differ. The two sides can also be nets, such as "net.USB_DP". Always look at what was drawn: the rules say what you want, and the picture shows what the router did.',
    fabTip: 'A USB 2.0 pair on a normal two-layer board works well when it is short, even without exact impedance. Faster signals need a four-layer board and a width and gap worked out for its stackup.',
    confusedWith: [
      { id: 'length-matching', diff: 'A differential pair is two traces carrying one signal. Length matching makes any group of traces the same length, pair or not.' },
      { id: 'impedance', diff: 'A pair is a way to route two traces. Impedance is a number that the width and gap of those traces must produce.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          p.trace([[18, 41.5], [44, 41.5], [64, 61.5], [98, 61.5]], { w: 2 });
          p.trace([[18, 46.5], [41.93, 46.5], [61.93, 66.5], [98, 66.5]], { w: 2 });
          p.pad(18, 41.5, 7, 3.6).pad(18, 46.5, 7, 3.6);
          p.pad(98, 61.5, 7, 3.6).pad(98, 66.5, 7, 3.6);
          p.label(27, 38.5, 'D+', { size: 3.6, cls: 'lbl-on' });
          p.label(27, 53, 'D−', { size: 3.6, cls: 'lbl-on' });
          p.leader(LX, 30, 54, 51.5, 'they bend together');
          p.leader(LX, 48, 84, 64, 'the gap stays');
          p.label(LX, 53.5, 'the same');
          p.leader(LX, 72, 99, 64, 'same length');
          p.caption('A differential pair');
        },
      },
    ],
  },

  {
    id: 'length-matching',
    name: 'Length matching',
    category: 'routing',
    aka: ['serpentine', 'meander', 'length tuning', 'skew'],
    keywords: 'equal same length wiggle zigzag delay timing clock data bus',
    summary: 'Making traces the same length, so their signals arrive together.',
    definition: 'Length matching makes a group of traces the same length, so that signals sent together also arrive together. The shorter trace is made longer on purpose with a serpentine: a few zigzag bends that add length without going anywhere. It is needed only for fast signals, such as the two halves of a differential pair or a memory bus. Slow signals such as I2C, UART and buttons do not need it.',
    say: [
      { for: 'Match a group', text: 'Match the lengths of {CLK, D0, D1, D2 and D3} to within {1 mm}. Add a serpentine to the short ones.' },
      { for: 'Cap the length', text: 'The trace from {Y1} to {U1.XIN} must be shorter than {5 mm}.' },
      { for: 'Report it', text: 'Give me a table of these traces with their lengths, and the difference from the longest.' },
      { for: 'Do not overdo it', text: 'Do not length-match {the I2C lines}. They are slow and do not need it.' },
    ],
    code: `export default () => (
  <board width="24mm" height="12mm">
    <resistor name="R1" resistance="22" footprint="0603" pcbX={-7} pcbY={0} />
    <resistor name="R2" resistance="22" footprint="0603" pcbX={7} pcbY={0} />
    <trace from="R1.pin2" to="R2.pin1" maxLength="16mm" />
  </board>
)`,
    render: false,
    codeNote: 'maxLength on a <trace> is a limit, not a wish. If the two pins are further apart than the limit, the build stops with an error that says so. For a pair, maxLengthSkew on <differentialpair> limits the difference between its two traces.',
    confusedWith: [
      { id: 'differential-pair', diff: 'Length matching is about equal length. A differential pair also needs a constant gap between its two traces.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          p.trace([[18, 30], [100, 30]]);
          p.pad(18, 30, 6, 6).pad(100, 30, 6, 6);
          p.trace([[36, 68], [42, 68], [42, 58], [50, 58], [50, 78], [58, 78], [58, 58], [66, 58], [66, 78], [74, 78], [74, 68], [84, 68]]);
          p.pad(36, 68, 6, 6).pad(84, 68, 6, 6);
          p.leader(LX, 26, 70, 30, 'trace A: 24 mm');
          p.leader(LX, 52, 66, 60, 'serpentine: extra');
          p.label(LX, 57.5, 'length, on purpose');
          p.leader(LX, 78, 84, 70, 'trace B: also 24 mm');
          p.caption('Both signals arrive together');
        },
      },
    ],
  },

  {
    id: 'teardrop',
    name: 'Teardrop',
    category: 'routing',
    aka: ['tear drop', 'fillet on a pad'],
    keywords: 'pad via joint widen strong crack drill wander flex',
    summary: 'Extra copper that widens a trace where it meets a pad or a via.',
    definition: 'A teardrop is a small wedge of copper that widens a trace where it joins a pad or a via. The joint is the weakest point of a thin trace: it can crack when the board bends, and it can be cut if the drill lands a little off-centre. A teardrop makes the joint wider and stronger. It matters most for thin traces, small vias and flexible boards.',
    say: [
      { for: 'Everywhere', text: 'Add teardrops where traces meet vias and through-hole pads.' },
      { for: 'Only where needed', text: 'Add teardrops only to traces thinner than {0.2 mm}.' },
    ],
    note: 'tscircuit has a pcbTeardrops prop on <trace>. Look at the result after you set it: a teardrop is drawn only where the trace is clearly thinner than the pad it enters.',
    confusedWith: [
      { id: 'thermal-relief', diff: 'A teardrop adds copper to make a joint stronger. A thermal relief removes copper to make a pad easier to solder.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          p.trace([[36, 32], [98, 32]], { w: 1.4 });
          p.via(36, 32, { d: 14, hole: 6 });
          p.area([[38, 65.2], [60, 71.3], [60, 72.7], [38, 78.8]], 'cuf');
          p.trace([[58, 72], [98, 72]], { w: 1.4 });
          p.via(36, 72, { d: 14, hole: 6 });
          p.badge(16, 32, 'no').badge(16, 72, 'ok');
          p.leader(LX, 28, 44.5, 32, 'thin joint: it can');
          p.label(LX, 33.5, 'crack or be cut');
          p.leader(LX, 66, 49, 70, 'teardrop: copper');
          p.label(LX, 71.5, 'widens at the joint');
          p.caption('A teardrop makes the joint stronger');
        },
      },
    ],
  },

  {
    id: 'impedance',
    name: 'Controlled impedance',
    category: 'routing',
    aka: ['characteristic impedance', '50 ohm trace', 'microstrip', 'transmission line'],
    keywords: 'rf antenna usb high speed 50 90 100 ohm reflection width height plane dielectric',
    summary: 'A trace whose width is chosen so that fast signals travel along it cleanly.',
    definition: 'A fast signal treats a trace as a transmission line. The line has a characteristic impedance, in ohms, set by three things: the width of the trace, its height above the ground plane, and the board material. If the impedance does not match the chip and the connector, part of the signal bounces back. A controlled-impedance trace has its width worked out to give the right number: often 50 Ω for an antenna, and 90 Ω for a USB pair.',
    say: [
      { for: 'An antenna feed', text: 'The trace from {U1.RF} to {the antenna} must be {50 Ω}. Work out its width for this stackup and show me the numbers you used.' },
      { for: 'A USB pair', text: 'Route {USB_DP and USB_DM} as a {90 Ω} differential pair. Tell me the width and the gap.' },
      { for: 'Keep the plane whole', text: 'Keep a solid ground plane under the whole length of {the RF trace}. No gaps and no other traces below it.' },
      { for: 'When it does not matter', text: 'Do not control impedance for {I2C, UART or the LEDs}. Those are slow signals.' },
    ],
    table: {
      caption: 'Width of a 50 Ω trace, about',
      columns: ['Board', 'Height above the plane', 'Width'],
      rows: [
        ['2 layers, 1.6 mm thick', '1.5 mm', '2.9 mm'],
        ['4 layers, 1.6 mm thick', '0.2 mm', '0.35 mm'],
      ],
      note: 'For a single trace on an outer layer of ordinary FR-4. The exact width depends on the factory and its materials. Use the impedance calculator of your factory for the real number.',
    },
    fabTip: 'On a two-layer board a 50 Ω trace is almost 3 mm wide, which is why boards with radio or fast signals use four layers. Many factories offer a controlled-impedance stackup and a calculator for it.',
    confusedWith: [
      { id: 'trace-width', diff: 'Trace width for current is about heat. Trace width for impedance is about signal quality. The two give different numbers.' },
      { id: 'return-path', diff: 'Impedance needs a ground plane under the trace. The return path is the current that flows in that plane.' },
    ],
    pictures: [
      {
        label: 'Cut through',
        draw(p) {
          p.rect(20, 54, 120, 24, 'f-fr4');
          p.rect(20, 78, 120, 5, 'f-cub');
          p.rect(66, 48, 28, 6, 'f-cu');
          for (const [x0, x1] of [[70, 58], [76, 70], [84, 90], [90, 102]]) {
            p.path(`M${x0} 54Q${(x0 + x1) / 2} 66 ${x1} 78`, 'f-none s-ink dash faint');
          }
          p.dim([66, 48], [94, 48], 'w: width of the trace', { off: 8, side: -1 });
          p.dim([36, 54], [36, 78], 'h', { side: 1 });
          p.leader(118, 30, 93, 50, 'signal trace');
          p.label(80, 91, 'solid ground plane', { anchor: 'middle' });
          p.label(80, 100, 'w, h and the board material set the impedance', { anchor: 'middle', size: 3.8 });
          p.caption('A trace above a ground plane');
        },
      },
    ],
  },
];
