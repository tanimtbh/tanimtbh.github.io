// Small line icons, drawn on a 24 × 24 grid. They take the text colour.

const SHAPES = {
  // groups of terms
  board: '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="M7.5 15h4l3.5-3.5h1.5"/><circle cx="7.3" cy="8.6" r=".7"/><circle cx="16.7" cy="15.4" r=".7"/>',
  pad: '<rect x="3.5" y="7.5" width="5.5" height="9" rx="1.2"/><rect x="15" y="7.5" width="5.5" height="9" rx="1.2"/><path d="M9 10h6M9 14h6"/>',
  net: '<circle cx="6" cy="6.5" r="2.3"/><circle cx="18" cy="9" r="2.3"/><circle cx="9.5" cy="18" r="2.3"/><path d="m8.2 7 7.5 1.5M6.8 8.7l2 7.1M16.4 10.7l-5.3 5.6"/>',
  route: '<circle cx="5" cy="18" r="2"/><circle cx="19" cy="6" r="2"/><path d="M7 18h4.5l7.5-7.5V8"/>',
  pour: '<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><circle cx="12" cy="12" r="3.2"/><path d="M12 3.5v5.3M12 15.2v5.3M3.5 12h5.3M15.2 12h5.3"/>',
  place: '<rect x="7" y="9" width="10" height="6" rx="1.2"/><path d="M12 3v3.5M12 17.5V21M3 12h1.5M19.5 12H21"/>',
  shield: '<path d="M12 3 5 6v5.5c0 4.3 2.9 7.6 7 9.5 4.1-1.9 7-5.2 7-9.5V6z"/><path d="m9 12 2.2 2.2L15.2 10"/>',
  factory: '<path d="M3.5 20V10.5l5 3.5v-3.5l5 3.5V5H17l1 15z"/><path d="M3 20h18"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',

  // sections of a term page
  say: '<path d="M4 5h16v11h-9l-4.5 4v-4H4z"/><path d="M8 9h8M8 12.5h5"/>',
  code: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14"/>',
  terminal: '<rect x="3" y="4.5" width="18" height="15" rx="2"/><path d="m7 10 3 2.5L7 15M12.5 15H17"/>',
  table: '<rect x="3" y="4.5" width="18" height="15" rx="2"/><path d="M3 10h18M3 14.8h18M9.5 4.5v15"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.2"/>',
  versus: '<path d="M4 8h14m-3.5-3.5L18 8l-3.5 3.5M20 16H6m3.5-3.5L6 16l3.5 3.5"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',

  // guide pages
  book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11M9 8h6"/>',
  wrench: '<path d="M14.6 6.3a4.2 4.2 0 0 0-5.4 5.4L4 16.9 7.1 20l5.2-5.2a4.2 4.2 0 0 0 5.4-5.4l-2.7 2.7-2.5-.6-.6-2.5z"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
};

export function icon(name, size = 18) {
  const holder = document.createElement('span');
  holder.className = 'ico';
  holder.innerHTML =
    `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" ` +
    `stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SHAPES[name] ?? SHAPES.board}</svg>`;
  return holder;
}
