// 直播報名頁設定。直播連結不放在網站裡，學員送出 email 後才由 Apps Script 回傳並寄出。
// Apps Script 原始碼在 scripts/live-signup/Code.gs，部署成網頁應用程式後把網址填在這裡。
export const LIVE = {
  name: 'AI 分身小教室',
  title: '開課三個月，AI 又變了哪些？',
  timeText: '11/30（一）晚上 7:30',
  format: 'Google Meet 線上直播',
  endpoint: 'https://script.google.com/macros/s/AKfycbwbYX4Lo3szKIVDIcu5HIeoW97zfFOGX_Pz5eWOTFvHPoOmIuiBKLURDrcHdbHZTIMI/exec',
  agenda: [
    ['開課三個月以來的 AI 變化', '哪些工具、功能和做法跟當初錄課時不一樣了'],
    ['課程內容的更新重點', '課程裡的步驟遇到新版本時，可以怎麼調整'],
    ['思翰老師的 AI 分身近期應用', '分享自己最近怎麼用 AI 分身工作'],
    ['討論區常見問題', '挑出大家最常問的問題，現場一起解答'],
  ],
};
