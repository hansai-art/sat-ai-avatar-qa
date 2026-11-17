// 相似問題：比對題目、關鍵字、摘要與學員原始提問的文字，再加上課程位置
// （同一小節、同一個安裝步驟、同樣用到的工具、編輯指定的關聯題）。
// 建置時算一次，問題頁右側欄、手機版清單與「其他同學也問過」都用同一份排序。

// 幾乎每題都會出現、無法分辨題目的詞，不拿來比對。
const STOP_BIGRAMS = new Set([
  '什麼','怎麼','麼做','可以','一定','還是','是否','需要','如何','課程','老師','請問','這個','那個','我們','自己','一個','問題',
  '如果','要怎','時候','就是','因為','所以','還要','還需','沒有','有沒','是不','不是','的話','之後','以後','現在','已經','應該',
  '可能','一直','直接','謝謝','感謝','想問','問一','一下','這樣','那我','我的','你的','他的','它的','有什','的時','時候','嗎？',
  '要用','用的','的是','是什','要不','不要','會不','不會','然後','還有','以及','或是','或者','這些','那些','哪些','哪裡','裡面',
]);
const STOP_WORDS = new Set(['ai','the','to','a','of','and','is','in','it','for','on','or','be','can','i','you']);

const han = /\p{Script=Han}+/gu;
const latin = /[a-z0-9][a-z0-9.+_-]*[a-z0-9+]|[a-z0-9]/g;

export function tokenize(text) {
  const counts = new Map();
  const add = token => counts.set(token, (counts.get(token) || 0) + 1);
  const normal = String(text || '').normalize('NFKC').toLowerCase();
  for (const word of normal.match(latin) || []) if (word.length > 1 && !STOP_WORDS.has(word)) add(word);
  for (const run of normal.match(han) || []) {
    const chars = [...run];
    for (let i = 0; i < chars.length - 1; i++) {
      const bigram = chars[i] + chars[i + 1];
      if (!STOP_BIGRAMS.has(bigram)) add(bigram);
    }
  }
  return counts;
}

function weightedTokens(item) {
  const total = new Map();
  const merge = (text, weight) => { for (const [token, n] of tokenize(text)) total.set(token, (total.get(token) || 0) + n * weight); };
  merge(item.title, 3);
  for (const keyword of item.keywords || []) merge(keyword, 2);
  merge(item.summary, 1);
  // 長篇原始留言只取開頭，避免一大段閒聊蓋過題目本身。
  merge([...String(item.question || '')].slice(0, 280).join(''), 1);
  return total;
}

const idfOf = (df, n) => Math.log(1 + n / df);

function documentFrequency(lists) {
  const df = new Map();
  for (const list of lists) for (const key of new Set(list)) df.set(key, (df.get(key) || 0) + 1);
  return df;
}

// 兩題共有的標籤，依標籤稀有程度加權後，除以較多的那一方，結果介於 0 到 1。
function sharedWeight(a, b, df, n) {
  const weight = key => idfOf(df.get(key) || 1, n);
  const sum = list => list.reduce((s, key) => s + weight(key), 0);
  const shared = a.filter(key => b.includes(key));
  if (!shared.length) return 0;
  return sum(shared) / Math.max(sum(a), sum(b));
}

export function buildSimilarity(items, {limit = 8, minScore = 0.06} = {}) {
  const n = items.length;
  const tokenLists = items.map(weightedTokens);
  const tokenDf = documentFrequency(tokenLists.map(map => [...map.keys()]));
  const vectors = tokenLists.map(map => {
    const vector = new Map();
    let norm = 0;
    for (const [token, tf] of map) {
      const df = tokenDf.get(token);
      if (df < 2) continue; // 只出現在一題的詞，對比對沒有幫助
      const value = tf * idfOf(df, n);
      vector.set(token, value);
      norm += value * value;
    }
    norm = Math.sqrt(norm) || 1;
    for (const [token, value] of vector) vector.set(token, value / norm);
    return vector;
  });
  const lessonDf = documentFrequency(items.map(item => item.lessonRefs || []));
  const toolDf = documentFrequency(items.map(item => (item.toolRefs || []).filter(id => id !== 'general')));
  const cosine = (a, b) => {
    const [small, large] = a.size < b.size ? [a, b] : [b, a];
    let dot = 0;
    for (const [token, value] of small) dot += value * (large.get(token) || 0);
    return dot;
  };
  const chapters = item => (item.chapterRefs || []).filter(id => id !== 'general');
  const result = new Map();
  items.forEach((item, i) => {
    const scored = [];
    items.forEach((other, j) => {
      if (i === j) return;
      const text = cosine(vectors[i], vectors[j]);
      const lesson = sharedWeight(item.lessonRefs || [], other.lessonRefs || [], lessonDf, n);
      const tool = sharedWeight((item.toolRefs || []).filter(id => id !== 'general'), (other.toolRefs || []).filter(id => id !== 'general'), toolDf, n);
      const a = chapters(item), b = chapters(other);
      const chapter = a.length && b.length ? a.filter(id => b.includes(id)).length / new Set([...a, ...b]).size : 0;
      const step = item.step != null && other.step != null ? (item.step === other.step ? 1 : Math.abs(item.step - other.step) === 1 ? 0.4 : 0) : 0;
      const type = item.type === other.type ? 1 : 0;
      // 編輯在本題指定的關聯題加最多分，對方指向本題則加一半。
      const related = (item.related || []).includes(other.id) ? 1 : (other.related || []).includes(item.id) ? 0.5 : 0;
      const score = 0.5 * text + 0.15 * lesson + 0.1 * tool + 0.05 * chapter + 0.1 * step + 0.03 * type + 0.2 * related;
      scored.push({id: other.id, score, order: other.order ?? 99999, anticipated: other.anticipated ? 1 : 0});
    });
    scored.sort((x, y) => x.anticipated - y.anticipated || y.score - x.score || x.order - y.order || x.id.localeCompare(y.id));
    let picked = scored.filter(entry => entry.score >= minScore).slice(0, limit);
    // 太冷門的題目也至少給三題，從同一章被問最多的題目補上。
    if (picked.length < 3) {
      const extra = scored.filter(entry => !picked.includes(entry)).slice(0, 3 - picked.length);
      picked = [...picked, ...extra];
    }
    result.set(item.id, picked.map(({id, score}) => ({id, score: Math.round(score * 1000) / 1000})));
  });
  return result;
}
