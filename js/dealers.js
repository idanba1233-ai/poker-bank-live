// הצצות של הדילריות: סרטונים עם רקע שקוף (WebM VP9 + אלפא) שעולים מעל המסך לכמה שניות.
// לא חוסמים לחיצות, ונעלמים לבד. משותף לאפליקציה ולדף הצפייה החי.
const CLIPS = [
  { src: 'vid/peek_brunette', cls: 'dl-peek', dur: 5.4, snd: 'dl_peek1' },   // מציצה מהפינה ושולחת נשיקה
  { src: 'vid/walk_blonde', cls: 'dl-walk', dur: 5.3, snd: 'dl_walk' },     // חוצה את המסך
  { src: 'vid/peek_brunette2', cls: 'dl-peek', dur: 3.5, snd: 'dl_peek2' },  // מציצה ושולחת נשיקה מהשפתיים
  { src: 'vid/wave_blonde', cls: 'dl-wave', dur: 3.3, snd: 'dl_wave' },     // מנופפת באמצע
];
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
let idx = Math.floor(Math.random() * CLIPS.length);
let busy = false;
let base = '';

export function setDealerBase(b) { base = b; }

// קול: באפליקציה מנגנים דרך מנוע הצלילים (אפשר לכבות בהגדרות). כאן ברירת מחדל: <audio> רגיל.
let soundFn = (name) => {
  try { const a = new Audio(`${base}sfx/${name}.mp3`); a.volume = 1; a.play().catch(() => {}); } catch {}
};
export function setDealerSound(fn) { soundFn = fn; }

const CSS = `
.dl{position:fixed;bottom:0;z-index:150;pointer-events:none;opacity:0;transition:opacity .35s ease;will-change:opacity}
.dl.on{opacity:1}
.dl video,.dl img{display:block;width:100%;height:100%;object-fit:contain}
.dl-peek{right:-14vw;height:min(64vh,140vw);aspect-ratio:1/1}
.dl-wave{left:50%;transform:translateX(-50%);height:min(66vh,140vw);aspect-ratio:1/1}
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

export function dealerBusy() { return busy; }
