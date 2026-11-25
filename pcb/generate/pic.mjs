// A small drawing kit for PCB pictures.
//
// Every picture is drawn on the same 160 × 120 canvas (x to the right, y down),
// so text and line widths look the same on every page. Sizes are not to scale:
// a trace is about 2 units wide, a via about 5.
//
// Colours come from the website's stylesheet through class names:
//
//   brd    board (solder mask)        cu / cu-b / cu-i   copper trace: top, bottom, inner
//   pad    bare copper you solder to  cuf / cuf-b        filled copper area
//   hole   drilled hole               silk               silkscreen ink
//   body   component body             lead               component leg or end cap
//   hi     highlight                  bad / good         wrong / right
//   x-*    materials in a cross-section (see style.css)
//
// Labels, dimension lines and the caption are "annotations". They are drawn on
// top of the art, and the small pictures on cards leave them out.

export const W = 160;
export const H = 120;

const n = (value) => String(Math.round(value * 100) / 100);
const esc = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pts = (points) => points.map(([x, y]) => `${n(x)} ${n(y)}`).join('L');
const width = (sw) => (sw == null ? '' : ` stroke-width="${n(sw)}"`);
const LAYER = { top: 'cu', bottom: 'cu-b', inner: 'cu-i' };

export class Pic {
  constructor() {
    this.art = [];
    this.notes = [];
    this.box = [Infinity, Infinity, -Infinity, -Infinity];
    this.problems = [];
  }

  // ---- bookkeeping ----------------------------------------------------------

  _grow(x, y, margin = 0) {
    const b = this.box;
    b[0] = Math.min(b[0], x - margin);
    b[1] = Math.min(b[1], y - margin);
    b[2] = Math.max(b[2], x + margin);
    b[3] = Math.max(b[3], y + margin);
  }

  _art(svg) { this.art.push(svg); return this; }
  _note(svg) { this.notes.push(svg); return this; }

  // ---- plain shapes -----------------------------------------------------------

  rect(x, y, w, h, cls, { r = 0, note = false, sw = null } = {}) {
    if (!note) { this._grow(x, y); this._grow(x + w, y + h); }
    const svg = `<rect class="${cls}" x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${r ? ` rx="${n(r)}"` : ''}${width(sw)}/>`;
    return note ? this._note(svg) : this._art(svg);
  }

  circle(x, y, r, cls, { note = false, sw = null } = {}) {
    if (!note) this._grow(x, y, r);
    const svg = `<circle class="${cls}" cx="${n(x)}" cy="${n(y)}" r="${n(r)}"${width(sw)}/>`;
    return note ? this._note(svg) : this._art(svg);
  }

  /** An open line through points. w is the line width in canvas units. */
  line(points, cls, { w = null, note = false } = {}) {
    if (!note) for (const [x, y] of points) this._grow(x, y, (w ?? 0) / 2);
    const svg = `<path class="${cls}" fill="none" d="M${pts(points)}"${w ? ` stroke-width="${n(w)}"` : ''}/>`;
    return note ? this._note(svg) : this._art(svg);
  }

  /** A closed, filled shape. Extra outlines inside the first become holes. sw sets the outline width. */
  area(outlines, cls, { note = false, sw = null } = {}) {
    const rings = Array.isArray(outlines[0][0]) ? outlines : [outlines];
    if (!note) for (const ring of rings) for (const [x, y] of ring) this._grow(x, y);
    const svg = `<path class="${cls}" fill-rule="evenodd" d="${rings.map((ring) => `M${pts(ring)}Z`).join('')}"${width(sw)}/>`;
    return note ? this._note(svg) : this._art(svg);
  }

  /** Raw SVG path data, for curves. Give the box it covers so small pictures can crop to it. */
  path(d, cls, box = null) {
    if (box) { this._grow(box[0], box[1]); this._grow(box[2], box[3]); }
    return this._art(`<path class="${cls}" d="${d}"/>`);
  }

  // ---- the board and its copper -------------------------------------------------

  board(x, y, w, h, { r = 3, cls = 'brd' } = {}) {
    return this.rect(x, y, w, h, cls, { r });
  }

  /** A copper trace through points, with round ends. layer: top, bottom or inner. */
  trace(points, { w = 2.2, layer = 'top', cls = '' } = {}) {
    return this.line(points, `${LAYER[layer]} ${cls}`.trim(), { w });
  }

