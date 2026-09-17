export function normalizeBase(value = '/') {
  if (typeof value !== 'string' || /[?#\\]/.test(value) || value.includes('..')) throw new Error('不合法的 BASE_PATH');
  return '/' + value.split('/').filter(Boolean).join('/') + (value.split('/').filter(Boolean).length ? '/' : '');
}
export function withBase(path = '/', base = '/') {
  base = normalizeBase(base);
  if (!path.startsWith('/') || path.startsWith('//') || /[\\]/.test(path) || /(^|\/)\.\.(\/|$)/.test(decodeURIComponent(path.split(/[?#]/)[0]))) throw new Error('站內路徑不合法');
  return base !== '/' && (path === base.slice(0, -1) || path.startsWith(base)) ? path : base + path.replace(/^\//, '');
}
export function safeHttps(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && ![...url.searchParams.keys()].some(k => /token|secret|password|api.?key|credential/i.test(k));
  } catch { return false; }
}
export function safeReturn(value, origin, base) {
  try {
    const url = new URL(value, origin);
    return url.origin === origin && [withBase('/', base),withBase('/questions/', base)].includes(url.pathname) ? url.pathname + url.search : withBase('/questions/', base);
  } catch { return withBase('/questions/', base); }
}
