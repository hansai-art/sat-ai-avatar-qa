// Render the instructor's original classroom wording as safe HTML.
// Input is plain text copied from the course discussion: keep line breaks,
// link bare HTTPS URLs and allow `inline code`. Nothing else is interpreted.
const escapeHtml = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const urlPattern = /https:\/\/[^\s<>"'，。、；！？）)\]」]+/g;

const linkify = text => escapeHtml(text).replace(urlPattern, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);

function inline(line) {
  return line.split(/(`[^`\n]+`|\[[^\]\n]+\]\(https:\/\/[^\s)]+\))/).map(part => {
    if (/^`[^`\n]+`$/.test(part)) return `<code>${escapeHtml(part.slice(1, -1))}</code>`;
    const md = part.match(/^\[([^\]\n]+)\]\((https:\/\/[^\s)]+)\)$/);
    if (md) return `<a href="${escapeHtml(md[2])}" target="_blank" rel="noopener noreferrer">${escapeHtml(md[1])}</a>`;
    return linkify(part);
  }).join('');
}

export function renderPlainText(text) {
  return String(text).replace(/\r\n?/g, '\n').replace(/​/g, '').trim()
    .split(/\n[ \t]*\n+/)
    .map(block => `<p>${block.split('\n').map(line => inline(line.trimEnd())).join('<br>')}</p>`)
    .join('');
}

export function plainTextExcerpt(text, max = 160) {
  const flat = String(text).replace(/\s+/g, ' ').trim();
  const chars = [...flat];
  if (chars.length <= max) return flat;
  let cut = max;
  // 截斷點落在英文單字中間時，退回前一個空白，避免出現 choos… 這種半個字。
  if (/[A-Za-z0-9]/.test(chars[cut - 1]) && /[A-Za-z0-9]/.test(chars[cut])) {
    const space = chars.lastIndexOf(' ', cut - 1);
    if (space > max - 16) cut = space;
  }
  return chars.slice(0, cut).join('').trimEnd() + '…';
}