  /** A surface-mount pad, centred on x, y. */
  pad(x, y, w = 4, h = 5, { r = 0.7, cls = 'pad' } = {}) {
    return this.rect(x - w / 2, y - h / 2, w, h, cls, { r });
  }

  /** A via: a small plated hole that joins layers. d is the copper diameter. */
  via(x, y, { d = 5, hole = 2.2, cls = 'pad' } = {}) {
    return this.circle(x, y, d / 2, cls).circle(x, y, hole / 2, 'hole');
  }

  /** A plated through hole for a component leg. */
  pth(x, y, { d = 6.4, hole = 3, square = false, cls = 'pad' } = {}) {
    if (square) this.rect(x - d / 2, y - d / 2, d, d, cls, { r: 0.6 });
    else this.circle(x, y, d / 2, cls);
    return this.circle(x, y, hole / 2, 'hole');
  }

  /** A plain drilled hole with no copper. */
  hole(x, y, d = 6) {
    return this.circle(x, y, d / 2, 'hole hole-edge');
  }

  // ---- components, seen from above ------------------------------------------------

  /**
   * A small two-pad part (resistor, capacitor, LED, diode). Returns the pad centres.
   * kind: r, c, led, d.  rot: 0 lies along x, 90 stands along y.  body: false draws only the pads.
   */
  chip(x, y, { kind = 'r', rot = 0, len = 11, wid = 5.2, body = true, padCls = 'pad' } = {}) {
    const along = rot === 90 ? [0, 1] : [1, 0];
    const padLen = len * 0.32;
    const off = len / 2 - padLen / 2;
    const a = [x - along[0] * off, y - along[1] * off];
    const b = [x + along[0] * off, y + along[1] * off];
    const size = (l, wd) => (rot === 90 ? [wd, l] : [l, wd]);
    const [pw, ph] = size(padLen, wid + 0.8);
    this.pad(a[0], a[1], pw, ph, { cls: padCls }).pad(b[0], b[1], pw, ph, { cls: padCls });
    if (body) {
      const bodyLen = len * 0.86;
      const [bw, bh] = size(bodyLen, wid);
      this.rect(x - bw / 2, y - bh / 2, bw, bh, `body body-${kind}`, { r: 0.5 });
      const capLen = bodyLen * 0.2;
      const [cw, ch] = size(capLen, wid);
      const capOff = bodyLen / 2 - capLen / 2;
      for (const sign of [-1, 1]) {
        const cx = x + along[0] * capOff * sign;
        const cy = y + along[1] * capOff * sign;
        this.rect(cx - cw / 2, cy - ch / 2, cw, ch, 'lead');
      }
      if (kind === 'led' || kind === 'd') {
        // a bar marks the cathode end (the first pad)
        const [mw, mh] = size(0.9, wid);
        const mx = x - along[0] * bodyLen * 0.14;
        const my = y - along[1] * bodyLen * 0.14;
        this.rect(mx - mw / 2, my - mh / 2, mw, mh, kind === 'led' ? 'mark-g' : 'mark');
      }
    }
    return { a, b };
  }

  /**
   * A chip with legs on two sides (SOIC style), standing upright. Returns the pad
   * centres in pin order: 1 is top left, numbers run down the left side and back up the right.
   */
  soic(x, y, { pins = 8, pitch = 5, bodyW = 13, padW = 6, padH = 2.6, body = true, padCls = 'pad' } = {}) {
    const perSide = pins / 2;
    const span = (perSide - 1) * pitch;
    const reach = bodyW / 2 + padW / 2 + 0.6;
    const out = [];
    for (let i = 0; i < perSide; i++) out.push([x - reach, y - span / 2 + i * pitch]);
    for (let i = 0; i < perSide; i++) out.push([x + reach, y + span / 2 - i * pitch]);
    for (const [px, py] of out) this.pad(px, py, padW, padH, { r: 0.5, cls: padCls });
    if (body) {
      for (const [px, py] of out) {
        const inner = px < x ? px + padW / 2 - 1.5 : x + bodyW / 2 - 0.5;
        this.rect(inner, py - padH * 0.3, px < x ? x - bodyW / 2 - inner + 0.5 : px - padW / 2 + 1.5 - inner, padH * 0.6, 'lead');
      }
      const bodyH = span + pitch;
      this.rect(x - bodyW / 2, y - bodyH / 2, bodyW, bodyH, 'body', { r: 0.8 });
      this.circle(x - bodyW / 2 + 2.4, y - bodyH / 2 + 2.4, 0.9, 'mark');
    }
    return out;
  }

