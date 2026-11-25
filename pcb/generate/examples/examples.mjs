// Example prompts. Each example is a short conversation, written to show the
// kind of prompt that works. The code of every step is run through tscircuit by
// build.mjs, and the picture of the step is what tscircuit drew.
//
// A step without code has no picture. Numbers in a reply (sizes, counts,
// warnings) were read from the output of that step's code: check them again
// if you change the code.

const board = (props, lines) => `export default () => (
  <board ${props}>
${lines.join('\n')}
  </board>
)`;

// ---- a small LED board ---------------------------------------------------------

const LED_PARTS = [
  '    <pinheader',
  '      name="J1"',
  '      pinCount={2}',
  '      pitch="2.54mm"',
  '      pinLabels={["VIN", "GND"]}',
  '      pcbX={-11}',
  '      pcbY={0}',
  '      pcbRotation={90}',
  '    />',
  '    <resistor name="R1" resistance="330" footprint="0805" pcbX={-2} pcbY={0} />',
  '    <led name="LED1" color="green" footprint="0805" pcbX={6} pcbY={0} />',
];
const LED_TRACES = [
  '    <trace from="J1.VIN" to="R1.pin1" />',
  '    <trace from="R1.pin2" to="LED1.anode" />',
  '    <trace from="LED1.cathode" to="net.GND" />',
  '    <trace from="J1.GND" to="net.GND" />',
];
const LED_EXTRAS = [
  '    <hole diameter="2.2mm" pcbX={12} pcbY={5} />',
  '    <hole diameter="2.2mm" pcbX={12} pcbY={-5} />',
  '    <silkscreentext text="LED v1" pcbX={2} pcbY={-5} fontSize="1.2mm" />',
];
const LED_ROUTED = 'width="30mm" height="16mm" nominalTraceWidth="0.4mm"';

// ---- a breakout board for an I2C temperature sensor ----------------------------------

const chip = (attributes) => [
  '    <chip',
  '      name="U1"',
  '      footprint="soic8"',
  '      manufacturerPartNumber="LM75AD"',
  '      pinLabels={{',
  '        pin1: "SDA", pin2: "SCL", pin3: "OS", pin4: "GND",',
  '        pin5: "A2", pin6: "A1", pin7: "A0", pin8: "VCC",',
  '      }}',
  ...attributes,
  '      noConnect={["OS"]}',
  '      pcbX={3}',
  '      pcbY={0}',
  '    />',
];
const CHIP = chip([
  '      pinAttributes={{',
  '        VCC: { requiresPower: true },',
  '        GND: { requiresGround: true },',
  '      }}',
]);
const SENSOR_PARTS = [
  '    <pinheader',
  '      name="J1"',
  '      pinCount={4}',
  '      pitch="2.54mm"',
  '      pinLabels={["GND", "SCL", "SDA", "VCC"]}',
  '      pcbX={-10}',
  '      pcbY={0}',
  '      pcbRotation={90}',
  '    />',
  '    <capacitor name="C1" capacitance="100nF" footprint="0603" pcbX={7.5} pcbY={3} pcbRotation={270} />',
  '    <resistor name="R1" resistance="4.7k" footprint="0603" pcbX={-5.5} pcbY={5} pcbRotation={270} />',
  '    <resistor name="R2" resistance="4.7k" footprint="0603" pcbX={-2.5} pcbY={5} pcbRotation={270} />',
];
const SENSOR_TRACES = [
  '    <net name="V3_3" nominalTraceWidth="0.4mm" />',
  '    <trace from="J1.VCC" to="net.V3_3" />',
  '    <trace from="U1.VCC" to="net.V3_3" />',
  '    <trace from="C1.pin1" to="net.V3_3" />',
  '    <trace from="R1.pin1" to="net.V3_3" />',
  '    <trace from="R2.pin1" to="net.V3_3" />',
  '    <trace from="J1.SDA" to="net.SDA" />',
  '    <trace from="U1.SDA" to="net.SDA" />',
  '    <trace from="R1.pin2" to="net.SDA" />',
  '    <trace from="J1.SCL" to="net.SCL" />',
  '    <trace from="U1.SCL" to="net.SCL" />',
  '    <trace from="R2.pin2" to="net.SCL" />',
  '    <trace from="J1.GND" to="net.GND" />',
  '    <trace from="U1.GND" to="net.GND" />',
  '    <trace from="U1.A0" to="net.GND" />',
  '    <trace from="U1.A1" to="net.GND" />',
  '    <trace from="U1.A2" to="net.GND" />',
  '    <trace from="C1.pin2" to="net.GND" />',
];
const SENSOR_ROUTED = 'width="26mm" height="18mm" nominalTraceWidth="0.25mm"';
const POUR = '    <copperpour layer="bottom" connectsTo="net.GND" />';

