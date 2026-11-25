// The words on the guide pages: example prompts, setup steps and the reasons
// for tscircuit. The examples themselves are in generate/examples/*.mjs. The
// build runs their code and writes examples-data.js and data/models/ex-*.json.

/** Rules for the agent, meant to be saved as CLAUDE.md in a PCB project. */
export const RULES = `# PCB rules for this project

- Design every board in tscircuit (TSX). Do not use KiCad, EasyEDA or any other tool.
- After every change, build the board with: tsci build index.circuit.tsx. Read every error and warning it prints and tell me all of them. Never hide one and never pass --ignore-errors.
- Units are millimetres. The origin (0, 0) is the centre of the board. Seen from the top side, +X is right and +Y is up. A rotation is counter-clockwise.
- Place first, then route. Stop after placement so I can look, and do not route until I agree. Keep routingDisabled on the board until then.
- Give every part a name (R1, C1, U1, J1) and every important net a name (GND, V3_3, SDA). Refer to a pin by its label, such as U1.VCC, not by a guessed pin number.
- Never guess a pinout or a footprint. Ask me for the part number or the datasheet, and tell me which page you used.
- Trace width, clearance and annular ring are measured edge to edge. Pitch is measured centre to centre. A via given as 0.6 / 0.3 means copper diameter / hole diameter.
- Put every size that matters in a named constant at the top of the file.
- If a size, a position, a side or a net is missing, ask me. Do not guess silently. List every assumption you made.
- After each step, tell me the board size, the number of parts, the number of traces and vias, how many traces are unrouted, and anything you changed that I did not ask for.
- The words I use are defined in pcb-terms.md. Read it before you start.`;

/** The sentences every first prompt should carry, even without CLAUDE.md. */
export const OPENING =
  'Use tscircuit. After every change, build the board with tsci build, tell me every error and warning, then stop so I can look.';

/** A fill-in prompt for adding a part. {Marked values} are meant to be changed. */
export const PART_TEMPLATE = `I am adding a part: {U2, a BME280 sensor in the 2.5 × 2.5 mm LGA-8 package}.
Use tscircuit, in {index.circuit.tsx}.
Its datasheet is at {docs/bme280.pdf}. Take the footprint and the pin list from it, and tell me which pages you used.
Its pins: {1 GND, 2 CSB, 3 SDI, 4 SCK, 5 SDO, 6 VDDIO, 7 GND, 8 VDD}.
It connects to: {VDD and VDDIO to V3_3, SDI to SDA, SCK to SCL, CSB to V3_3, SDO to GND}.
It needs nearby: {a 100 nF capacitor within 2 mm of pin 8}.
Place it {near the top edge, at least 10 mm from the regulator, which gets warm}.
First add it and place it, without routing. Build the board, tell me every error and warning, and wait for me.`;

export const PART_FACTS = {
  caption: 'What to tell the agent about a part',
  columns: ['Part', 'Facts the agent needs from you'],
  rows: [
    ['Resistor, capacitor', 'Value and size (10 kΩ, 0603). For a capacitor also the voltage it must stand. For a resistor that carries power, how many watts.'],
    ['LED, diode', 'Size, colour or type, and which pad is the cathode. For an LED, the current you want, so the resistor can be worked out.'],
    ['Chip', 'The full part number with its package ending, and the datasheet. The pin list. Which pins need a capacitor. Whether it has an exposed pad underneath.'],
    ['Connector', 'Part number, number of pins, pitch, through-hole or surface mount. Which edge of the board it sits on, which way the plug comes in, and where pin 1 is.'],
    ['Radio module', 'Its outline, the pitch of its pads, which end has the antenna, and the keep-out the maker asks for. Which pins you use.'],
    ['Voltage regulator', 'Input voltage, output voltage and the largest current. The capacitors its datasheet asks for. How much copper it needs to stay cool.'],
    ['Crystal', 'Frequency, its two load capacitors, and that it must sit right next to the pins of its chip.'],
    ['Button, switch', 'The footprint, and which of its pins are joined inside.'],
    ['Mounting holes', 'The screw size, and where each hole is, measured from a corner or from the centre of the board.'],
    ['The board itself', 'Width, height, corner radius, thickness and number of layers. Any cutout. Anything it must fit into.'],
    ['Power', 'The supply voltage and the largest current of each power net, so trace widths can be chosen.'],
    ['The factory', 'Who will make the board, and their smallest trace, gap, via and hole.'],
  ],
  note: 'For every part, also say which side of the board it is on and what must stay free around it.',
};

