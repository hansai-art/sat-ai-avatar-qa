// Prefer actual error lines over screenshot chrome. Always show the selection
// for review; OCR is transcription, never a diagnosis.
export function extractSearchText(text){
  const lines=text.split(/[\r\n]+/).map(s=>s.trim()).filter(Boolean);
  const errors=lines.filter(s=>/\b(?:error|failed|exception|429|401|403|500|502|503)\b|錯誤|失敗|缺少|無法|沒.{0,3}回應/i.test(s));
  const chosen=(errors.length?errors:lines).join(' ').replace(/\s+/g,' ').trim();
  // Dense screenshots often mix toolbar labels with repeated errors. For a
  // long transcript, an explicit HTTP code is more useful than the first 200
  // characters. Do not guess codes from arbitrary three-digit numbers.
  const codes=[...new Set([...chosen.matchAll(/\bHTTP\s*([45]\d{2})\b/gi)].map(m=>m[1]))];
  if([...chosen].length>160&&codes.length===1)return `HTTP ${codes[0]}`;
  return [...chosen].slice(0,200).join('');
}
