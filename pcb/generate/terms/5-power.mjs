// Copper pours and power: large copper areas, ground, and clean power for every chip.

const B = [8, 10, 104, 86]; // the usual board, leaving room for labels on the right
const LX = 117; // where those labels start

/** A band of bare board along a path: the gap that a pour leaves around a trace. */
function gap(p, points, w) {
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const length = Math.hypot(x2 - x1, y2 - y1);
    const nx = (-(y2 - y1) / length) * (w / 2);
    const ny = ((x2 - x1) / length) * (w / 2);
    p.area([[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]], 'f-board');
  }
  for (const [x, y] of points) p.circle(x, y, w / 2, 'f-board');
}

/** The pour itself: copper over the whole board, a little in from the edge. */
function pour(p, cls = 'cuf') {
  p.rect(B[0] + 2.5, B[1] + 2.5, B[2] - 5, B[3] - 5, `${cls} faint`, { r: 2 });
}

/** A white arrow through points, drawn on the board. It is part of the art, so cards show it too. */
function flow(p, points) {
  const [a, b] = points.slice(-2);
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const [ux, uy] = [(b[0] - a[0]) / length, (b[1] - a[1]) / length];
  const back = [b[0] - ux * 2.8, b[1] - uy * 2.8];
  p.line([...points.slice(0, -1), back], 'arw-on');
  p.area([b, [back[0] - uy * 1.3, back[1] + ux * 1.3], [back[0] + uy * 1.3, back[1] - ux * 1.3]], 'f-white');
}