export const GROUPS = [
  { id: 'one-board', name: 'One board, step by step', blurb: 'One change per prompt. The agent builds after each change and reports what tscircuit says.' },
  { id: 'chip', name: 'Around a chip', blurb: 'Named pins, a decoupling capacitor, pull-up resistors and a ground pour.' },
];

// ---- setup ------------------------------------------------------------------

export const HELLO = `export default () => (
  <board>
    <resistor resistance="1k" footprint="0402" name="R1" />
    <capacitor capacitance="1000pF" footprint="0402" name="C1" />
    <trace from=".R1 > .pin1" to=".C1 > .pin1" />
  </board>
)`;

export const SETUP = [
  {
    title: 'Install VS Code',
    body: [
      'VS Code is the editor everything else plugs into. Download it from code.visualstudio.com and install it with the default options.',
    ],
    links: [{ text: 'code.visualstudio.com', href: 'https://code.visualstudio.com/' }],
  },
  {
    title: 'Install Bun',
    body: [
      'tscircuit comes with a command-line tool called tsci, and tsci runs on Bun. Bun is a program that runs JavaScript and TypeScript, like Node.js.',
      'Open a terminal (in Windows: PowerShell) and run one line:',
    ],
    commands: [
      { label: 'Windows (PowerShell)', code: 'powershell -c "irm bun.sh/install.ps1 | iex"' },
      { label: 'macOS and Linux', code: 'curl -fsSL https://bun.sh/install | bash' },
    ],
    after: ['Close the terminal and open a new one. Then check that it works:'],
    commandsAfter: [{ code: 'bun --version' }],
    links: [{ text: 'Bun installation guide', href: 'https://bun.sh/docs/installation' }],
  },
  {
    title: 'Install tscircuit',
    body: ['This installs the tsci command for every project on your computer.'],
    commands: [{ code: 'bun install --global tscircuit\ntsci version' }],
    after: ['The second line prints the version number. tscircuit changes quickly, so it is worth writing that number down when a board works.'],
    links: [{ text: 'tscircuit documentation', href: 'https://docs.tscircuit.com/' }],
  },
  {
    title: 'Make a project',
    body: [
      'Each board is a folder. These commands make one, fill it with a starter board, and open it in VS Code.',
    ],
    commands: [{ code: 'mkdir my-board\ncd my-board\ntsci init -y\ncode .' }],
    after: [
      'tsci init writes the board file index.circuit.tsx, a package.json, and a few settings files. It also puts a tscircuit skill in .claude/skills. That skill teaches Claude Code the elements and commands of tscircuit, so the agent does not have to guess them.',
      'The starter board is three lines: a resistor, a capacitor and one trace between them.',
    ],
    code: HELLO,
    codeName: 'index.circuit.tsx',
  },
  {
    title: 'See the board',
    body: ['Start the preview from the terminal, inside the project folder:'],
    commands: [{ code: 'tsci dev' }],
    after: [
      'It prints the address of a page, normally http://localhost:3020. Open it in your browser. The page shows the board as a PCB, as a schematic and in 3D, and it redraws when you save the file.',
      'Keep this page open beside VS Code while you work. It is your eyes. The agent does not use it.',
    ],
  },
  {
    title: 'Build from the command line',
    body: [
      'This is the command the agent uses to check its work. It runs the code, routes the board, and prints every error and warning as a line of text.',
    ],
    commands: [{ code: 'tsci build index.circuit.tsx' }],
    after: [
      'The result is written to dist/index/circuit.json: a list of every part, pad, trace and error on the board. If there is an error, the command ends with code 1, so the agent knows it failed.',
      'To get a picture without the preview page:',
    ],
    commandsAfter: [{ code: 'tsci export index.circuit.tsx -f pcb-png' }],
    end: ['This writes index.circuit-pcb.png next to the board file. An agent can open that picture and look at it.'],
  },
  {
    title: 'Add the Claude Code extension',
    body: [
      'In VS Code, open the Extensions view (Ctrl+Shift+X, or Cmd+Shift+X on a Mac). Search for “Claude Code”, from Anthropic, and press Install. Or install it from the terminal:',
    ],
    commands: [{ code: 'code --install-extension anthropic.claude-code' }],
    after: [
      'Click the Claude icon, a small spark, in the bar on the left edge of VS Code. The first time, a sign-in screen appears: press Sign in and finish in your browser. You need a paid Claude plan (Pro, Max, Team or Enterprise) or a Claude Console account.',
    ],
    links: [{ text: 'Claude Code in VS Code', href: 'https://code.claude.com/docs/en/vs-code' }],
  },
  {
    title: 'Give the agent its standing rules',
    body: [
      'Make a file called CLAUDE.md in the project folder and paste the rules below into it. Claude Code reads this file at the start of every session, so you never have to repeat them.',
    ],
    rules: true,
    after: [
      'The last rule names pcb-terms.md. That file is this whole glossary as plain text, written for an agent. Save it into the project folder, next to CLAUDE.md:',
    ],
    glossary: true,
    end: ['Other agents read a file called AGENTS.md in the same way. The same text works there.'],
  },
  {
    title: 'Write your first prompt',
    body: [
      'Arrange the screen so you can see the chat and the preview page side by side. Then ask for one thing at a time, and start with placement.',
    ],
    next: true,
  },
  {
    title: 'Order the board',
    body: ['When the build has no errors and you are happy with the picture, export the files for the factory:'],
    commands: [{ code: 'tsci export index.circuit.tsx -f gerbers' }],
    after: [
      'This writes index.circuit-gerbers.zip. Inside are the Gerber files, one for each layer of the board, with a parts list (bom.csv) and a placement file (pick_and_place.csv). Upload the zip to the website of your factory, and look at their preview of every layer before you pay.',
    ],
  },
];

