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

// מציג קטע אחד. onStart(ms) נקרא כשהקטע באמת התחיל (לתזמון אפקטים)
function showClip(clip, onStart) {
  ensureCss();
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
    const started = () => { box.classList.add('on'); soundFn(clip.snd); onStart?.(); };
    if (needImg()) {
      if (!imgFallback) { busy = false; resolve(false); return; }
      const im = new Image();
      im.alt = '';
      im.onload = () => { started(); setTimeout(end, clip.dur * 1000 - 300); };
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
    v.addEventListener('playing', started, { once: true });
    v.addEventListener('ended', end, { once: true });
    v.addEventListener('error', end, { once: true });
    setTimeout(end, 9000); // ביטחון: לא נשארת תקועה
    v.play().catch(end);
  });
}

// מציג את הקטע הבא בתור (הצצה רגילה בזמן המשחק)
export function dealerPeek({ which } = {}) {
  if (busy || document.hidden) return Promise.resolve(false);
  const clip = which != null ? CLIPS[which % CLIPS.length] : CLIPS[idx++ % CLIPS.length];
  return showClip(clip);
}

// ======================================================================
// סוף הערב: רק הקטעים האלה, עם כרטיס ברור "אלוף הערב" / "המקום האחרון" ואפקט על המסך
// ======================================================================
const END = {
  win: [
    { id: 'money', src: 'vid/end_money', cls: 'dl-wave', dur: 2.65, snd: 'e_money' },                                // גשם של שטרות
    { id: 'kiss', src: 'vid/end_kiss', cls: 'dl-wave', dur: 2.8, snd: 'e_kiss', fx: { type: 'lips', at: 1.3 } },     // נשיקה על המסך → שפתון
    { id: 'champ', src: 'vid/end_champ', cls: 'dl-duo', dur: 5.65, snd: 'e_champ', fx: { type: 'crack', at: 2.25 } }, // פקק שמפניה → סדק
  ],
  lose: [
    { id: 'wallet', src: 'vid/end_wallet', cls: 'dl-duo', dur: 3.25, snd: 'e_wallet', fx: { type: 'splat', at: 2.3 } }, // ארנק ריק → זבוב נמעך
    { id: 'tissue', src: 'vid/end_tissue', cls: 'dl-duo', dur: 2.75, snd: 'e_tissue' },                                // ממחטות
    { id: 'clap', src: 'vid/end_clap', cls: 'dl-duo', dur: 3.6, snd: 'e_clap' },                                       // מחיאות כפיים עוקצניות
  ],
};
// כל ערב קטע אחר: לא חוזרים על הקטע של הפעם הקודמת
function pickEnd(kind) {
  const list = END[kind];
  let last = null;
  try { last = localStorage.getItem('pb.end.' + kind); } catch {}
  const options = list.filter((c) => c.id !== last);
  const c = options[Math.floor(Math.random() * options.length)];
  try { localStorage.setItem('pb.end.' + kind, c.id); } catch {}
  return c;
}

const END_CSS = `
.dl-card{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 9vh);transform:translate(-50%,-30px) scale(.9);z-index:152;pointer-events:none;
  min-width:min(84vw,360px);max-width:92vw;padding:14px 22px 16px;border-radius:22px;text-align:center;opacity:0;transition:all .45s cubic-bezier(.2,1.3,.4,1);
  background:linear-gradient(180deg,rgba(24,30,26,.94),rgba(8,12,10,.94));box-shadow:0 18px 40px rgba(0,0,0,.6);font-family:Heebo,system-ui,sans-serif;direction:rtl}
.dl-card.on{opacity:1;transform:translate(-50%,0) scale(1)}
.dl-card .t{font-size:16px;font-weight:800;letter-spacing:.02em}
.dl-card .n{font-size:34px;font-weight:900;line-height:1.15;margin-top:2px;color:#F5F2EA}
.dl-card.win{border:2px solid #E3C04F}.dl-card.win .t{color:#E3C04F}
.dl-card.lose{border:2px solid #FF7D7D}.dl-card.lose .t{color:#FF9E9E}
.dl-fx{position:fixed;inset:0;z-index:153;pointer-events:none;transition:opacity .8s ease}
.dl-fx.out{opacity:0}
.dl-fx svg{position:absolute;inset:0;width:100%;height:100%}
.dl-shake{animation:dlshake .35s cubic-bezier(.36,.07,.19,.97)}
@keyframes dlshake{10%,90%{transform:translate(-2px,1px)}20%,80%{transform:translate(4px,-2px)}30%,50%,70%{transform:translate(-6px,3px)}40%,60%{transform:translate(6px,-3px)}}
.dl-pop{animation:dlpop .18s ease-out}
@keyframes dlpop{from{transform:scale(1.25);opacity:0}to{transform:none;opacity:1}}
`;
function ensureEndCss() {
  ensureCss();
  if (document.getElementById('dl-end-css')) return;
  const st = document.createElement('style'); st.id = 'dl-end-css'; st.textContent = END_CSS;
  document.head.appendChild(st);
}

