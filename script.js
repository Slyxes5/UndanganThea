/* ===========================
   CONFIG
=========================== */
// Foto
const PHOTO_URL = "./photo/main.jpg";
const GALLERY_URLS = [
  "./photo/1.jpg","./photo/2.jpg","./photo/3.jpg",
  "./photo/4.jpg","./photo/5.jpg","./photo/6.jpg",
  "./photo/7.jpg","./photo/8.jpg","./photo/9.jpg"
];

// Waktu acara (WITA)
const EVENT_ISO = "2025-11-07T17:00:00+08:00";

// Guestbook endpoint (biarkan; kita pikirkan lagi nanti)
const GUESTBOOK_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbzfrVfqCIripa7k0VRP9q3tCJ8myd6eX5CgWzQV9lFjl3woyhzLbxYV_m7bA-payslG/exec";

/* ===========================
   Helpers & title
=========================== */
const params = new URLSearchParams(location.search);
const guest = (params.get('to') || '').trim();
if (guest) document.title = `Invitation for ${guest} — Vathesya`;

function extractDriveId(url){ if(!url) return ""; let m=url.match(/\/d\/([^/]+)/)||url.match(/[?&]id=([^&]+)/)||url.match(/\/uc\?[^#?]*id=([^&]+)/); return m?m[1]:""; }
function driveCandidates(url){ const id = extractDriveId(url); if(!id) return [url]; return [
  `https://drive.google.com/uc?export=view&id=${id}`,
  `https://drive.google.com/thumbnail?id=${id}&sz=w2000`,
  `https://drive.google.com/uc?export=download&id=${id}`
];}
function setImgSrcWithFallback(imgEl, url){
  const list = driveCandidates(url);
  let i=0; const trySet=()=>{ if(i>=list.length) return; imgEl.src=list[i++]; };
  imgEl.onerror = trySet; trySet();
}

/* ===========================
   Main photo (curved frame)
=========================== */
const mainPhotoEl = document.getElementById('mainPhoto');
if (mainPhotoEl){
  mainPhotoEl.loading='lazy'; mainPhotoEl.decoding='async';
  setImgSrcWithFallback(mainPhotoEl, PHOTO_URL);
}

/* ===========================
   Gallery
=========================== */
const trackEl = document.getElementById('carouselTrack');
const dotsWrap = document.getElementById('carouselDots');
let slides = [], index = 0;

function buildGallery(){
  if (!trackEl || !Array.isArray(GALLERY_URLS) || !GALLERY_URLS.length) return;
  trackEl.innerHTML = ''; if (dotsWrap) dotsWrap.innerHTML = '';
  GALLERY_URLS.forEach((url, i)=>{
    const img = new Image();
    img.className='slide'; img.alt=`Gallery ${i+1}`; img.loading='lazy'; img.decoding='async';
    setImgSrcWithFallback(img, url); trackEl.appendChild(img);
    if (dotsWrap){ const dot=document.createElement('button'); dot.setAttribute('aria-label',`Slide ${i+1}`); dot.addEventListener('click',()=>{index=i;updateCarousel();}); dotsWrap.appendChild(dot); }
  });
  slides = Array.from(trackEl.children); index=0; updateCarousel();
}
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
function updateCarousel(){
  if(!slides.length) return;
  trackEl.style.transform = `translateX(-${index*100}%)`;
  if (dotsWrap){ Array.from(dotsWrap.children).forEach((d,i)=>d.classList.toggle('active',i===index)); }
}
nextBtn?.addEventListener('click', ()=>{ if(!slides.length) return; index=(index+1)%slides.length; updateCarousel(); });
prevBtn?.addEventListener('click', ()=>{ if(!slides.length) return; index=(index-1+slides.length)%slides.length; updateCarousel(); });
buildGallery();

/* Autoplay + hover pause + swipe */
let autoplayId=null;
function startAutoplay(){ stopAutoplay(); autoplayId=setInterval(()=>{ if(!slides.length) return; index=(index+1)%slides.length; updateCarousel(); },3500); }
function stopAutoplay(){ if(autoplayId) clearInterval(autoplayId); autoplayId=null; }
const carouselEl = document.querySelector('.carousel');
carouselEl?.addEventListener('mouseenter', stopAutoplay);
carouselEl?.addEventListener('mouseleave', startAutoplay);
let sx=0,dx=0;
carouselEl?.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;},{passive:true});
carouselEl?.addEventListener('touchmove', e=>{dx=e.touches[0].clientX-sx;},{passive:true});
carouselEl?.addEventListener('touchend', ()=>{ if(Math.abs(dx)>40){ index=(index+(dx<0?1:-1)+slides.length)%slides.length; updateCarousel(); } sx=dx=0;});
startAutoplay();

/* Lightbox */
const lb=document.getElementById('lightbox'), lbImg=document.getElementById('lightImg');
trackEl?.addEventListener('click', e=>{ const img=e.target.closest('img.slide'); if(!img) return; lbImg.src=img.currentSrc||img.src; lb.style.display='grid'; });
lb?.addEventListener('click', ()=>{ lb.style.display='none'; lbImg.src=''; });

/* ===========================
   Countdown
=========================== */
const countdownEl = document.getElementById('countdown');
const eventDate = new Date(EVENT_ISO).getTime();
if (countdownEl){
  const tick=()=>{ const now=Date.now(); const diff=eventDate-now;
    if (diff<0){ countdownEl.innerHTML=`<div class="cd-box"><div class="num">0</div><div class="lbl">Days</div></div>`; return; }
    const d=Math.floor(diff/86400000), h=Math.floor((diff/3600000)%24), m=Math.floor((diff/60000)%60), s=Math.floor((diff/1000)%60);
    countdownEl.innerHTML = `
      <div class="cd-box"><div class="num">${d}</div><div class="lbl">Days</div></div>
      <div class="cd-box"><div class="num">${h}</div><div class="lbl">Hours</div></div>
      <div class="cd-box"><div class="num">${m}</div><div class="lbl">Minutes</div></div>
      <div class="cd-box"><div class="num">${s}</div><div class="lbl">Seconds</div></div>`; };
  tick(); setInterval(tick, 1000);
}

/* ===========================
   Music & Confetti
=========================== */
const audioEl=document.getElementById('bgAudio'); const musicBtn=document.getElementById('musicBtn');
function setBtnPlaying(on){ if(!musicBtn) return; musicBtn.classList.toggle('playing',on); const lbl=musicBtn.querySelector('.lbl'); if(lbl) lbl.textContent=on?'Pause music':'Play music'; musicBtn.setAttribute('aria-pressed',on?'true':'false'); }
async function tryPlay(){ if(!audioEl) return; try{ await audioEl.play(); setBtnPlaying(true); localStorage.setItem('musicOn','1'); }catch{} }
function pauseMusic(){ if(!audioEl) return; audioEl.pause(); setBtnPlaying(false); localStorage.setItem('musicOn','0'); }
musicBtn?.addEventListener('click', ()=>{ if(audioEl?.paused) tryPlay(); else pauseMusic(); });
addEventListener('pointerdown', ()=>{ if(localStorage.getItem('musicOn')!=='0' && audioEl?.paused) tryPlay(); }, {once:true});

/* Confetti (sleep when hidden) */
const confettiCanvas=document.getElementById('confettiCanvas'); const ctx=confettiCanvas.getContext('2d');
function resizeCanvas(){ confettiCanvas.width=innerWidth; confettiCanvas.height=innerHeight; } addEventListener('resize',resizeCanvas); resizeCanvas();
let confetti=[]; function spawnConfetti(n=80){ for(let i=0;i<n;i++){ confetti.push({x:Math.random()*confettiCanvas.width,y:-20-Math.random()*100,r:4+Math.random()*6,vy:1+Math.random()*2,vx:-1+Math.random()*2,rot:Math.random()*Math.PI,vr:-0.05+Math.random()*0.1}); } }
function drawConfetti(){ if(document.hidden){ requestAnimationFrame(drawConfetti); return; }
  ctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
  confetti.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.rot+=p.vr; ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
    const c=["#ff7aa2","#ffd1dc","#f6dce7","#f2cbdd","#e8c8d8"]; ctx.fillStyle=c[(Math.random()*c.length)|0]; ctx.fillRect(-p.r,-p.r,p.r*2,p.r*2); ctx.restore();});
  confetti=confetti.filter(p=>p.y<confettiCanvas.height+20); requestAnimationFrame(drawConfetti); }
