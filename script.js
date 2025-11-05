/* =========================================================
   INVITATION APP — with Guestbook (Apps Script / LocalStorage)
   Fitur: Foto Drive fallback, No auto-scroll, Musik, Confetti,
          Carousel, Countdown, Guestbook gratis
========================================================= */

/* ===== CONFIG ===== */
// Foto utama & galeri (opsional). Kosongkan jika belum siap.
const PHOTO_URL = "/photo/main.jpg"; // contoh Drive: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
const GALLERY_URLS = [
  "/photo/1.jpg",
  "/photo/2.jpg",
  "/photo/3.jpg",
  "/photo/4.jpg",
  "/photo/5.jpg",
  "/photo/6.jpg",
  "/photo/7.jpg",
  "/photo/8.jpg",
  "/photo/9.jpg",
]; // contoh: ['https://...','https://...']

// Waktu acara (WITA)
const EVENT_ISO = "2025-11-07T17:00:00+08:00";

// Guestbook endpoint (Google Apps Script Web App URL)
// Contoh: const GUESTBOOK_ENDPOINT = "https://script.google.com/macros/s/AKfycbx.../exec";
const GUESTBOOK_ENDPOINT = "https://script.google.com/macros/s/AKfycbzfrVfqCIripa7k0VRP9q3tCJ8myd6eX5CgWzQV9lFjl3woyhzLbxYV_m7bA-payslG/exec";
/* ===== Helpers: Query Param ===== */
const params = new URLSearchParams(location.search);
const guest = (params.get('to') || '').trim();
if (guest) document.title = `Invitation for ${guest} — Vathesya`;

