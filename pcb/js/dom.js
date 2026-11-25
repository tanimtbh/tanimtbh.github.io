// Small helpers for building page elements.

export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === false || value == null) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? '' : value);
  }
  node.append(...children.flat().filter((child) => child != null && child !== false));
  return node;
}

/** A Copy button. Give it the text, or a function that returns the text when pressed. */
export function copyButton(text, label = 'Copy') {
  const button = el('button', { type: 'button', class: 'copy', text: label });
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(typeof text === 'function' ? text() : text);
      button.textContent = 'Copied';
    } catch {
      button.textContent = 'Could not copy';
    }
    setTimeout(() => { button.textContent = label; }, 1600);
  });
  return button;
}

// ---- tscircuit code (TSX) with colours ------------------------------------------

// comment | string | tag | attribute name | number | keyword
const TSX = /(\/\/.*$|\{\/\*[\s\S]*?\*\/\})|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(<\/?[A-Za-z][\w.]*|\/?>)|\b([A-Za-z_]\w*)(?==)|(-?\b\d+(?:\.\d+)?\b)|\b(export|default|const|let|return|import|from|function|true|false|null)\b/gm;
const TOKEN_CLASS = ['', 'tok-c', 'tok-s', 'tok-g', 'tok-a', 'tok-n', 'tok-k'];

export function highlight(code) {
  const out = [];
  let last = 0;
  for (const match of code.matchAll(TSX)) {
    if (match.index > last) out.push(code.slice(last, match.index));
    const kind = match.findIndex((group, i) => i > 0 && group !== undefined);
    out.push(el('span', { class: TOKEN_CLASS[kind], text: match[0] }));
    last = match.index + match[0].length;
  }
  out.push(code.slice(last));
  return out;
}

// ---- phrases with values you can change ---------------------------------------

/** Text with {marked values}: the parts you are meant to change. */
export function fillIn(text) {
  return text.split(/(\{[^}]*\})/).filter(Boolean).map((piece) =>
    piece.startsWith('{') ? slot(piece.slice(1, -1)) : piece);
}

/** One marked value. Click it and type to put in your own. */
export function slot(value) {
  const node = el('span', { class: 'slot', role: 'textbox', spellcheck: 'false', title: 'Click to change', 'aria-label': 'Example value, click to change', text: value });
  try {
    node.contentEditable = 'plaintext-only';
  } catch {
    node.contentEditable = 'true'; // older browsers
  }
  // the first click selects the whole value, so typing replaces it
  node.addEventListener('focus', () => setTimeout(() => {
    if (document.activeElement === node) getSelection().selectAllChildren(node);
  }, 0));
  node.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === 'Escape') {
      event.preventDefault();
      node.blur();
    }
  });
  return node;
}
