// Render the instructor's original classroom wording as safe HTML.
// Input is plain text copied from the course discussion: keep line breaks,
// link bare HTTPS URLs and allow `inline code`. Nothing else is interpreted.
const escapeHtml = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const urlPattern = /https:\/\/[^\s<>"'，。、；！？）)\]」]+/g;

function inline(line) {
  return line.split(/(`[^`\n]+`)/).map(part => {
    if (/^`[^`\n]+`$/.test(part)) return `<code>${escapeHtml(part.slice(1, -1))}</code>`;
    return escapeHtml(part).replace(urlPattern, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
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
  return [...flat].length > max ? [...flat].slice(0, max).join('') + '…' : flat;
}