export default [
  {
    id: 'copper-pour',
    name: 'Copper pour',
    category: 'power',
    aka: ['pour', 'copper fill', 'polygon pour', 'zone', 'ground fill'],
    keywords: 'fill area flood polygon ground gnd plane free space copper region',
    summary: 'Copper that fills the free space of a layer and is tied to one net, usually ground.',
    definition: 'A copper pour fills all the free space of a layer with copper and ties it to one net. That net is almost always ground. The pour flows around every trace and pad of other nets and leaves a gap around them. Pads of its own net join it directly. A pour gives every part a short way to ground, carries heat away, and shields signals from noise.',
    say: [
      { for: 'The basic ask', text: 'Fill the {bottom} layer with a copper pour connected to {GND}.' },
      { for: 'Both sides', text: 'Pour {GND} on the top and the bottom layer, and join the two with vias.' },
      { for: 'Set the gaps', text: 'Keep the pour {0.3 mm} away from other nets and {0.5 mm} from the edge of the board.' },
      { for: 'Check it', text: 'Show me the pour. Tell me if any piece of it is an island that is not connected to {GND}.' },
    ],
    code: `export default () => (
  <board width="24mm" height="16mm">
    <pinheader name="J1" pinCount={2} pitch="2.54mm" pcbX={-8} pcbY={0} pcbRotation={90} />
    <resistor name="R1" resistance="1k" footprint="0805" pcbX={2} pcbY={3} />
    <led name="LED1" color="red" footprint="0805" pcbX={2} pcbY={-3} />
    <trace from="J1.pin1" to="R1.pin1" />
    <trace from="R1.pin2" to="LED1.anode" />
    <trace from="LED1.cathode" to="net.GND" />
    <trace from="J1.pin2" to="net.GND" />
    <copperpour layer="bottom" connectsTo="net.GND" />
  </board>
)`,
    codeNote: 'A <copperpour> needs a layer and connectsTo. A pour is drawn only when something on its layer belongs to its net: here the through-hole pin J1.pin2 reaches the bottom layer, and the autorouter drops a via to the pour for the LED. With only surface-mount parts on top and no via, a bottom pour is left out. padMargin, traceMargin and boardEdgeMargin set the gaps. crosshatch draws a mesh in place of solid copper.',
    fabTip: 'A solid pour on both sides keeps the copper balanced, so the board stays flat when it is heated. A piece of pour that is connected to nothing is called an island. Remove islands, or tie them to ground with a via.',
    confusedWith: [
      { id: 'ground-plane', diff: 'A pour fills the space that is left over on a layer. A ground plane is a whole layer kept for ground, with nothing else on it.' },
      { id: 'trace', diff: 'A trace is a narrow path between two pins. A pour is a wide area that every pin of the net can join.' },
      { id: 'keepout', diff: 'A pour puts copper everywhere it can. A keep-out is an area where no copper may go, and the pour stays out of it.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          const a = [[26, 30], [58, 30], [74, 46], [94, 46]];
          const b = [[26, 60], [60, 60], [72, 72], [94, 72]];
          p.board(...B);
          pour(p);
          for (const path of [a, b]) {
            gap(p, path, 6.4);
            for (const [x, y] of [path[0], path[path.length - 1]]) p.rect(x - 5.2, y - 5.7, 10.4, 11.4, 'f-board', { r: 1 });
          }
          p.trace(a).trace(b);
          for (const path of [a, b]) for (const [x, y] of [path[0], path[path.length - 1]]) p.pad(x, y, 6, 7);
          p.pad(52, 84, 8, 7);
          p.leader(LX, 20, 100, 22, 'copper pour: fills');
          p.label(LX, 25.5, 'the free space');
          p.leader(LX, 44, 86, 50.4, 'gap around every');
          p.label(LX, 49.5, 'other net');
          p.leader(LX, 82, 55, 84, 'ground pad: joins');
          p.label(LX, 87.5, 'the pour directly');
          p.caption('A pour is ground copper wherever there is room');
        },
      },
    ],
  },

  {
    id: 'ground-plane',
    name: 'Ground plane',
    category: 'power',
    aka: ['GND plane', 'reference plane', 'power plane'],
    keywords: 'layer solid ground gnd inner four layer return shield noise reference power plane',
    summary: 'A whole copper layer that is kept solid and connected to ground.',
    definition: 'A ground plane is a whole layer of the board that is solid copper connected to ground. Any part reaches ground with one short via straight down. Every signal trace on the layer next to it has ground right underneath, which keeps signals clean and quiet. On a four-layer board, one inner layer is the ground plane and the other often carries power. A ground plane works only while it stays whole: do not cut it up with traces.',
    say: [
      { for: 'Four layers', text: 'Use a {4}-layer board. Make inner layer 1 a solid ground plane and inner layer 2 the {3.3 V} plane.' },
      { for: 'Two layers', text: 'Keep the bottom layer as a ground plane. Route everything on top, and use the bottom only for short jumps.' },
      { for: 'Reach it', text: 'Connect every ground pad to the ground plane with its own via, right next to the pad.' },
      { for: 'Protect it', text: 'Do not route any trace on the ground plane layer. Tell me if you cannot avoid it.' },
    ],
    code: `export default () => (
  <board width="24mm" height="16mm" layers={4}>
    <chip name="U1" footprint="soic8" pcbX={0} pcbY={0} pinLabels={{ pin4: "GND", pin8: "VCC" }} />
    <resistor name="R1" resistance="10k" footprint="0603" pcbX={-7} pcbY={3} />
    <via
      pcbX={-3.5} pcbY={-4}
      fromLayer="top" toLayer="bottom"
      holeDiameter="0.3mm" outerDiameter="0.6mm"
      connectsTo="net.GND"
    />
    <trace from="U1.pin1" to="R1.pin2" />
    <trace from="R1.pin1" to="net.GND" />
    <trace from="U1.GND" to="net.GND" />
    <copperpour layer="inner1" connectsTo="net.GND" />
  </board>
)`,
    codeNote: 'A ground plane is a <copperpour> on an inner layer. The layers of a four-layer board are top, inner1, inner2 and bottom. A via from top to bottom passes through all four, and it joins the plane because both are on the GND net. Without a via or a through-hole pin on that net, the inner pour is not drawn.',
    fabTip: 'Four layers cost only a little more than two at most factories, and a ground plane removes most noise problems before they start. For a board with radio, USB or a fast processor, four layers are the normal choice.',
    confusedWith: [
      { id: 'copper-pour', diff: 'A ground plane is a full layer that you plan for and protect. A pour is copper that fills whatever space the traces leave.' },
      { id: 'return-path', diff: 'The ground plane is the copper. The return path is the current that flows in it, under each signal trace.' },
    ],
    pictures: [
      {
        label: 'Cut through',
        draw(p) {
          const layers = [24, 43, 62, 81]; // the top of each copper layer, 4 thick
          p.rect(44, 28, 106, 53, 'f-fr4');
          p.rect(44, 28, 106, 15, 'f-pp').rect(44, 66, 106, 15, 'f-pp');
          p.rect(44, 28, 106, 53, 'f-none s-soft');
          // top: signal traces, and the pads of a chip
          p.rect(44, 24, 12, 4, 'f-cu').rect(62, 24, 30, 4, 'f-cu').rect(122, 24, 28, 4, 'f-cu');
          // inner 1: solid ground.  inner 2: power, with a hole where the via passes
          p.rect(44, 43, 106, 4, 'f-cui');
          p.rect(44, 62, 17, 4, 'f-cui').rect(75, 62, 75, 4, 'f-cui');
          // bottom: more signals
          p.rect(88, 81, 44, 4, 'f-cub');
          // the via, through all four layers
          p.rect(62, 24, 12, 4, 'f-pad s-pad', { sw: 0.25 }).rect(62, 81, 12, 4, 'f-pad s-pad', { sw: 0.25 });
          p.rect(65, 24, 6, 61, 'f-pad s-pad', { sw: 0.25 }).rect(66.5, 23.6, 3, 61.8, 'f-stage');
          // the chip
          p.rect(84, 20.6, 8, 3.4, 'f-lead').rect(122, 20.6, 8, 3.4, 'f-lead');
          p.rect(90, 11, 34, 11.5, 'body', { r: 1 });
          p.label(107, 18.5, 'chip', { anchor: 'middle', size: 3.6, cls: 'lbl-on' });
          p.ring(68, 45, 6);
          ['top: signals', 'inner 1: ground', 'inner 2: power', 'bottom: signals'].forEach((name, i) => p.label(41, layers[i] + 3.6, name, { anchor: 'end', size: 3.8 }));
          p.leader(58, 9, 68, 24.5, 'via down to ground', { anchor: 'middle' });
          p.leader(98, 98, 73, 64, 'gap: no contact with the power layer', { anchor: 'middle' });
          p.caption('One solid layer of ground, one via away');
        },
      },
    ],
  },

  {
    id: 'thermal-relief',
    name: 'Thermal relief',
    category: 'power',
    aka: ['thermal spokes', 'thermal pad connection', 'spoke connection'],
    keywords: 'spokes pad pour heat solder iron cold joint through hole hand soldering',
    summary: 'Thin spokes that join a pad to a pour, so the pad gets hot enough to solder.',
    definition: 'A thermal relief joins a pad to a copper pour through a few thin spokes, with gaps between them. A pad that is joined solidly loses its heat into the big copper area, so the solder will not melt properly. With spokes, the heat stays in the pad long enough to make a good joint. The spokes still carry the current. Thermal reliefs matter most for through-hole pins and for anything you solder by hand.',
    say: [
      { for: 'Turn them on', text: 'Use thermal reliefs where pads join the {GND} pour.' },
      { for: 'An exception', text: 'Use thermal reliefs everywhere, but join the pads of {Q1} solidly: it carries {5 A} and needs the copper for cooling.' },
      { for: 'Check a joint', text: 'Is {J1 pin 2} joined to the pour solidly or with spokes?' },
    ],
    code: `export default () => (
  <board width="24mm" height="16mm">
    <resistor name="R1" resistance="1k" footprint="1206" pcbX={-6} pcbY={0} />
    <pinheader name="J1" pinCount={2} pitch="2.54mm" pcbX={6} pcbY={0} />
    <trace from="R1.pin1" to="net.GND" />
    <trace from="J1.pin1" to="net.GND" />
    <copperpour layer="top" connectsTo="net.GND" useThermalReliefs />
  </board>
)`,
    codeNote: 'useThermalReliefs on a <copperpour> joins every pad of its net with spokes. Without it, pads join the pour solidly.',
    fabTip: 'Small parts with one pad on a pour and one pad on a thin trace heat up unevenly in the oven, and one end can lift. Thermal reliefs on both pads keep the two ends alike.',
    confusedWith: [
      { id: 'exposed-pad', diff: 'A thermal relief keeps heat in a pad, to make soldering easy. An exposed pad with thermal vias moves heat out of a chip, to keep it cool.' },
      { id: 'teardrop', diff: 'A thermal relief removes copper around a pad. A teardrop adds copper where a trace meets a pad.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(8, 10, 144, 74);
          p.rect(14, 16, 60, 62, 'cuf faint', { r: 2 }).rect(86, 16, 60, 62, 'cuf faint', { r: 2 });
          p.pth(44, 47, { d: 20, hole: 8 });
          p.circle(116, 47, 15, 'f-board');
          p.rect(100, 45, 32, 4, 'cuf faint').rect(114, 31, 4, 32, 'cuf faint');
          p.pth(116, 47, { d: 20, hole: 8 });
          p.badge(21, 23, 'no').badge(93, 23, 'ok');
          p.label(44, 92, 'solid joint', { anchor: 'middle' });
          p.label(44, 97.5, 'heat runs away: hard to solder', { anchor: 'middle', size: 3.5 });
          p.label(116, 92, 'thermal relief', { anchor: 'middle' });
          p.label(116, 97.5, 'four spokes: the pad heats up', { anchor: 'middle', size: 3.5 });
          p.caption('Two ways to join a pad to a pour');
        },
      },
    ],
  },

  {
    id: 'via-stitching',
    name: 'Via stitching',
    category: 'power',
    aka: ['stitching vias', 'ground stitching', 'via fence'],
    keywords: 'many vias ground top bottom tie join pour layers grid shield',
    summary: 'Many vias that tie the ground copper of two layers together.',
    definition: 'Via stitching is a pattern of many vias that join the ground copper on one layer to the ground copper on another. A pour that is joined in only one place is a poor ground: current has a long way to go. Stitching every few millimetres makes the two layers act as one. A row of stitching vias along the edge of the board, or around a noisy area, also works as a shield.',
    say: [
      { for: 'The basic ask', text: 'Stitch the top and bottom {GND} pours together with vias about every {5 mm}.' },
      { for: 'Along the edge', text: 'Add a row of ground vias along the edge of the board, {3 mm} apart.' },
      { for: 'Around a signal', text: 'Put ground vias on both sides of {the antenna trace}, {2 mm} apart, along its whole length.' },
    ],
    code: `export default () => (
  <board width="24mm" height="16mm" enableViaStitching viaStitchPitch="4mm">
    <resistor name="R1" resistance="1k" footprint="0805" pcbX={0} pcbY={0} />
    <trace from="R1.pin1" to="net.GND" />
    <copperpour layer="top" connectsTo="net.GND" />
    <copperpour layer="bottom" connectsTo="net.GND" />
  </board>
)`,
    codeNote: 'enableViaStitching on <board> adds vias wherever pours of the same net lie over each other. viaStitchPitch is the distance between them, centre to centre. Set it: without it the vias come about 1 mm apart, and this small board gets over 300 of them.',
    fabTip: 'Vias cost almost nothing, but each one is a drilled hole. A stitch every 3 to 5 mm is plenty for most boards.',
    confusedWith: [
      { id: 'via', diff: 'One via joins one trace to another layer. Stitching is a whole pattern of vias that joins two areas of copper.' },
      { id: 'exposed-pad', diff: 'Stitching vias spread ground across the board. Thermal vias sit under one chip and carry its heat away.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          pour(p);
          for (let x = 20; x <= 100; x += 16) {
            for (let y = 21; y <= 85; y += 16) {
              if (Math.abs(x - 60) < 20 && Math.abs(y - 53) < 14) continue; // room for the chip
              p.via(x, y, { d: 3.8, hole: 1.6 });
            }
          }
          p.rect(43, 39, 34, 28, 'f-board', { r: 1 });
          p.soic(60, 53);
          p.leader(LX, 20, 101.6, 20.4, 'stitching via');
          p.leader(LX, 44, 92, 45, 'ground copper on');
          p.label(LX, 49.5, 'top and bottom');
          p.dim([84, 69], [100, 69], '');
          p.leader(LX, 72, 92, 69.5, 'every few');
          p.label(LX, 77.5, 'millimetres');
          p.caption('Vias that stitch two ground layers together');
        },
      },
      {
        label: 'Cut through',
        draw(p) {
          p.rect(16, 46, 128, 26, 'f-fr4 s-soft');
          p.rect(16, 42, 128, 4, 'f-cu').rect(16, 72, 128, 4, 'f-cub');
          for (const x of [34, 64, 96, 126]) {
            p.rect(x - 3.2, 42, 6.4, 34, 'f-pad s-pad', { sw: 0.25 }).rect(x - 1.4, 41.6, 2.8, 34.8, 'f-stage');
          }
          p.leader(48, 30, 48, 43, 'ground copper on top', { anchor: 'middle' });
          p.leader(112, 90, 112, 75, 'ground copper on the bottom', { anchor: 'middle' });
          p.label(80, 62, 'board', { anchor: 'middle', cls: 'lbl-dark' });
          p.label(80, 101, 'each via ties the two layers together', { anchor: 'middle', size: 3.8 });
          p.caption('Cut through a row of stitching vias');
        },
      },
    ],
  },

  {
    id: 'decoupling-capacitor',
    name: 'Decoupling capacitor',
    category: 'power',
    aka: ['bypass capacitor', 'decap', '100 nF capacitor', 'bulk capacitor'],
    keywords: 'bypass cap 100nf 0.1uf power pin vdd vcc noise supply close near chip',
    summary: 'A small capacitor placed right next to each power pin of a chip.',
    definition: 'A decoupling capacitor is a small capacitor, usually 100 nF, connected between a power pin of a chip and ground. A chip takes current in short, sharp bursts. The capacitor is a tiny store of charge right at the pin, so the burst does not have to travel down a long trace. It only works when it is close: every millimetre of trace between capacitor and pin makes it slower. The rule is one capacitor for each power pin, as close to that pin as it will go.',
    say: [
      { for: 'The basic ask', text: 'Give every power pin of {U1} its own {100 nF} capacitor, on the same side of the board, as close to the pin as the rules allow.' },
      { for: 'Order of the path', text: 'Route power so it reaches the capacitor first and the pin after it.' },
      { for: 'Ground side', text: 'Give the ground pad of each decoupling capacitor its own via to the ground plane, right at the pad.' },
      { for: 'Check it', text: 'List every decoupling capacitor with the pin it serves and the length of the trace between them.' },
    ],
    code: `export default () => (
  <board width="20mm" height="14mm">
    <chip
      name="U1" footprint="soic8" pcbX={3} pcbY={0}
      pinLabels={{ pin1: "VDD", pin2: "GND" }}
    />
    <capacitor
      name="C1" capacitance="100nF" footprint="0402"
      pcbX={-1} pcbY={1.27} pcbRotation={270}
      decouplingFor="U1.VDD" decouplingTo="U1.GND"
      maxDecouplingTraceLength="2mm"
    />
  </board>
)`,
    codeNote: 'decouplingFor and decouplingTo on a <capacitor> connect it between a power pin and ground, with no <trace> needed. tscircuit also checks the distance. A capacitor between a power pin and ground may be at most 1 mm from the pins it connects to, measured from pad centre to pad centre. If it is further, the build stops with an error. maxDecouplingTraceLength changes that limit: next to a SOIC pin even an 0402 part is about 1.9 mm away, so this example allows 2 mm.',
    note: 'Besides the 100 nF capacitors at the pins, a board usually has one or two larger capacitors, 4.7 to 10 µF, where power enters. These are called bulk capacitors. They do not need to sit as close.',
    confusedWith: [
      { id: 'placement', diff: 'Placement is where every part goes. For a decoupling capacitor the place is the whole point: next to its pin.' },
    ],
    pictures: [
      {
        label: 'Good',
        draw(p) {
          p.board(...B);
          p.trace([[12, 34], [32, 34], [40, 42], [40, 44.26]], { w: 2.6 });
          p.trace([[40, 44.26], [46, 44.26], [47.24, 45.5], [59.9, 45.5]], { w: 1.8 });
          p.trace([[40, 51.74], [46, 51.74], [47.24, 50.5], [59.9, 50.5]], { w: 1.8 });
          p.trace([[40, 51.74], [37, 51.74], [31, 57.74]], { w: 1.8 });
          p.soic(70, 53);
          p.chip(40, 48, { kind: 'c', rot: 90 });
          p.via(31, 58);
          p.silkText(70, 71, 'U1', { size: 3.6 });
          p.label(13, 30, 'power in', { size: 3.6, cls: 'lbl-on' });
          p.badge(101, 19, 'ok');
          p.leader(LX, 30, 42.6, 46, 'capacitor: right');
          p.label(LX, 35.5, 'at the power pin');
          p.leader(26, 104, 31, 60.6, 'via to ground', { anchor: 'middle' });
          p.leader(70, 104, 52, 51.2, 'short traces', { anchor: 'middle' });
          p.caption('The capacitor sits at the pin it serves');
        },
      },
      {
        label: 'Bad',
        draw(p) {
          p.board(...B);
          p.trace([[12, 34], [40, 34], [51.5, 45.5], [59.9, 45.5]], { w: 2.6 });
          p.trace([[27.74, 82], [40, 82], [40, 60], [50, 50], [50, 47], [51.5, 45.5]], { w: 1.2 });
          p.trace([[20.26, 82], [15, 82], [15, 88]], { w: 1.2 });
          p.trace([[59.9, 50.5], [54, 50.5], [50, 54.5], [50, 58]], { w: 1.2 });
          p.soic(70, 53);
          p.chip(24, 82, { kind: 'c' });
          p.via(15, 88.5).via(50, 58.5);
          p.silkText(70, 71, 'U1', { size: 3.6 });
          p.label(13, 30, 'power in', { size: 3.6, cls: 'lbl-on' });
          p.badge(101, 19, 'no');
          p.leader(LX, 62, 40, 70, 'long thin trace:');
          p.label(LX, 67.5, 'the charge arrives');
          p.label(LX, 73, 'too late');
          p.leader(LX, 86, 29.6, 83, 'capacitor: far away');
          p.caption('Too far from the pin to help');
        },
      },
    ],
  },

  {
    id: 'return-path',
    name: 'Return path',
    category: 'power',
    aka: ['return current', 'current loop', 'ground return'],
    keywords: 'loop current back ground plane slot split gap noise emi interference under trace',
    summary: 'The way the current of a signal flows back, in the ground copper under its trace.',
    definition: 'Current always flows in a loop. What goes out along a signal trace comes back through ground: that is the return path. For a fast signal, the return current flows in the ground copper directly under the trace, following it like a shadow. If a gap or a slot in the ground copper lies across the way, the return current has to go around it. The big loop that this makes sends out noise and picks up noise. Keep solid ground under every fast trace, from one end to the other.',
    say: [
      { for: 'The rule', text: 'Keep solid ground copper under the whole length of {the clock trace}. Nothing may cut the ground under it.' },
      { for: 'No slots', text: 'Do not route any trace across the ground layer under {U1}. Go around it on the top layer.' },
      { for: 'Changing layer', text: 'Where {USB_DP} changes layer, put a ground via right beside its via, so the return current can change layer too.' },
      { for: 'Check it', text: 'Look at the ground layer and list every signal trace that passes over a gap in it.' },
    ],
    note: 'Slow signals such as buttons, LEDs and I2C are forgiving. The rule matters for clocks, USB, radio and switching power supplies.',
    confusedWith: [
      { id: 'ground-plane', diff: 'The ground plane is the copper. The return path is the route the current takes through it.' },
      { id: 'impedance', diff: 'Both need solid ground under the trace. Impedance is about the shape of the trace. The return path is about the ground staying whole.' },
    ],
    pictures: [
      {
        label: 'Solid ground',
        draw(p) {
          p.board(...B);
          pour(p, 'cuf-b');
          p.trace([[22, 46], [98, 46]]);
          p.pad(22, 46, 6, 7).pad(98, 46, 6, 7);
          flow(p, [[36, 41], [80, 41]]);
          flow(p, [[84, 51], [40, 51]]);
          p.badge(17, 19, 'ok');
          p.leader(LX, 26, 82, 41, 'signal current');
          p.leader(LX, 48, 84, 51, 'return current:');
          p.label(LX, 53.5, 'right under the');
          p.label(LX, 59, 'trace');
          p.leader(LX, 82, 96, 82, 'ground copper on');
          p.label(LX, 87.5, 'the layer below');
          p.caption('The return current follows the trace');
        },
      },
      {
        label: 'Gap in the ground',
        draw(p) {
          p.board(...B);
          pour(p, 'cuf-b');
          p.rect(56, 20, 8, 56, 'f-board', { r: 1 });
          p.trace([[22, 46], [98, 46]]);
          p.pad(22, 46, 6, 7).pad(98, 46, 6, 7);
          flow(p, [[36, 41], [80, 41]]);
          flow(p, [[86, 51], [70, 51], [70, 83], [50, 83], [50, 51], [34, 51]]);
          p.badge(17, 19, 'no');
          p.leader(LX, 22, 64, 26, 'gap in the ground');
          p.leader(LX, 40, 82, 41, 'signal current');
          p.leader(LX, 70, 70, 72, 'return current:');
          p.label(LX, 75.5, 'the long way round');
          p.caption('A gap forces the return current into a loop');
        },
      },
    ],
  },
];
