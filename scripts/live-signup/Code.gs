// AI 分身小教室直播報名：收學員 email 與提問，寫進試算表，再寄出直播連結。
// 部署方式：Apps Script 專案貼上這份程式，把 CONFIG 換成實際值，部署成網頁應用程式（以我的身分執行，所有人都能存取）。
// 直播連結只放在 Apps Script 專案裡，不要提交到網站原始碼。
const CONFIG = {
  SHEET_ID: '在 Apps Script 專案裡填',
  SHEET_NAME: '報名',
  LIVE_NAME: 'AI 分身小教室',
  LIVE_TITLE: 'AI 分身小教室｜開課三個月，AI 又變了哪些？',
  LIVE_TIME_TEXT: '11/25（三）晚上 7:30',
  LIVE_START: '20261125T193000',
  LIVE_END: '20261125T210000',
  LIVE_URL: '在 Apps Script 專案裡填',
  SENDER_NAME: '林思翰 Hans',
};

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return json({ ok: true, service: 'live-signup' });
}

// 第一次在編輯器執行這個函式，讓 Google 跳出授權畫面。
function authorize() {
  SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.SHEET_NAME).getLastRow();
  Logger.log('今天還能寄 ' + MailApp.getRemainingDailyQuota() + ' 封信');
}

function calendarUrl() {
  const q = {
    action: 'TEMPLATE',
    text: CONFIG.LIVE_TITLE,
    dates: CONFIG.LIVE_START + '/' + CONFIG.LIVE_END,
    ctz: 'Asia/Taipei',
    details: '直播連結：' + CONFIG.LIVE_URL,
    location: CONFIG.LIVE_URL,
  };
  return 'https://calendar.google.com/calendar/render?' + Object.keys(q).map(k => k + '=' + encodeURIComponent(q[k])).join('&');
}

// 避免儲存格被當成公式執行。
function cell(s) {
  s = String(s || '');
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function sendLiveMail(to, question) {
  const cal = calendarUrl();
  const subject = CONFIG.LIVE_NAME + '直播連結｜' + CONFIG.LIVE_TIME_TEXT;
  const lines = [
    '嗨，謝謝你報名「' + CONFIG.LIVE_NAME + '」！',
    '',
    '時間：' + CONFIG.LIVE_TIME_TEXT,
    '直播連結：' + CONFIG.LIVE_URL,
    '',
    '加入 Google 日曆：' + cal,
  ];
  if (question) lines.push('', '你留下的問題我們收到了，直播時會挑大家最常問的一起回答：', question);
  lines.push('', '直播開始前幾分鐘點上面的連結就能進入，到時候見！', '', '林思翰 Hans', '知識衛星《AI 分身｜打造替你工作的高效自動化團隊》');
  const p = 'margin:0 0 14px;line-height:1.7;';
  const html = '<div style="font-family:-apple-system,BlinkMacSystemFont,\'PingFang TC\',\'Noto Sans TC\',sans-serif;font-size:15px;color:#1f2328;max-width:560px;">'
    + '<p style="' + p + '">嗨，謝謝你報名「' + esc(CONFIG.LIVE_NAME) + '」！</p>'
    + '<div style="background:#f4f5f6;border-radius:12px;padding:16px 18px;margin:0 0 18px;">'
    + '<p style="margin:0 0 6px;font-weight:700;">' + esc(CONFIG.LIVE_TITLE) + '</p>'
    + '<p style="margin:0 0 6px;">時間：' + esc(CONFIG.LIVE_TIME_TEXT) + '</p>'
    + '<p style="margin:0;">直播連結：<a href="' + esc(CONFIG.LIVE_URL) + '" style="color:#004ad0;">' + esc(CONFIG.LIVE_URL) + '</a></p>'
    + '</div>'
    + '<p style="' + p + '"><a href="' + esc(cal) + '" style="display:inline-block;background:#005cff;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;font-weight:600;">加入 Google 日曆</a></p>'
    + (question ? '<p style="' + p + '">你留下的問題我們收到了，直播時會挑大家最常問的一起回答：</p><p style="' + p + 'background:#eaf1ff;border-radius:10px;padding:12px 14px;white-space:pre-wrap;">' + esc(question) + '</p>' : '')
    + '<p style="' + p + '">直播開始前幾分鐘點上面的連結就能進入，到時候見！</p>'
    + '<p style="margin:0;color:#686e78;line-height:1.7;">林思翰 Hans<br>知識衛星《AI 分身｜打造替你工作的高效自動化團隊》</p>'
    + '</div>';
  MailApp.sendEmail({ to: to, subject: subject, body: lines.join('\n'), htmlBody: html, name: CONFIG.SENDER_NAME });
}

function doPost(e) {
  let d = {};
  try { d = JSON.parse((e.postData && e.postData.contents) || '{}'); } catch (err) { return json({ ok: false, error: '資料格式不正確，請重新送出。' }); }
  // 隱藏欄位有值代表是機器人，假裝成功但不給連結。
  if (d.website) return json({ ok: true, sent: false });
  const email = String(d.email || '').trim().toLowerCase();
  const question = String(d.question || '').trim().slice(0, 2000);
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ ok: false, error: 'Email 格式不正確，請再檢查一次。' });

  const cache = CacheService.getScriptCache();
  const key = 'sent_' + Utilities.base64EncodeWebSafe(email);
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  let status = '已寄出';
  try {
    if (cache.get(key)) {
      status = '一分鐘內重複送出，未重寄';
    } else if (MailApp.getRemainingDailyQuota() < 1) {
      status = '今日寄信額度用完';
    } else {
      try { sendLiveMail(email, question); cache.put(key, '1', 60); } catch (err) { status = '寄信失敗：' + String(err.message || err).slice(0, 80); }
    }
    SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.SHEET_NAME).appendRow([new Date(), cell(email), cell(question), status]);
  } finally {
    lock.releaseLock();
  }
  return json({ ok: true, sent: status === '已寄出', title: CONFIG.LIVE_TITLE, timeText: CONFIG.LIVE_TIME_TEXT, liveUrl: CONFIG.LIVE_URL, calendarUrl: calendarUrl() });
}