/* ===== Helpers: Drive Image Fallback ===== */
function extractDriveId(url){
  if(!url) return "";
  let m = url.match(/\/d\/([^/]+)/); if(m && m[1]) return m[1];
  m = url.match(/[?&]id=([^&]+)/);   if(m && m[1]) return m[1];
  m = url.match(/\/uc\?[^#?]*id=([^&]+)/); if(m && m[1]) return m[1];
  return "";
}
function driveCandidates(url){
  const id = extractDriveId(url);
  if(!id) return [url];
  return [
    `https://drive.google.com/uc?export=view&id=${id}`,
    `https://drive.google.com/thumbnail?id=${id}&sz=w2000`,
    `https://drive.google.com/uc?export=download&id=${id}`
  ];
}
function setImgSrcWithFallback(imgEl, url){
  const list = driveCandidates(url);
  let i=0; const trySet=()=>{ if(i>=list.length) return; imgEl.src=list[i++]; };
  imgEl.onerror = trySet; trySet();
}

/* ===== Set Photo & Gallery ===== */
const mainPhotoEl = document.getElementById('mainPhoto');
if (mainPhotoEl){
  if (PHOTO_URL) setImgSrcWithFallback(mainPhotoEl, PHOTO_URL);
  else mainPhotoEl.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
}
const trackEl = document.getElementById('carouselTrack');
const slideEls = trackEl ? Array.from(trackEl.querySelectorAll('img.slide')) : [];
if (GALLERY_URLS.length && slideEls.length){
  for (let i=0; i<Math.min(slideEls.length, GALLERY_URLS.length); i++){
    setImgSrcWithFallback(slideEls[i], GALLERY_URLS[i]);
  }
}

/* ===== Carousel ===== */
(function(){
  if(!trackEl) return;
  const slides = trackEl.children;
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');
  const dots = document.querySelectorAll('.carousel-dots button');
  let index = 0;
  function update(){
    if(!slides.length) return;
    trackEl.style.transform = `translateX(-${index*100}%)`;
    dots.forEach((d,i)=>d.classList.toggle('active', i===index));
  }
  nextBtn?.addEventListener('click', ()=>{ index=(index+1)%slides.length; update(); });
  prevBtn?.addEventListener('click', ()=>{ index=(index-1+slides.length)%slides.length; update(); });
  dots.forEach((d,i)=> d.addEventListener('click', ()=>{ index=i; update(); }));
  update();
})();

/* ===== Countdown ===== */
const countdownEl = document.getElementById('countdown');
const eventDate = new Date(EVENT_ISO).getTime();
if (countdownEl){
  const tick=()=>{
    const now = Date.now(); const diff = eventDate - now;
    if (diff < 0){ countdownEl.innerHTML = `<div class="cd-box"><div class="num">0</div><div class="lbl">Days</div></div>`; return; }
    const d=Math.floor(diff/86400000), h=Math.floor((diff/3600000)%24), m=Math.floor((diff/60000)%60), s=Math.floor((diff/1000)%60);
    countdownEl.innerHTML = `
      <div class="cd-box"><div class="num">${d}</div><div class="lbl">Days</div></div>
      <div class="cd-box"><div class="num">${h}</div><div class="lbl">Hours</div></div>
      <div class="cd-box"><div class="num">${m}</div><div class="lbl">Minutes</div></div>
      <div class="cd-box"><div class="num">${s}</div><div class="lbl">Seconds</div></div>`;
  };
  tick(); setInterval(tick, 1000);
}

/* ===== Music Control ===== */
const audioEl = document.getElementById('bgAudio');
const musicBtn = document.getElementById('musicBtn');
function setBtnPlaying(on){ if(!musicBtn) return; musicBtn.classList.toggle('playing',on); const lbl=musicBtn.querySelector('.lbl'); if(lbl) lbl.textContent = on?'Pause music':'Play music'; musicBtn.setAttribute('aria-pressed', on?'true':'false'); }
async function tryPlay(){ if(!audioEl) return; try{ await audioEl.play(); setBtnPlaying(true); localStorage.setItem('musicOn','1'); }catch{} }
function pauseMusic(){ if(!audioEl) return; audioEl.pause(); setBtnPlaying(false); localStorage.setItem('musicOn','0'); }
musicBtn?.addEventListener('click', ()=>{ if(audioEl?.paused) tryPlay(); else pauseMusic(); });
addEventListener('pointerdown', ()=>{ if(localStorage.getItem('musicOn')!=='0' && audioEl?.paused) tryPlay(); }, {once:true});

/* ===== Confetti Canvas ===== */
const confettiCanvas = document.getElementById('confettiCanvas');
const ctx = confettiCanvas.getContext('2d');
function resizeCanvas(){ confettiCanvas.width = innerWidth; confettiCanvas.height = innerHeight; }
addEventListener('resize', resizeCanvas); resizeCanvas();
let confetti = [];
function spawnConfetti(n=80){ for(let i=0;i<n;i++){ confetti.push({x:Math.random()*confettiCanvas.width,y:-20-Math.random()*100,r:4+Math.random()*6,vy:1+Math.random()*2,vx:-1+Math.random()*2,rot:Math.random()*Math.PI,vr:-0.05+Math.random()*0.1}); } }
function drawConfetti(){ ctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height); confetti.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.rot+=p.vr; ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot); const c=["#ff7aa2","#ffd1dc","#f6dce7","#f2cbdd","#e8c8d8"]; ctx.fillStyle=c[(Math.random()*c.length)|0]; ctx.fillRect(-p.r,-p.r,p.r*2,p.r*2); ctx.restore(); }); confetti = confetti.filter(p=>p.y<confettiCanvas.height+20); requestAnimationFrame(drawConfetti); }
drawConfetti();
document.getElementById('openInviteBtn')?.addEventListener('click',(e)=>{ e.preventDefault(); if(audioEl?.paused) tryPlay(); spawnConfetti(120); });
spawnConfetti(70);

/* ===== Guestbook (Apps Script / LocalStorage) ===== */
const gbForm = document.getElementById('gbForm');
const gbList = document.getElementById('gbList');
const LS_KEY = 'guestbook_entries_v2';