export default [
  {
    id: 'ex-led-board',
    group: 'one-board',
    title: 'A small LED board',
    summary: 'A power light in four prompts: place the parts, connect them, add mounting holes, pour ground.',
    intro: 'One small board, built one change at a time. The first prompt places the parts and stops. Nothing is routed until the placement has been looked at. After each prompt the agent builds the board and reports what tscircuit said.',
    steps: [
      {
        title: 'Place the parts',
        file: 'index.circuit.tsx',
        prompt: `Use tscircuit, in index.circuit.tsx. After every change, build the board with tsci build, tell me every error and warning, then stop so I can look.

Start a board for a power light:
- the board is 30 × 16 mm
- J1: a 2-pin header with 2.54 mm pitch, 4 mm in from the left edge, standing upright. Pin 1 is VIN (5 V) and pin 2 is GND.
- R1: a 330 Ω resistor, size 0805
- LED1: a green LED, size 0805
- R1 and LED1 sit in a row on the centre line of the board, 8 mm apart, with R1 nearer the header
Place the parts only. Do not route anything yet.`,
        reply: 'Done. The board is 30 × 16 mm with three parts. J1 is at x = −11, which is 4 mm from the left edge, with pin 1 (VIN) at the bottom. R1 is at x = −2 and LED1 at x = 6, both on the centre line. Routing is switched off, so no traces are drawn. The build has no errors. It gives three kinds of warning: six pins have no trace yet, which is right at this step. J1 and LED1 have no manufacturer part number. And the project has no schematic sheet.',
        code: board('width="30mm" height="16mm" routingDisabled', LED_PARTS),
      },
      {
        title: 'Connect them',
        file: 'index.circuit.tsx',
        prompt: `The placement is good. Now connect the parts and route the board:
- J1 VIN to R1
- R1 to the anode of LED1
- the cathode of LED1 to GND, and J1 GND to GND
Use 0.4 mm traces, on the top layer only. Tell me how many traces there are and whether any is left unrouted.`,
        reply: 'Done. There are three traces, all 0.4 mm wide and all on the top layer, with no vias: VIN to R1, R1 to LED1, and one GND trace from LED1 back to J1. Nothing is left unrouted and the build has no errors. The warnings about pins without a trace are gone. A new one says that two traces have no name. At 5 V the LED gets about 9 mA through the 330 Ω resistor.',
        code: board(LED_ROUTED, [...LED_PARTS, ...LED_TRACES]),
      },
      {
        title: 'Mounting holes and a label',
        file: 'index.circuit.tsx',
        prompt: `Add two mounting holes for M2 screws: 2.2 mm holes, 3 mm in from the right edge, one 3 mm from the top edge and one 3 mm from the bottom edge. Add the text "LED v1" on the silkscreen, 1.2 mm tall, below the parts. Check that no trace or part is closer than 1 mm to a hole.`,
        reply: 'Done. The holes are at (12, 5) and (12, −5). The nearest copper is the right pad of LED1, about 5 mm from the edge of either hole, so both holes are clear. The text is at (2, −5), in free space below the parts. The build has no errors and no new warnings.',
        code: board(LED_ROUTED, [...LED_PARTS, ...LED_TRACES, ...LED_EXTRAS]),
      },
      {
        title: 'Ground pour and a check',
        file: 'index.circuit.tsx',
        prompt: `Fill the bottom layer with a ground pour connected to GND. Then check the whole board: build it and tell me the board size, the number of parts, the number of traces, how many traces are unrouted, and every error and warning.`,
        reply: 'Done. The bottom layer is now one ground pour. It joins the GND pin of J1 and is cut back around the VIN pin and the two holes. Board 30 × 16 mm, 3 parts, 3 traces, 0 unrouted, 0 errors. Warnings: J1 and LED1 have no manufacturer part number, two traces have no name, and there is no schematic sheet. None of them stops the board from being made.',
        code: board(LED_ROUTED, [...LED_PARTS, ...LED_TRACES, ...LED_EXTRAS, POUR]),
      },
    ],
    why: [
      'The first prompt places and stops. A bad placement is cheap to fix before routing and expensive after it.',
      'Every position is given from something real: “4 mm in from the left edge”, “on the centre line”, “8 mm apart”. The agent turns that into coordinates and tells you the numbers, so you can check them.',
      'Pins are named by what they do: VIN, GND, anode, cathode. A pin number alone is easy to get wrong.',
      'The last prompt asks for a report in numbers. An agent cannot see the picture, but it can count traces and read errors.',
    ],
    terms: ['placement', 'origin-coordinates', 'trace', 'trace-width', 'net', 'mounting-hole', 'silkscreen', 'copper-pour', 'drc'],
  },
  {
    id: 'ex-sensor-breakout',
    group: 'chip',
    title: 'A breakout board for a sensor chip',
    summary: 'An I2C temperature sensor with named pins, a decoupling capacitor, two pull-up resistors and a ground pour.',
    intro: 'A chip brings three new things: its pins need names from the datasheet, its power pin needs a capacitor right next to it, and its position decides how easy the routing is. Here the pins are named first, the parts are placed second, and only then is anything connected.',
    aside: 'The chip is an LM75A temperature sensor in an SOIC-8 package. Its pin list below is the one from its datasheet. For your own chip, always give the agent the datasheet, never a pin list from memory.',
    steps: [
      {
        title: 'The chip, with named pins',
        file: 'index.circuit.tsx',
        prompt: `Use tscircuit, in index.circuit.tsx. After every change, build the board with tsci build, tell me every error and warning, then stop so I can look.

Start a 26 × 18 mm board with one chip, U1: an LM75AD temperature sensor in an SOIC-8 package. Its pins, from the datasheet:
1 SDA, 2 SCL, 3 OS, 4 GND, 5 A2, 6 A1, 7 A0, 8 VCC
Name the pins with these labels so we can say U1.SDA and U1.VCC. VCC is the power pin and GND is the ground pin. OS is not used: mark it as not connected. Put U1 3 mm to the right of the centre of the board. Do not route anything yet.`,
        reply: 'Done. U1 is an SOIC-8 at (3, 0) with its eight pins labelled. VCC is marked as needing power and GND as needing ground, so the build can warn if either is left unconnected. OS is marked as not connected. The build has no errors. It warns that VCC and GND have no trace yet, which is right at this step, and that the project has no schematic sheet.',
        code: board('width="26mm" height="18mm" routingDisabled', CHIP),
      },
      {
        title: 'Place the parts around it',
        file: 'index.circuit.tsx',
        prompt: `Now add and place the other parts. Still no routing.
- J1: a 4-pin header with 2.54 mm pitch, 3 mm in from the left edge, standing upright. From top to bottom its pins are VCC, SDA, SCL, GND. That is the same order as the left side of U1, so the traces will not cross.
- C1: a 100 nF capacitor, size 0603, within 3 mm of U1.VCC, standing upright beside the chip
- R1 and R2: 4.7 kΩ pull-up resistors, size 0603, standing upright between the header and the chip, near the top edge. Their top ends will go to 3.3 V. R1 is for SDA and R2 is for SCL.
Tell me where each part ended up.`,
        reply: 'Done. J1 is at (−10, 0), 3 mm from the left edge. A header’s pin 1 ends up at the bottom when it stands upright, so its labels are listed bottom to top: GND, SCL, SDA, VCC. C1 is at (7.5, 3), with its top pad 3.0 mm from the VCC pin. R1 is at (−5.5, 5) and R2 at (−2.5, 5). Nothing is routed. The build has no errors. It warns that twelve pins have no trace yet, and that J1 has no manufacturer part number.',
        code: board('width="26mm" height="18mm" routingDisabled', [...CHIP, ...SENSOR_PARTS]),
      },
      {
        title: 'Connect and route',
        file: 'index.circuit.tsx',
        prompt: `The placement is good. Connect everything with named nets and route it:
- V3_3: J1.VCC, U1.VCC, C1, and the top end of R1 and R2
- SDA: J1.SDA, U1.SDA and the other end of R1
- SCL: J1.SCL, U1.SCL and the other end of R2
- GND: J1.GND, U1.GND, the other end of C1, and the address pins A0, A1 and A2
Use 0.4 mm traces for V3_3 and 0.25 mm for the signals. Tell me the number of traces and vias, and the width of each net.`,
        reply: 'Done. All four nets are routed on the top layer with no vias and nothing left unrouted. The V3_3 traces are 0.4 mm wide. The signal and ground traces are 0.25 mm, except one piece of the SDA net, 7.9 mm long, that the router made 0.15 mm. V3_3 runs along the top, through the top ends of R1 and R2, to pin 8 and C1. GND passes under the chip to reach A0, A1 and A2. The build has no errors, and the warnings about pins without a trace are gone.',
        code: board(SENSOR_ROUTED, [...CHIP, ...SENSOR_PARTS, ...SENSOR_TRACES]),
      },
      {
        title: 'Ground pour and a check',
        file: 'index.circuit.tsx',
        prompt: `Fill the bottom layer with a ground pour connected to GND. Then build and give me the full report: board size, parts, traces, vias, unrouted traces, and every error and warning.`,
        reply: 'Done. The bottom layer is a ground pour, cut back around the pins of J1 that are not ground. Board 26 × 18 mm, 5 parts, 4 nets, 0 vias, 0 unrouted, 0 errors. Two warnings are left: J1 has no manufacturer part number, and there is no schematic sheet.',
        code: board(SENSOR_ROUTED, [...CHIP, ...SENSOR_PARTS, ...SENSOR_TRACES, POUR]),
      },
    ],
    why: [
      'The pin list comes from the datasheet and is typed into the prompt. An agent that works from memory may give you the pinout of a different package.',
      'Pins are then used by label, U1.SDA, not by number. The code reads like the schematic, and a wrong connection is easy to spot.',
      'The header pins are ordered to match the chip, and the prompt says why. That one sentence is what lets the board route with no vias.',
      '“Within 3 mm of U1.VCC” is a placement rule the agent can check with a number. “Close to the chip” is not.',
      'Every net has a name. Asking for “the width of each net” then gives a short list you can read.',
    ],
    terms: ['pin-selector', 'pin-1', 'footprint', 'decoupling-capacitor', 'placement', 'rotation', 'net', 'power-net', 'trace-width', 'autorouter', 'copper-pour', 'ground-plane'],
  },
];