drawConfetti();

/* Open Invitation → confetti + auto-scroll (ke #details) */
const openBtn = document.getElementById('openInviteBtn');
function scrollToDetails(){
  const target = document.getElementById('details') || document.getElementById('photo');
  target?.scrollIntoView({ behavior: 'smooth' });
}
openBtn?.addEventListener('click', e=>{
  e.preventDefault();
  tryPlay();                 // coba nyalakan musik
  spawnConfetti(120);
  setTimeout(scrollToDetails, 600);
});

// ===== Autostart: 1 detik setelah page load =====
// Biarkan tetap di HERO (tanpa scroll otomatis ke details)
window.addEventListener('load', () => {
  setTimeout(() => {
    tryPlay();               // tetap coba nyalakan musik otomatis
    // scrollToDetails();    // ❌ dihapus agar tetap di hero
    // Optional kalau ingin "gerak halus" 1px agar terasa hidup:
    // window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 1000);
});


/* Retry kalau tab kembali aktif (mis. iOS Safari) */
document.addEventListener('visibilitychange', ()=>{
  if (!document.hidden && audioEl?.paused && localStorage.getItem('musicOn')!=='0') {
    tryPlay();
  }
});

/* Seed confetti awal */
spawnConfetti(70);

/* Add to Calendar (ICS) */
(function(){
  const btn=document.getElementById('icsBtn'); if(!btn) return;
  const start=new Date(EVENT_ISO); const end=new Date(start.getTime()+2*60*60*1000);
  const toICS=d=>d.toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
  const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Vathesya//Birthday//ID','BEGIN:VEVENT',
    `DTSTART:${toICS(start)}`,`DTEND:${toICS(end)}`,
    'SUMMARY:Sweet Seventeen Vathesya','LOCATION:Thea’s Home – Jl. Ahmad Yani, Kec. Tondano Barat','DESCRIPTION:See invite page for details.',
    'END:VEVENT','END:VCALENDAR'].join('\r\n');
  btn.href=URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));
})();

