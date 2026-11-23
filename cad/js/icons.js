// Small line icons, drawn on a 24 × 24 grid. They take the text colour.

const SHAPES = {
  // groups of terms
  cube: '<path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
  corner: '<path d="M5 20v-7a8 8 0 0 1 8-8h7"/><path d="M5 9V5h4" opacity=".45"/>',
  hole: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><circle cx="12" cy="12" r="4"/>',
  join: '<rect x="3" y="6" width="18" height="12" rx="1.5"/><path d="M11 6v3.5a2.5 2.5 0 0 1 0 5V18"/>',
  target: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5"/>',
  drawing: '<path d="M4 20V5l15 15z"/><path d="M8 16v-3.4l3.4 3.4z"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 12.5 9 5 9-5M3 17l9 5 9-5"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',

  // sections of a term page
  say: '<path d="M4 5h16v11h-9l-4.5 4v-4H4z"/><path d="M8 9h8M8 12.5h5"/>',
  code: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14"/>',
  table: '<rect x="3" y="4.5" width="18" height="15" rx="2"/><path d="M3 10h18M3 14.8h18M9.5 4.5v15"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.2"/>',
  versus: '<path d="M4 8h14m-3.5-3.5L18 8l-3.5 3.5M20 16H6m3.5-3.5L6 16l3.5 3.5"/>',

  // tools
  pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11M9 8h6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  up: '<path d="m6 14 6-6 6 6"/>',
  down: '<path d="m6 10 6 6 6-6"/>',
  remove: '<path d="m6 6 12 12M18 6 6 18"/>',
  download: '<path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/>',
};

export function icon(name, size = 18) {
  const holder = document.createElement('span');
  holder.className = 'ico';
  holder.innerHTML =
    `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" ` +
    `stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SHAPES[name] ?? SHAPES.cube}</svg>`;
  return holder;
}
