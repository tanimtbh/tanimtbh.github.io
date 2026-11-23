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
