// Nets and connections: what is joined to what, before any copper is drawn.

const B = [8, 10, 104, 86]; // the usual board, leaving room for labels on the right
const LX = 117; // where those labels start

/** A thin line of a schematic drawing. */
const wire = (p, points) => p.line(points, 'f-none s-ink', { w: 0.6 });

export default [
  {
    id: 'net',
    name: 'Net',
    category: 'nets',
    aka: ['connection', 'node', 'signal', 'net name'],
    keywords: 'connected pins joined together wire electrical same name gnd sda list netlist',
    summary: 'A group of pins that are all connected to each other, with a name.',
    definition: 'A net is a group of pins that must all be connected to each other. Every net has a name, such as GND or SDA. A net says only that the pins belong together. It does not say where the copper goes: that is the job of the traces. Two pins on the same net are connected. Two pins on different nets must never touch.',
    say: [
      { for: 'Put pins on a net', text: 'Connect {pin 4 of U1}, {pin 2 of C1} and {pin 3 of J1} to the net {GND}.' },
      { for: 'Give it a name', text: 'Name the net between {U1.SDA} and {pin 2 of J1} {SDA}.' },
      { for: 'Ask for the list', text: 'List every net, with all the pins that are on it.' },
      { for: 'Check one pin', text: 'Which net is {pin 6 of U1} on? It should be {SCL}.' },
    ],
    code: `export default () => (
  <board width="24mm" height="14mm">
    <chip name="U1" footprint="soic8" pcbX={0} pcbY={0} pinLabels={{ pin1: "VCC", pin4: "GND" }} />
    <capacitor name="C1" capacitance="100nF" footprint="0603" pcbX={-8} pcbY={0} pcbRotation={90} />
    <resistor name="R1" resistance="10k" footprint="0603" pcbX={8} pcbY={-4} />
    <trace from="U1.GND" to="net.GND" />
    <trace from="C1.pin2" to="net.GND" />
    <trace from="R1.pin2" to="net.GND" />
    <trace from="U1.VCC" to="net.V3_3" />
    <trace from="C1.pin1" to="net.V3_3" />
  </board>
)`,
    codeNote: 'Write "net.GND" as one end of a <trace>, and that pin joins the net GND. A net exists as soon as its name is used. A <net name="GND" /> element is needed only to give the net its own rules, such as a trace width. A net name is made of letters, digits and _, and it cannot start with a digit: "3V3" stops the build, "V3_3" works.',
    note: 'The list of all nets and their pins is called the netlist. It is the best thing to check before any routing starts: if the netlist is wrong, a perfectly routed board is wrong too.',
    confusedWith: [
      { id: 'trace', diff: 'A net is the idea that pins are connected. A trace is the copper that connects them. One net often needs several traces.' },
      { id: 'ratsnest', diff: 'A net is a list of pins. The ratsnest is a picture of the nets that still have no copper.' },
      { id: 'power-net', diff: 'Every connection is a net. A power net is a net that carries the supply to many parts.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          // the net GND
          p.trace([[24, 51.74], [24, 62], [28, 66], [41, 66], [45.9, 61.1], [45.9, 55.5]], { w: 1.8 });
          p.trace([[36, 66], [56, 86], [98, 86]], { w: 1.8 });
          // the net SDA
          p.trace([[66.1, 45.5], [72, 45.5], [86.26, 31.24], [86.26, 26]], { w: 1.8 });
          p.trace([[72, 45.5], [81.5, 45.5], [98, 62]], { w: 1.8 });
          p.soic(56, 48);
          p.chip(24, 48, { kind: 'c', rot: 90 });
          p.chip(90, 26);
          for (const y of [62, 74, 86]) p.pth(98, y, { square: y === 62 });
          p.silkText(56, 34, 'U1', { size: 3.6 });
          p.silkText(24, 39, 'C1', { size: 3.6 });
          p.silkText(90, 19.5, 'R1', { size: 3.6 });
          for (const [x, y] of [[45.9, 55.5], [24, 51.74], [98, 86]]) p.ring(x, y, 4.8);
          for (const [x, y] of [[66.1, 45.5], [86.26, 26], [98, 62]]) p.ring(x, y, 4.8, 'f-none s-white dash');
          p.leader(LX, 28, 90.6, 24.6, 'net SDA: 3 pins');
          p.label(LX, 50, 'a net is a group');
          p.label(LX, 55.5, 'of pins that are');
          p.label(LX, 61, 'joined together');
          p.leader(LX, 84, 102.6, 85, 'net GND: 3 pins');
          p.caption('Two nets, each with three pins');
        },
      },
    ],
  },

  {
    id: 'pin-selector',
    name: 'Pin names and selectors',
    category: 'nets',
    aka: ['pin label', 'pin number', 'port', 'port selector', 'U1.VCC'],
    keywords: 'pin name number label select refer point datasheet pinout connect from to no connect nc',
    summary: 'How to point at one pin: the name of the part, a dot, and the name of the pin.',
    definition: 'To connect something, you must say exactly which pin you mean. A pin is written as the name of the part, a dot, and the name of the pin: U1.SDA. Every pin has a number, and a chip can also give its pins names from the datasheet. A name is safer than a number, because it says what the pin does. In tscircuit this way of pointing at a pin is called a selector.',
    say: [
      { for: 'Give the pin names', text: '{U1} is {the temperature sensor}, in a {SOIC-8} package. Its pins, from the datasheet, are: {1 ADDR, 2 NC1, 3 NC2, 4 GND, 5 INT, 6 SCL, 7 SDA, 8 VDD}. Use these names as pin labels.' },
      { for: 'Connect by name', text: 'Connect {U1.SDA} to {pin 3 of J1} and {U1.SCL} to {pin 4 of J1}.' },
      { for: 'Pins left open', text: 'Pins {NC1 and NC2} of {U1} stay open on purpose. Mark them as no-connect.' },
      { for: 'Check before wiring', text: 'Before you connect anything, show me the pin table of {U1} and tell me where you got it.' },
    ],
    code: `export default () => (
  <board width="26mm" height="16mm">
    <chip
      name="U1"
      footprint="soic8"
      pcbX={3}
      pcbY={0}
      pinLabels={{
        pin1: "ADDR", pin2: "NC1", pin3: "NC2", pin4: "GND",
        pin5: "INT", pin6: "SCL", pin7: "SDA", pin8: "VDD",
      }}
      connections={{ VDD: "net.V3_3", GND: "net.GND", ADDR: "net.GND" }}
      noConnect={["NC1", "NC2", "INT"]}
    />
    <resistor name="R1" resistance="4.7k" footprint="0603" pcbX={-8} pcbY={5} />
    <resistor name="R2" resistance="4.7k" footprint="0603" pcbX={-8} pcbY={-5} />
    <trace from="R1.pin2" to="U1.SDA" />
    <trace from=".R2 > .pin2" to=".U1 > .pin6" />
    <trace from="R1.pin1" to="net.V3_3" />
    <trace from="R2.pin1" to="net.V3_3" />
  </board>
)`,
    renderOptions: { showPinNumbers: true },
    codeNote: 'pinLabels gives the pins of a chip their names. After that "U1.SDA" and "U1.pin7" mean the same pin, and so does the older form ".U1 > .pin7". A name that the chip does not have stops the build, with an error that lists the names it does have. connections on a part joins its pins to nets or to other pins without separate <trace> lines. noConnect lists the pins that are left open on purpose. A resistor or capacitor has pin1 and pin2. An LED or diode has anode and cathode.',
    note: 'Wrong pin names are the most common reason a board does not work, and no check can find them. An agent that does not have the datasheet will guess. Give it the pin table, or the part number and the datasheet.',
    confusedWith: [
      { id: 'pin-1', diff: 'A selector is how you name a pin in the code. Pin 1 is the mark on the real part that shows where counting starts.' },
      { id: 'reference-designator', diff: 'U1 is the name of the whole part. U1.SDA is one pin of it.' },
      { id: 'net', diff: 'U1.SDA is one pin. The net SDA is every pin that is joined to it.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          const pins = p.soic(56, 46, { pitch: 8, bodyW: 26, padW: 7, padH: 4 });
          const names = ['ADDR', 'NC1', 'NC2', 'GND', 'INT', 'SCL', 'SDA', 'VDD'];
          pins.forEach(([x, y], i) => {
            const left = i < 4;
            p.label(left ? x - 1.2 : x + 1.2, y + 1.15, String(i + 1), { anchor: 'middle', size: 3.2, cls: 'lbl-dark' });
            p.label(left ? 47.2 : 67.4, y + 1.15, names[i], { anchor: left ? 'start' : 'end', size: 3.2, cls: 'lbl-on' });
          });
          p.silkText(56, 26.5, 'U1', { size: 4 });
          const r1 = p.chip(40, 82, { body: false, len: 14, wid: 6 });
          p.label(r1.a[0], r1.a[1] + 1.15, '1', { anchor: 'middle', size: 3.2, cls: 'lbl-dark' });
          p.label(r1.b[0], r1.b[1] + 1.15, '2', { anchor: 'middle', size: 3.2, cls: 'lbl-dark' });
          p.silkText(40, 75, 'R1', { size: 3.6 });
          p.leader(LX, 28, 76.8, 34, 'U1.VDD');
          p.label(LX, 33.5, 'or U1.pin8');
          p.leader(LX, 52, 76.8, 50, 'U1.SCL');
          p.label(LX, 57.5, 'or U1.pin6');
          p.leader(LX, 80, 47.2, 82, 'R1.pin2');
          p.caption('The part, a dot, then the pin');
        },
      },
    ],
  },

  {
    id: 'power-net',
    name: 'Power and ground nets',
    category: 'nets',
    aka: ['power rail', 'supply rail', 'GND', 'VCC', 'VDD', 'ground'],
    keywords: 'supply voltage rail 3v3 5v vbus vbat vin gnd ground return current wide regulator',
    summary: 'The nets that bring the supply to every chip, and the one that takes the current back.',
    definition: 'A power net carries the supply voltage to the parts that need it. The ground net, GND, is the way back for all that current, and it is the zero point that every voltage is measured from. These nets are different from signals. They go to almost every chip, they carry much more current, and their traces must be wide. A board often has several power nets: one from the connector, and one after each regulator.',
    say: [
      { for: 'Name them, with numbers', text: 'The power nets are {VBUS (5 V, up to 1 A)} and {V3_3 (3.3 V, up to 300 mA)}. Everything else is a signal.' },
      { for: 'Wide traces', text: 'Use {0.5 mm} traces for every power and ground net.' },
      { for: 'One connection each', text: 'Every chip gets its own trace to {V3_3} and to {GND}. Do not pass power on from the pin of one chip to the next.' },
      { for: 'Names that work', text: 'Name the nets {V3_3} and {V5}, not 3V3 and 5V: a net name cannot start with a digit.' },
    ],
    table: {
      caption: 'Common names',
      columns: ['Name', 'What it usually means'],
      rows: [
        ['GND', 'Ground: 0 V, the way back for all current'],
        ['VCC, VDD', 'The supply of the chips'],
        ['V3_3, V5', 'A supply named after its voltage: 3.3 V, 5 V'],
        ['VBUS', '5 V from a USB connector'],
        ['VBAT', 'Straight from the battery'],
        ['VIN', 'The input, before any regulator'],
        ['AGND', 'A separate ground for sensitive analog parts'],
      ],
    },
    code: `export default () => (
  <board width="24mm" height="14mm">
    <net name="VBAT" isPowerNet nominalTraceWidth="0.5mm" />
    <net name="GND" isGroundNet />
    <capacitor name="C1" capacitance="10uF" footprint="0805" pcbX={-6} pcbY={0} />
    <resistor name="R1" resistance="10k" footprint="0603" pcbX={6} pcbY={0} />
    <trace from="C1.pin1" to="net.VBAT" />
    <trace from="R1.pin1" to="net.VBAT" />
    <trace from="C1.pin2" to="net.GND" />
    <trace from="R1.pin2" to="net.GND" />
  </board>
)`,
    codeNote: 'tscircuit reads the name. A net whose name starts with GND, AGND, DGND, PGND or VSS is treated as ground, and one whose name starts with V, such as V3_3, VBUS or VCC, as power. For any other name, say it with isGroundNet or isPowerNet on <net>. nominalTraceWidth on the <net> makes every trace of that net wide: here the VBAT trace is 0.5 mm and the GND trace is still 0.15 mm.',
    fabTip: 'On a two-layer board, fill the bottom layer with a ground pour instead of drawing ground as thin traces. On a four-layer board, give ground a whole inner layer.',
    confusedWith: [
      { id: 'net', diff: 'A power net is one kind of net. It carries the supply, where a signal net carries information.' },
      { id: 'ground-plane', diff: 'GND is the net: a list of pins. A ground plane is copper: a whole layer that connects those pins.' },
      { id: 'trace-width', diff: 'A power net is why a trace must be wide. Trace width is how wide you make it.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          p.trace([[18, 36], [38, 36], [46, 44]], { w: 3.2 });
          p.trace([[70, 50], [74.4, 50], [81.9, 42.5]], { w: 2.4 });
          p.trace([[18, 64], [26, 72], [71.4, 72], [81.9, 61.5], [81.9, 57.5]], { w: 3 });
          p.trace([[46, 56], [46, 72]], { w: 3 });
          p.pad(18, 36, 8, 10).pad(18, 64, 8, 10);
          p.pad(46, 44, 6, 4).pad(46, 56, 6, 4).pad(70, 50, 6, 4);
          p.rect(50, 40, 16, 20, 'body', { r: 0.8 });
          p.soic(92, 50);
          p.silkText(18, 26.5, 'J1', { size: 3.6 });
          p.silkText(58, 51.2, 'U2', { size: 3.6 });
          p.silkText(92, 36, 'U1', { size: 3.6 });
          p.label(34, 32.6, 'VBUS', { size: 3.4, cls: 'lbl-on' });
          p.label(69, 57.5, 'V3_3', { size: 3.4, cls: 'lbl-on' });
          p.label(52, 79.5, 'GND', { size: 3.4, cls: 'lbl-on' });
          p.leader(30, 6, 30, 34.2, 'VBUS: 5 V in', { anchor: 'middle' });
          p.leader(94, 6, 76.6, 47.2, 'V3_3: 3.3 V from the regulator', { anchor: 'middle' });
          p.leader(LX, 76, 71, 72.4, 'GND: the way back');
          p.label(LX, 81.5, 'for the current');
          p.caption('Power goes out on wide traces. Ground brings it back');
        },
      },
    ],
  },

  {
    id: 'schematic-vs-layout',
    name: 'Schematic and layout',
    category: 'nets',
    aka: ['schematic', 'circuit diagram', 'PCB layout', 'board layout'],
    keywords: 'symbol diagram drawing logical physical two views schx pcbx connections copper',
    summary: 'Two drawings of one circuit: what is connected, and where the copper goes.',
    definition: 'A circuit is drawn in two ways. The schematic shows what is connected to what, with a symbol for each part and a line for each connection. It is made to be easy to read, and positions in it mean nothing. The layout shows the real board: where each part sits and where the copper runs. Both drawings must describe the same nets. In tscircuit one file makes both, so they cannot disagree.',
    say: [
      { for: 'Schematic first', text: 'First show me the schematic only. Do not place parts on the board until I agree with the connections.' },
      { for: 'Tidy the schematic', text: 'In the schematic, put {the power parts} on the left and {the connectors} on the right. This must not change the board.' },
      { for: 'Then the layout', text: 'The schematic is right. Now do the layout: {place the parts and show me before routing}.' },
      { for: 'Compare them', text: 'Check that every connection in the schematic has copper on the board, and that nothing else is joined.' },
    ],
    code: `export default () => (
  <board width="24mm" height="12mm">
    <resistor name="R1" resistance="330" footprint="0603" pcbX={-6} pcbY={0} schX={-2} schY={0} />
    <led name="LED1" color="red" footprint="0603" pcbX={6} pcbY={0} schX={2} schY={0} />
    <trace from="R1.pin2" to="LED1.anode" />
  </board>
)`,
    render: false,
    codeNote: 'Each part is written once and appears in both drawings. schX and schY place its symbol in the schematic. pcbX and pcbY place the real part on the board, in mm. The two positions have nothing to do with each other: moving a symbol never moves the part.',
    confusedWith: [
      { id: 'net', diff: 'The schematic and the layout are two drawings. The nets are what both of them must agree on.' },
      { id: 'placement', diff: 'Placing a symbol in the schematic is only for reading. Placement on the board decides how the real thing is built.' },
      { id: 'footprint', diff: 'A symbol is how a part looks in the schematic. A footprint is the copper it needs on the board.' },
    ],
    pictures: [
      {
        label: 'Side by side',
        draw(p) {
          // the schematic: a resistor and an LED between 5 V and ground
          wire(p, [[8, 50], [20, 50]]);
          p.rect(20, 46, 20, 8, 'f-none s-ink', { sw: 0.6 });
          wire(p, [[40, 50], [50, 50]]);
          p.area([[50, 45], [50, 55], [59, 50]], 'f-none s-ink', { sw: 0.6 });
          wire(p, [[59, 45], [59, 55]]);
          wire(p, [[59, 50], [70, 50], [70, 58]]);
          wire(p, [[66, 58], [74, 58]]);
          wire(p, [[67.6, 60], [72.4, 60]]);
          wire(p, [[69.2, 62], [70.8, 62]]);
          p.circle(8, 50, 1, 'f-ink');
          p.label(8, 45.5, 'V5', { anchor: 'middle', size: 3.6 });
          p.label(30, 42.5, 'R1', { anchor: 'middle', size: 3.6 });
          p.label(30, 60.5, '330 Ω', { anchor: 'middle', size: 3.4 });
          p.label(54.5, 41, 'LED1', { anchor: 'middle', size: 3.6 });
          // the layout: the same two parts on a board
          p.board(92, 28, 60, 44);
          p.trace([[111.74, 44], [118.26, 44], [132.26, 58]], { w: 1.6 });
          p.trace([[104.26, 44], [99, 44], [99, 63]], { w: 1.6 });
          p.trace([[139.74, 58], [145, 58], [145, 36]], { w: 1.6 });
          p.pad(99, 64, 5, 5).pad(145, 35, 5, 5);
          p.chip(108, 44);
          p.chip(136, 58, { kind: 'led' });
          p.silkText(108, 38.5, 'R1', { size: 3.2 });
          p.silkText(136, 52.5, 'LED1', { size: 3.2 });
          p.arrow([77, 50], [88, 50]);
          p.label(39, 82, 'schematic', { anchor: 'middle' });
          p.label(39, 88, 'what is connected', { anchor: 'middle', size: 3.7 });
          p.label(122, 82, 'layout', { anchor: 'middle' });
          p.label(122, 88, 'where the copper goes', { anchor: 'middle', size: 3.7 });
          p.caption('One circuit, drawn two ways');
        },
      },
    ],
  },

  {
    id: 'ratsnest',
    name: 'Ratsnest',
    category: 'nets',
    aka: ['airwires', 'rats nest', 'unrouted connections', 'air wires'],
    keywords: 'thin straight lines not routed yet unconnected placement crossing tangle guide',
    summary: 'Thin straight lines that show which pins still have to be connected.',
    definition: 'The ratsnest is a set of thin straight lines drawn between pins that belong to the same net but have no copper between them yet. Each line is a connection still to be made. It is the best guide for placing parts. Long lines and lines that cross each other mean the board will be hard to route. Move and turn the parts until the lines are short and few of them cross, and only then route.',
    say: [
      { for: 'Placement only', text: 'Do not route yet. Show me the placement with the ratsnest.' },
      { for: 'Untangle it', text: 'Turn {J1} around so that its ratsnest lines to {U1} do not cross.' },
      { for: 'A goal for placement', text: 'Move the parts until the ratsnest lines are short and few of them cross. Then stop and show me.' },
      { for: 'After routing', text: 'How many connections are still unrouted? List them.' },
    ],
    code: `export default () => (
  <board width="24mm" height="16mm" routingDisabled>
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
    renderOptions: { shouldDrawRatsNest: true },
    codeNote: 'routingDisabled on <board> skips the autorouter. The build is then fast and shows only the placed parts, with the connections as a ratsnest. Use it while you place parts, and remove it when the placement is agreed.',
    confusedWith: [
      { id: 'trace', diff: 'A ratsnest line is a reminder of a connection. A trace is the real copper. When the trace is drawn, the line goes away.' },
      { id: 'net', diff: 'A net is the list of pins that belong together. The ratsnest draws the parts of the nets that are not routed yet.' },
      { id: 'autorouter', diff: 'The ratsnest shows what is left to do. The autorouter does it.' },
    ],
    pictures: [
      {
        label: 'Crossed',
        draw(p) {
          p.board(...B);
          const pins = p.soic(40, 53);
          const c1 = p.chip(16, 53, { kind: 'c', rot: 90 });
          const header = [74, 60, 46, 32]; // pin 1 at the bottom
          header.forEach((y, i) => p.pth(92, y, { square: i === 0 }));
          p.line([c1.a, pins[0]], 'rats').line([c1.b, pins[3]], 'rats');
          [7, 6, 5, 4].forEach((pin, i) => p.line([pins[pin], [92, header[i]]], 'rats'));
          p.badge(104, 18, 'no');
          p.leader(LX, 34, 72.5, 52, 'the lines cross:');
          p.label(LX, 39.5, 'hard to route');
          p.leader(LX, 78, 95.8, 74.6, 'pin 1 of J1');
          p.caption('A ratsnest that is tangled');
        },
      },
      {
        label: 'Untangled',
        draw(p) {
          p.board(...B);
          const pins = p.soic(40, 53);
          const c1 = p.chip(16, 53, { kind: 'c', rot: 90 });
          const header = [32, 46, 60, 74]; // turned around: pin 1 at the top
          header.forEach((y, i) => p.pth(92, y, { square: i === 0 }));
          p.line([c1.a, pins[0]], 'rats').line([c1.b, pins[3]], 'rats');
          [7, 6, 5, 4].forEach((pin, i) => p.line([pins[pin], [92, header[i]]], 'rats'));
          p.badge(104, 18, 'ok');
          p.leader(LX, 30, 95.8, 31.4, 'pin 1 of J1');
          p.leader(LX, 52, 72, 53.2, 'J1 turned around:');
          p.label(LX, 57.5, 'short, clear lines');
          p.caption('The same parts after turning one of them');
        },
      },
    ],
  },
];