// ---------- אפקטים על המסך (מצוירים, בלי קבצים) ----------
const rnd = (a, b) => a + Math.random() * (b - a);
function crackSvg(w, h) {
  const cx = w * 0.5, cy = h * 0.36;
  let d = '';
  const rays = 11;
  const ends = [];
  for (let i = 0; i < rays; i++) {
    const ang = (i / rays) * Math.PI * 2 + rnd(-0.18, 0.18);
    const len = rnd(0.35, 0.75) * Math.max(w, h);
    let x = cx, y = cy; d += `M${cx},${cy}`;
    const pts = [];
    for (let k = 1; k <= 6; k++) {
      const r = (len * k) / 6;
      x = cx + Math.cos(ang + rnd(-0.08, 0.08)) * r; y = cy + Math.sin(ang + rnd(-0.08, 0.08)) * r;
      d += `L${x.toFixed(1)},${y.toFixed(1)}`; pts.push([x, y]);
    }
    ends.push(pts);
  }
  // טבעות מחברות בין הקרניים
  [1, 2, 3].forEach((ring) => {
    for (let i = 0; i < rays; i++) {
      if (Math.random() < 0.35) continue;
      const a = ends[i][ring], b = ends[(i + 1) % rays][ring];
      d += `M${a[0].toFixed(1)},${a[1].toFixed(1)}L${((a[0] + b[0]) / 2 + rnd(-8, 8)).toFixed(1)},${((a[1] + b[1]) / 2 + rnd(-8, 8)).toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}`;
    }
  });
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <defs><radialGradient id="dlg" cx="${cx}" cy="${cy}" r="${w * 0.35}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
    <circle cx="${cx}" cy="${cy}" r="${w * 0.35}" fill="url(#dlg)"/>
    <path d="${d}" fill="none" stroke="rgba(0,0,0,.55)" stroke-width="3.2" stroke-linejoin="round" transform="translate(1.5,1.5)"/>
    <path d="${d}" fill="none" stroke="rgba(255,255,255,.92)" stroke-width="1.6" stroke-linejoin="round"/>
    <circle cx="${cx}" cy="${cy}" r="9" fill="rgba(255,255,255,.85)"/>
  </svg>`;
}
function splatSvg(w, h) {
  const cx = w * 0.5, cy = h * 0.44, R = Math.min(w, h) * 0.095;
  let blob = '';
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2, r = R * (i % 2 ? rnd(0.55, 0.8) : rnd(1, 1.6));
    blob += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`;
  }
  let drops = '';
  for (let i = 0; i < 9; i++) {
    const a = rnd(0, Math.PI * 2), r = R * rnd(1.8, 3.4);
    drops += `<circle cx="${(cx + Math.cos(a) * r).toFixed(1)}" cy="${(cy + Math.sin(a) * r).toFixed(1)}" r="${rnd(2, 6).toFixed(1)}" fill="#3b3a14" opacity=".85"/>`;
  }
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <path d="${blob}Z" fill="#2b2a10" opacity=".9"/>
    <path d="${blob}Z" fill="#9a9a2a" opacity=".35" transform="translate(${(cx * 0.05).toFixed(1)},${(cy * 0.05).toFixed(1)}) scale(.95)"/>
    <ellipse cx="${cx - R * 0.9}" cy="${cy - R * 1.1}" rx="${R * 0.9}" ry="${R * 0.35}" fill="rgba(210,220,230,.55)" transform="rotate(-35 ${cx - R * 0.9} ${cy - R * 1.1})"/>
    <ellipse cx="${cx + R * 1}" cy="${cy - R * 1}" rx="${R * 0.85}" ry="${R * 0.32}" fill="rgba(210,220,230,.5)" transform="rotate(30 ${cx + R} ${cy - R})"/>
    ${[...Array(6)].map((_, i) => { const a = -0.6 + i * 0.5; return `<path d="M${cx},${cy} q${Math.cos(a) * R * 1.4},${Math.sin(a) * R * 1.4} ${Math.cos(a) * R * 2.2},${Math.sin(a) * R * 2.6}" stroke="#1d1c0a" stroke-width="2" fill="none"/>`; }).join('')}
    ${drops}
  </svg>`;
}
function lipsSvg(w, h) {
  const cx = w * 0.5, cy = h * 0.58, sc = Math.min(w, h) / 230;
  // סימן נשיקה אמיתי: שתי שפתיים נפרדות, קשת "קופידון" למעלה, שוליים כהים יותר וקמטים דקים
  const up = 'M-62,2 C-52,-10 -36,-26 -18,-26 C-10,-26 -4,-20 0,-15 C4,-20 10,-26 18,-26 C36,-26 52,-10 62,2 C44,-2 26,-6 12,-4 C6,-3 2,-1 0,-1 C-2,-1 -6,-3 -12,-4 C-26,-6 -44,-2 -62,2Z';
  const low = 'M-58,8 C-40,6 -20,8 0,9 C20,8 40,6 58,8 C50,26 30,40 0,42 C-30,40 -50,26 -58,8Z';
  let creases = '';
  for (let x = -54; x <= 54; x += 5) {
    const yt = -Math.max(0, 22 - Math.abs(Math.abs(x) - 22) * 0.9);
    creases += `<path d="M${x},${(yt + 2).toFixed(1)} l${rnd(-1.5, 1.5).toFixed(1)},${rnd(8, 14).toFixed(1)}" stroke="#7a0016" stroke-width="1.3" opacity=".55"/>`;
    creases += `<path d="M${x},${(12 + Math.abs(x) * 0.05).toFixed(1)} l${rnd(-1.5, 1.5).toFixed(1)},${(rnd(16, 26) - Math.abs(x) * 0.22).toFixed(1)}" stroke="#7a0016" stroke-width="1.3" opacity=".55"/>`;
  }
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <defs><radialGradient id="dll" cx="0" cy="6" r="70" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#e01b3c"/><stop offset=".75" stop-color="#c0102c"/><stop offset="1" stop-color="#8e0820"/></radialGradient>
    <clipPath id="dlc"><path d="${up}"/><path d="${low}"/></clipPath></defs>
    <g transform="translate(${cx},${cy}) scale(${sc}) rotate(-7)" opacity=".9">
      <path d="${up}" fill="url(#dll)"/><path d="${low}" fill="url(#dll)"/>
      <g clip-path="url(#dlc)">${creases}</g>
      <path d="M-40,-12 C-30,-20 -20,-21 -12,-18" stroke="rgba(255,190,200,.45)" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M-30,24 C-15,32 15,32 30,24" stroke="rgba(255,190,200,.35)" stroke-width="4" fill="none" stroke-linecap="round"/>
    </g>
  </svg>`;
}
const FX_SOUND = { crack: 'fx_glass', splat: 'fx_splat', lips: null };
function screenFx(type) {
  ensureEndCss();
  const w = innerWidth, h = innerHeight;
  const el = document.createElement('div');
  el.className = 'dl-fx dl-pop';
  el.innerHTML = type === 'crack' ? crackSvg(w, h) : type === 'splat' ? splatSvg(w, h) : lipsSvg(w, h);
  document.body.appendChild(el);
  soundFn(FX_SOUND[type]);
  if (type !== 'lips') { document.body.classList.add('dl-shake'); setTimeout(() => document.body.classList.remove('dl-shake'), 400); }
  try { navigator.vibrate?.(type === 'lips' ? 30 : [40, 30, 60]); } catch {}
  setTimeout(() => el.classList.add('out'), type === 'lips' ? 2600 : 2000);
  setTimeout(() => el.remove(), type === 'lips' ? 3500 : 2900);
}