function escapeHTML(s){ return String(s).replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m])); }
function renderOne(entry,{prepend=true}={}){
  const {name,from,msg,timestamp} = entry;
  const item = document.createElement('div'); item.className='gb-item';
  const when = timestamp ? new Date(timestamp).toLocaleString() : '';
  item.innerHTML = `
    <div class="gb-head">
      <div class="gb-name">${escapeHTML(name||'Anonim')}</div>
      <div class="gb-meta">${escapeHTML(when)}</div>
    </div>
    <p class="gb-msg">${escapeHTML(msg||'')}${from?`\n— ${escapeHTML(from)}`:''}</p>`;
  prepend ? gbList.prepend(item) : gbList.appendChild(item);
}

/* LocalStorage mode */
function lsLoad(){ try{return JSON.parse(localStorage.getItem(LS_KEY)||'[]')}catch{return[]} }
function lsSave(arr){ localStorage.setItem(LS_KEY, JSON.stringify(arr)); }
function lsInit(){ gbList.innerHTML=''; lsLoad().sort((a,b)=>(a.timestamp||0)-(b.timestamp||0)).forEach(e=>renderOne(e,{prepend:false})); }
function lsAdd(entry){ const arr=lsLoad(); arr.push(entry); lsSave(arr); renderOne(entry); }

/* Apps Script API dengan anti-cache */
async function apiList(){
  const url = `${GUESTBOOK_ENDPOINT}?t=${Date.now()}`;  // anti-cache
  const res = await fetch(url, { method:'GET', cache:'no-store' });
  if(!res.ok) throw new Error(`GET failed ${res.status}`);
  return res.json();
}
async function apiAdd(entry){
  // kirim sebagai text/plain supaya TIDAK ada preflight OPTIONS
  const url = `${GUESTBOOK_ENDPOINT}?t=${Date.now()}`;  // anti-cache
  const res = await fetch(url, {
    method: 'POST',
    // HAPUS headers
    body: JSON.stringify(entry),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`POST failed ${res.status}`);
  return res.json();
}


/* Init Guestbook */
(async function initGuestbook(){
  if (GUESTBOOK_ENDPOINT){
    try{
      gbList.setAttribute('aria-busy','true');
      const rows = await apiList(); // [{timestamp,name,from,msg}, ...]
      gbList.innerHTML = '';
      rows.forEach(r=> renderOne({ name:r.name, from:r.from, msg:r.msg, timestamp:r.timestamp||Date.now() }, {prepend:false}));
      gbList.setAttribute('aria-busy','false');

      gbForm?.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const name = document.getElementById('gbName').value.trim();
        const from = document.getElementById('gbFrom').value.trim();
        const msg  = document.getElementById('gbMsg').value.trim();
        if(!msg) return;
        try{
          await apiAdd({ name, from, msg });
          renderOne({ name, from, msg, timestamp: Date.now() }); // render optimistik
          gbForm.reset();
        }catch(err){
          console.error('Guestbook POST error:', err);
          alert('Gagal mengirim ucapan. Coba lagi.');
        }
      });
    }catch(err){
      console.error('Guestbook GET error, fallback LocalStorage:', err);
      lsInit();
      gbForm?.addEventListener('submit',(e)=>{
        e.preventDefault();
        const name = document.getElementById('gbName').value.trim();
        const from = document.getElementById('gbFrom').value.trim();
        const msg  = document.getElementById('gbMsg').value.trim();
        if(!msg) return;
        lsAdd({ name, from, msg, timestamp: Date.now() });
        gbForm.reset();
      });
    }
  } else {
    // Offline (demo)
    lsInit();
    gbForm?.addEventListener('submit',(e)=>{
      e.preventDefault();
      const name = document.getElementById('gbName').value.trim();
      const from = document.getElementById('gbFrom').value.trim();
      const msg  = document.getElementById('gbMsg').value.trim();
      if(!msg) return;
      lsAdd({ name, from, msg, timestamp: Date.now() });
      gbForm.reset();
    });
  }
})();