/* Reveal Thank You */
const faders=document.querySelectorAll('.fade-up');
const appear=new IntersectionObserver((entries)=>{ entries.forEach(entry=>{ if(entry.isIntersecting){ entry.target.classList.add('show'); } }); },{threshold:.2});
faders.forEach(f=>appear.observe(f));

/* ===========================
   Guestbook (disimpan; logic tetap)
=========================== */
const gbForm=document.getElementById('gbForm'); const gbList=document.getElementById('gbList'); const LS_KEY='guestbook_entries_v2';
function escapeHTML(s){ return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m])); }
function renderOne(entry,{prepend=true}={}){ const {name,from,msg,timestamp}=entry; const item=document.createElement('div'); item.className='gb-item';
  const when=timestamp?new Date(timestamp).toLocaleString():''; item.innerHTML=`<div class="gb-head"><div class="gb-name">${escapeHTML(name||'Anonim')}</div><div class="gb-meta">${escapeHTML(when)}</div></div><p class="gb-msg">${escapeHTML(msg||'')}${from?`\n— ${escapeHTML(from)}`:''}</p>`; prepend?gbList.prepend(item):gbList.appendChild(item); }
function lsLoad(){ try{return JSON.parse(localStorage.getItem(LS_KEY)||'[]')}catch{return[]} } function lsSave(arr){ localStorage.setItem(LS_KEY,JSON.stringify(arr)); }
function lsInit(){ gbList.innerHTML=''; lsLoad().sort((a,b)=>(a.timestamp||0)-(b.timestamp||0)).forEach(e=>renderOne(e,{prepend:false})); }
function lsAdd(entry){ const arr=lsLoad(); arr.push(entry); lsSave(arr); renderOne(entry); }
async function apiList(){ const url=`${GUESTBOOK_ENDPOINT}?t=${Date.now()}`; const res=await fetch(url,{method:'GET',cache:'no-store'}); if(!res.ok) throw new Error(`GET ${res.status}`); return res.json(); }
async function apiAdd(entry){ const url=`${GUESTBOOK_ENDPOINT}?t=${Date.now()}`; const form=new URLSearchParams(); form.set('name',entry.name||''); form.set('from',entry.from||''); form.set('msg',entry.msg||''); const res=await fetch(url,{method:'POST',body:form,cache:'no-store'}); if(!res.ok) throw new Error(`POST ${res.status}`); return res.json(); }

(async function initGuestbook(){
  const bindSubmit=(sender)=>{ gbForm?.addEventListener('submit',async(e)=>{ e.preventDefault();
    const name=document.getElementById('gbName').value.trim();
    const from=document.getElementById('gbFrom').value.trim();
    const msg =document.getElementById('gbMsg').value.trim();
    const trap=document.getElementById('gbTrap'); if(trap?.value) return;
    const last=+localStorage.getItem('gb_last')||0; if(Date.now()-last<20000){ alert('Tunggu sebentar sebelum kirim lagi ya.'); return; }
    if(!msg) return; localStorage.setItem('gb_last',Date.now());
    try{ await sender({name,from,msg}); renderOne({name,from,msg,timestamp:Date.now()}); gbForm.reset(); }
    catch(err){ console.error('Guestbook POST error:',err); alert('Gagal mengirim ucapan. Coba lagi.'); }
  });};
  if(GUESTBOOK_ENDPOINT){
    try{ gbList.setAttribute('aria-busy','true'); const rows=await apiList(); gbList.innerHTML=''; rows.forEach(r=>renderOne({name:r.name,from:r.from,msg:r.msg,timestamp:r.timestamp||Date.now()},{prepend:false})); gbList.setAttribute('aria-busy','false'); bindSubmit(apiAdd); }
    catch(err){ console.warn('Guestbook online gagal, fallback LocalStorage:',err); lsInit(); bindSubmit(lsAdd); }
  } else { lsInit(); bindSubmit(lsAdd); }
})();