export const TROUBLE = [
  ['“tsci” is not found', 'Close the terminal and open a new one, so it picks up the new program. If it is still not found, run bun --version: if that fails too, install Bun again.'],
  ['Unknown file extension “.tsx”', 'tsci was started by Node.js. It needs Bun. Install Bun (step 2) and run the command again.'],
  ['The agent says it cannot see the board', 'It cannot see your screen. Ask it for numbers from the build: board size, number of traces, unrouted traces, errors. It can also export a picture with tsci export … -f pcb-png and open that.'],
  ['A trace is left unrouted', 'Do not loosen the rules. Give the router more room: move parts apart, turn a part so its pins face the parts they connect to, or let the trace use the other layer.'],
  ['The agent uses an element or a prop that does not exist', 'tscircuit is young and its names change. Tell the agent to read the error, look the element up in the tscircuit skill in .claude/skills, and fix it. Keep the version of tscircuit fixed in package.json so it does not change under you.'],
  ['The build takes a long time', 'Most of the time goes into routing. While you are still placing parts, keep routingDisabled on the board.'],
];

// ---- why tscircuit ------------------------------------------------------------

export const WHY_POINTS = [
  {
    title: 'The board is a text file',
    text: 'A tscircuit board is a short file of code. An agent can read all of it, change one line, and see exactly what changed. You can read it too, compare two versions, and go back to yesterday’s. A board file from a click-based program is thousands of lines of coordinates that only that program is meant to open.',
  },
  {
    title: 'It is a language agents already write well',
    text: 'The code is TSX, the same form as a React web page. A part is an element, its value is a prop, a block you use twice is a component, and ten LEDs in a row are a loop. AI agents write this kind of code very well, and there is no special board language to learn first.',
  },
  {
    title: 'The agent can check its own work',
    text: 'One command builds the board and prints every problem as a line of text: a trace that could not be routed, two parts that overlap, copper too close to the edge. An agent that cannot see the board can still read that list and fix what it says.',
  },
  {
    title: 'You point at things with names',
    text: 'A pin is U1.VCC. A net is net.GND. A position is pcbX and pcbY in millimetres from the centre of the board. Nothing is picked with a mouse, so a prompt can say exactly what it means, and the code says it back.',
  },
  {
    title: 'The traces are drawn for you',
    text: 'You say what is connected and where the parts sit. The autorouter draws the traces every time the board is built. Move a part and the traces follow. For the few traces that matter most, you can still fix the path by hand.',
  },
  {
    title: 'One file gives every output',
    text: 'The same code produces the schematic, the board, a 3D view, the parts list and the files for the factory. They cannot drift apart, because they all come from one place.',
  },
  {
    title: 'Nothing else has to be running',
    text: 'There is no design program to keep open and no plug-in to connect. Everything is files in a folder and one command in a terminal. That is why it works with Claude Code and with any other coding agent alike.',
  },
];

