// הצצות של הדילריות: סרטונים עם רקע שקוף (WebM VP9 + אלפא) שעולים מעל המסך לכמה שניות.
// לא חוסמים לחיצות, ונעלמים לבד. משותף לאפליקציה ולדף הצפייה החי.
const CLIPS = [
  { src: 'vid/peek_brunette', cls: 'dl-peek', dur: 5.4, snd: 'dl_peek1' },   // מציצה מהפינה ושולחת נשיקה
  { src: 'vid/walk_blonde', cls: 'dl-walk', dur: 5.3, snd: 'dl_walk' },     // חוצה את המסך
  { src: 'vid/peek_brunette2', cls: 'dl-peek', dur: 4.35, snd: 'dl_peek2' },  // מציצה ושולחת נשיקה מהשפתיים
  { src: 'vid/wave_blonde', cls: 'dl-wave', dur: 4.1, snd: 'dl_wave' },     // מנופפת באמצע
  { src: 'vid/duo_1', cls: 'dl-duo', dur: 8.0, snd: 'dl_duo1' },            // שתיהן נכנסות, נשיקה, לוחשות וצוחקות
  { src: 'vid/duo_2', cls: 'dl-duo', dur: 3.75, snd: null },                // שתיהן קופצות מלמטה ומנופפות
  { src: 'vid/peek_brunette3', cls: 'dl-peek', dur: 2.95, snd: 'dl_peek3' }, // הברונטית מציצה וקורצת
  { src: 'vid/duo_3', cls: 'dl-duo', dur: 4.5, snd: 'dl_duo3' },            // שתיהן: הבלונדינית על הכתף, "Good luck!"
  { src: 'vid/kiss_blonde', cls: 'dl-wave', dur: 3.25, snd: 'dl_kiss' },     // הבלונדינית עולה מלמטה ושולחת נשיקה
  { src: 'vid/card_blonde', cls: 'dl-peek', dur: 3.7, snd: 'dl_card' },    // הבלונדינית זורקת קלף וקורצת
  { src: 'vid/clap_duo', cls: 'dl-duo', dur: 3.55, snd: 'dl_clap' },         // שתיהן מוחאות כפיים
  { src: 'vid/chips_brunette', cls: 'dl-peek', dur: 3.75, snd: 'dl_chips' }, // הברונטית סופרת צ'יפים
  { src: 'vid/knock_brunette', cls: 'dl-peek', dur: 3.65, snd: 'dl_knock' }, // הברונטית דופקת על המסך
  { src: 'vid/cards_blonde', cls: 'dl-duo', dur: 3.45, snd: 'dl_cards' },   // הבלונדינית מערבבת קלפים
  { src: 'vid/sides_kiss', cls: 'dl-sides', dur: 3.85, snd: 'dl_sides' },   // שתיהן מהצדדים, נשיקה ביחד
];
// סדר אקראי, כדי שכל טלפון יראה רצף אחר
for (let i = CLIPS.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [CLIPS[i], CLIPS[j]] = [CLIPS[j], CLIPS[i]]; }
// אנדרואיד/כרום: וידאו שקוף (WebM). אייפון/ספארי לא תומך בזה → WebP מונפש (אם קיים)
let useImg = null;
function needImg() {
  if (useImg == null) {
    const v = document.createElement('video');
    const ua = navigator.userAgent;
    const safari = /iPhone|iPad|iPod/.test(ua) || (/Safari/.test(ua) && !/Chrome|Chromium|Android/.test(ua));
    useImg = safari || !v.canPlayType('video/webm; codecs="vp9"');
  }
  return useImg;
}
let imgFallback = false;
export function allowImageFallback(on) { imgFallback = on; }
let idx = 0;
let busy = false;
let base = '';

export function setDealerBase(b) { base = b; }

// קול: באפליקציה מנגנים דרך מנוע הצלילים (אפשר לכבות בהגדרות). כאן ברירת מחדל: <audio> רגיל.
let soundFn = (name) => {
  if (!name) return;
  try { const a = new Audio(`${base}sfx/${name}.mp3`); a.volume = 1; a.play().catch(() => {}); } catch {}
};
export function setDealerSound(fn) { soundFn = (n) => { if (n) fn(n); }; }

const CSS = `
.dl{position:fixed;bottom:0;z-index:150;pointer-events:none;opacity:0;transition:opacity .35s ease;will-change:opacity}
.dl.on{opacity:1}
.dl video,.dl img{display:block;width:100%;height:100%;object-fit:contain}
.dl-peek{right:-14vw;height:min(64vh,140vw);aspect-ratio:1/1}
.dl-wave{left:50%;transform:translateX(-50%);height:min(66vh,140vw);aspect-ratio:1/1}
.dl-duo{left:50%;transform:translateX(-50%);height:min(50vh,100vw);aspect-ratio:1024/720}
.dl-sides{left:50%;transform:translateX(-50%);width:min(135vw,96vh);aspect-ratio:1152/720}
.dl-walk{left:50%;transform:translateX(-50%);height:min(84vh,180vw);aspect-ratio:16/9}
`;
function ensureCss() {
  if (document.getElementById('dl-css')) return;
  const st = document.createElement('style'); st.id = 'dl-css'; st.textContent = CSS;
  document.head.appendChild(st);
}

// מציג את הקטע הבא בתור. מחזיר Promise שמסתיים כשהיא יצאה.
export function dealerPeek({ which } = {}) {
  if (busy || document.hidden) return Promise.resolve(false);
  ensureCss();
  const clip = which != null ? CLIPS[which % CLIPS.length] : CLIPS[idx++ % CLIPS.length];
  busy = true;
  return new Promise((resolve) => {
    const box = document.createElement('div');
    box.className = `dl ${clip.cls}`;
    box.setAttribute('aria-hidden', 'true');
    let done = false;
    const end = () => {
      if (done) return; done = true;
      box.classList.remove('on');
      setTimeout(() => { box.remove(); busy = false; resolve(true); }, 380);
    };
    if (needImg()) {
      if (!imgFallback) { busy = false; resolve(false); return; }
      const im = new Image();
      im.alt = '';
      im.onload = () => { box.classList.add('on'); soundFn(clip.snd); setTimeout(end, clip.dur * 1000 - 300); };
      im.onerror = end;
      im.src = `${base}${clip.src}.webp?${Date.now()}`; // פרמטר כדי שהאנימציה תתחיל מההתחלה
      box.appendChild(im);
      document.body.appendChild(box);
      setTimeout(end, 9000);
      return;
    }
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
    v.src = `${base}${clip.src}.webm`;
    box.appendChild(v);
    document.body.appendChild(box);
    v.addEventListener('playing', () => { box.classList.add('on'); soundFn(clip.snd); }, { once: true });
    v.addEventListener('ended', end, { once: true });
    v.addEventListener('error', end, { once: true });
    setTimeout(end, 9000); // ביטחון: לא נשארת תקועה
    v.play().catch(end);
  });
}

// קטע מסוים לפי שם הקובץ (למשל לסוף הערב)
export function dealerPeekByName(name) {
  const k = CLIPS.findIndex((c) => c.src.endsWith('/' + name));
  return k < 0 ? Promise.resolve(false) : dealerPeek({ which: k });
}

export function dealerBusy() { return busy; }