  /** A chip with pads on all four sides (QFN or QFP style). Returns the pad centres, pin 1 first. */
  quad(x, y, { perSide = 5, pitch = 3.2, size = 22, padL = 3.6, padW = 1.7, body = true, legs = false, padCls = 'pad' } = {}) {
    const span = (perSide - 1) * pitch;
    const reach = size / 2 + (legs ? padL / 2 + 0.4 : -padL / 2 + 0.9);
    const out = [];
    for (let i = 0; i < perSide; i++) out.push([x - reach, y - span / 2 + i * pitch, 0]);
    for (let i = 0; i < perSide; i++) out.push([x - span / 2 + i * pitch, y + reach, 1]);
    for (let i = 0; i < perSide; i++) out.push([x + reach, y + span / 2 - i * pitch, 0]);
    for (let i = 0; i < perSide; i++) out.push([x + span / 2 - i * pitch, y - reach, 1]);
    for (const [px, py, upright] of out) {
      if (upright) this.pad(px, py, padW, padL, { r: 0.4, cls: padCls });
      else this.pad(px, py, padL, padW, { r: 0.4, cls: padCls });
    }
    if (body) {
      const side = legs ? size : size - 1.2;
      this.rect(x - side / 2, y - side / 2, side, side, 'body', { r: 0.8 });
      this.circle(x - side / 2 + 2.6, y - side / 2 + 2.6, 0.9, 'mark');
    }
    return out.map(([px, py]) => [px, py]);
  }

  // ---- silkscreen -----------------------------------------------------------------

  silk(points, { w = 0.7, close = false } = {}) {
    const all = close ? [...points, points[0]] : points;
    return this.line(all, 'silk', { w });
  }

  silkText(x, y, text, { size = 4.2, anchor = 'middle' } = {}) {
    this._grow(x, y, size);
    return this._art(`<text class="silk-t" x="${n(x)}" y="${n(y)}" font-size="${n(size)}" text-anchor="${anchor}">${esc(text)}</text>`);
  }

  // ---- annotations ------------------------------------------------------------------

  /** Plain text. anchor: start, middle or end. */
  label(x, y, text, { anchor = 'start', size = 4.3, cls = 'lbl' } = {}) {
    const width = String(text).length * size * 0.5;
    const left = anchor === 'start' ? x : anchor === 'middle' ? x - width / 2 : x - width;
    if (left < 0.5 || left + width > W - 0.5 || y < size || y > H - 0.5) {
      this.problems.push(`label "${text}" leaves the canvas`);
    }
    return this._note(`<text class="${cls}" x="${n(x)}" y="${n(y)}" font-size="${n(size)}" text-anchor="${anchor}">${esc(text)}</text>`);
  }

  /** Text at (tx, ty) with a thin line to the thing it names at (px, py). */
  leader(tx, ty, px, py, text, { anchor = 'start', size = 4.3, cls = 'lbl' } = {}) {
    // the line starts just beside the text, level with the middle of the letters
    const startX = anchor === 'start' ? tx - 1.5 : anchor === 'end' ? tx + 1.5 : tx;
    const startY = anchor === 'middle' ? (py < ty ? ty - size : ty + 1.6) : ty - size * 0.33;
    const d = `M${n(startX)} ${n(startY)}L${n(px)} ${n(py)}`;
    this._note(`<path class="ld-h" d="${d}"/><path class="ld" d="${d}"/><circle class="ld-dot" cx="${n(px)}" cy="${n(py)}" r="0.9"/>`);
    return this.label(tx, ty, text, { anchor, size, cls });
  }