export const COMPARE = {
  caption: 'Three ways to let an AI agent make a board',
  columns: ['', 'tscircuit', 'A board program driven by scripts or MCP', 'A netlist language alone'],
  rows: [
    ['What the agent writes', 'TSX code', 'Commands to a running program, or edits to its board file', 'Code that lists parts and connections'],
    ['Where the design lives', 'A short text file', 'The program’s own board file', 'A text file, plus a board file drawn later'],
    ['Reading back the whole design', 'Read the file', 'Many questions to the program', 'Read the file, but the layout is somewhere else'],
    ['Who places the parts', 'The code: positions, or an automatic layout', 'Commands, one part at a time', 'A person, later, in a board program'],
    ['Who draws the traces', 'The autorouter, on every build', 'A person, or the program’s own router', 'A person, later, in a board program'],
    ['Checking the result', 'One build command prints every error', 'Only what the server offers', 'Connection checks only'],
    ['What must be installed', 'Bun and one package', 'The program, a plug-in and the server', 'The language, and a board program for the layout'],
  ],
};

export const VERSUS = [
  {
    title: 'Why not drive KiCad or another board program?',
    text: [
      'A script or an MCP server lets an agent press the buttons of a running board program. Each step is a separate command, and the design is kept inside that program. To know what it has built, the agent has to keep asking, and it cannot read the whole board the way it reads a file.',
      'The board file itself is text, but it is not written for reading: it is a long list of coordinates and identifiers. An agent can edit it, but one wrong number moves a pad, and nothing says so until the checks are run inside the program.',
      'It also adds things that can break: the program must be open, the plug-in must match its version, and the server must be connected. With tscircuit the agent needs only what every coding agent already has: it edits a file and runs a command.',
    ],
    fair: 'A full board program is the right tool when the design already lives in one, or when the board is dense and fast and needs a skilled person with an interactive router. tscircuit can export a KiCad board, so a design can start as code and be finished by hand.',
  },
  {
    title: 'Why not a netlist language alone?',
    text: [
      'Some tools let you write the circuit as code, but only the circuit: which parts there are and what is connected to what. The board is then laid out by hand in a separate program.',
      'That covers the half an agent finds easy and leaves the half this glossary is about: where the parts go and how the copper runs. tscircuit keeps both halves in the same file, so one prompt can change a connection and see what it does to the board.',
    ],
  },
];

export const WHY_LIMITS = [
  'Dense, fast boards, with large BGA chips, memory buses or radio parts you design yourself, still need a skilled person and an interactive router.',
  'tscircuit is young and changes quickly. A prop that works today may be renamed next month. Fix the version in your project, and build after every change.',
  'The autorouter does not always find a route, and its result is not always pretty. Often the answer is a better placement, not a different router.',
  'You do not drag parts with a mouse: every change goes through code. With an agent writing the code, that is the point, but it is a different way of working.',
];