// kind: 'win' | 'lose'. מציג כרטיס עם השם, ואז את הקטע (ואפקט אם יש)
export async function dealerEnd(kind, { title, name, id }) {
  ensureEndCss();
  for (let i = 0; i < 40 && busy; i++) await new Promise((r) => setTimeout(r, 150)); // מחכים שהצצה קודמת תסתיים
  const clip = (id && END[kind].find((c) => c.id === id)) || pickEnd(kind);
  const card = document.createElement('div');
  card.className = `dl-card ${kind}`;
  card.innerHTML = `<div class="t"></div><div class="n"></div>`;
  card.querySelector('.t').textContent = title;
  card.querySelector('.n').textContent = name;
  document.body.appendChild(card);
  requestAnimationFrame(() => card.classList.add('on'));
  await new Promise((r) => setTimeout(r, 700));
  const timers = [];
  const ok = await showClip(clip, () => { if (clip.fx) timers.push(setTimeout(() => screenFx(clip.fx.type), clip.fx.at * 1000)); });
  card.classList.remove('on');
  setTimeout(() => card.remove(), 500);
  return ok;
}

// כל רצף סוף הערב: קודם המקום האחרון, ובסוף האלוף
export async function dealerEndSequence({ winner, loser }) {
  if (loser) await dealerEnd('lose', { title: '😢 המקום האחרון של הערב', name: loser });
  if (winner) { if (loser) await new Promise((r) => setTimeout(r, 500)); await dealerEnd('win', { title: '👑 אלוף הערב', name: winner }); }
}

// קטע מסוים לפי שם הקובץ (למשל לסוף הערב)
export function dealerPeekByName(name) {
  const k = CLIPS.findIndex((c) => c.src.endsWith('/' + name));
  return k < 0 ? Promise.resolve(false) : dealerPeek({ which: k });
}

export function dealerBusy() { return busy; }