  /**
   * A dimension between two points, with the text beside it. The measuring line is moved
   * sideways by `off` so it does not cover the thing it measures. With no text, only the line is drawn.
   */
  dim(a, b, text, { off = 0, side = 1, size = 4.1 } = {}) {
    const [x1, y1] = a;
    const [x2, y2] = b;
    const length = Math.hypot(x2 - x1, y2 - y1) || 1;
    const nx = (-(y2 - y1) / length) * side;
    const ny = ((x2 - x1) / length) * side;
    const p1 = [x1 + nx * off, y1 + ny * off];
    const p2 = [x2 + nx * off, y2 + ny * off];
    const tick = 1.5;
    let d = `M${pts([p1, p2])}`;
    for (const [px, py] of [p1, p2]) d += `M${n(px - nx * tick)} ${n(py - ny * tick)}L${n(px + nx * tick)} ${n(py + ny * tick)}`;
    if (off) d += `M${pts([a, p1])}M${pts([b, p2])}`;
    this._note(`<path class="ld-h" d="${d}"/><path class="dm" d="${d}"/>`);
    if (!text) return this;
    const mx = (p1[0] + p2[0]) / 2;
    const my = (p1[1] + p2[1]) / 2;
    if (Math.abs(nx) > Math.abs(ny)) {
      return this.label(mx + nx * 2.2, my + size * 0.35, text, { anchor: nx > 0 ? 'start' : 'end', size });
    }
    return this.label(mx, my + (ny > 0 ? size + 1.2 : -2), text, { anchor: 'middle', size });
  }

  /** An arrow from a to b. */
  arrow(a, b, cls = 'arw') {
    const [x1, y1] = a;
    const [x2, y2] = b;
    const length = Math.hypot(x2 - x1, y2 - y1) || 1;
    const ux = (x2 - x1) / length;
    const uy = (y2 - y1) / length;
    const head = 2.6;
    const back = [x2 - ux * head, y2 - uy * head];
    const wing = head * 0.45;
    const tip = `M${n(x2)} ${n(y2)}L${n(back[0] - uy * wing)} ${n(back[1] + ux * wing)}L${n(back[0] + uy * wing)} ${n(back[1] - ux * wing)}Z`;
    return this._note(`<path class="${cls}" d="M${pts([a, back])}"/><path class="${cls}-head" d="${tip}"/>`);
  }

  /** A round tick or cross: 'ok' or 'no'. */
  badge(x, y, kind = 'ok') {
    const mark = kind === 'ok'
      ? `M${n(x - 1.7)} ${n(y + 0.1)}l1.2 1.3 2.3-2.7`
      : `M${n(x - 1.4)} ${n(y - 1.4)}l2.8 2.8M${n(x + 1.4)} ${n(y - 1.4)}l-2.8 2.8`;
    return this._note(`<circle class="bdg bdg-${kind}" cx="${n(x)}" cy="${n(y)}" r="3.2"/><path class="bdg-mark" d="${mark}"/>`);
  }

  /** A dashed ring or box that points something out. */
  ring(x, y, r, cls = 'hi') {
    return this._note(`<circle class="${cls}" cx="${n(x)}" cy="${n(y)}" r="${n(r)}"/>`);
  }

  frame(x, y, w, h, cls = 'hi', r = 1.5) {
    return this._note(`<rect class="${cls}" x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(r)}"/>`);
  }

  /** The line of small capitals under the picture. */
  caption(text) {
    return this.label(W / 2, H - 4, text.toUpperCase(), { anchor: 'middle', size: 3.7, cls: 'ttl' });
  }

  // ---- output -----------------------------------------------------------------------

  render() {
    // the small picture on a card shows only the art, cropped to a 4 : 3 box
    let [x0, y0, x1, y1] = this.box;
    if (!Number.isFinite(x0)) [x0, y0, x1, y1] = [0, 0, W, H];
    const pad = 5;
    let w = x1 - x0 + pad * 2;
    let h = y1 - y0 + pad * 2;
    if (w / h > 4 / 3) h = w * 0.75; else w = h / 0.75;
    const crop = [(x0 + x1) / 2 - w / 2, (y0 + y1) / 2 - h / 2, w, h].map(n).join(' ');
    return `<svg class="pic" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" data-art="${crop}" role="img">`
      + this.art.join('')
      + `<g class="ann">${this.notes.join('')}</g></svg>`;
  }
}

/** Points along a quarter circle, for rounded trace corners and curved outlines. */
export function arc(cx, cy, r, fromDeg, toDeg, steps = 10) {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const t = ((fromDeg + ((toDeg - fromDeg) * i) / steps) * Math.PI) / 180;
    out.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
  }
  return out;
}
