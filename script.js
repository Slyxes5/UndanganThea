/* =======================
   CONFIG (edit bebas)
======================= */
const SHOW_GIFT = false; // placeholder kalau mau tambah gift registry

// Foto utama & galeri: boleh pakai link Google Drive share
const PHOTO_URL = "https://drive.google.com/file/d/1Td_pCeM6tyALIY8Onrlab2qWVIwQq-Ty/view?usp=sharing"; // contoh: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
const GALLERY_URLS = [
    "https://drive.google.com/file/d/1Td_pCeM6tyALIY8Onrlab2qWVIwQq-Ty/view?usp=sharing",
    "https://drive.google.com/file/d/1Oy3FEfK9JQ02GaLSa60OrlGU0aoly8oh/view?usp=drive_link",
    "https://drive.google.com/file/d/1HKMF1QN4GZ6QCxH5mOvKtf3qs6x5hjWF/view?usp=drive_link"
];

// RSVP target WhatsApp (angka tanpa +, contoh Indonesia 628xxxx)
const RSVP_PHONE = "6281350725166";

// Event time (WITA +08:00)
const EVENT_ISO = "2025-11-07T17:00:00+08:00";

/* =======================
   Utilities: Google Drive
======================= */
function driveToDirect(url){
  if(!url) return "";
  try{
    let m = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if(m && m[1]) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
    m = url.match(/[?&]id=([^&]+)/);
    if(m && m[1]) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
    return url;
  }catch{ return url; }
}
function driveToDownload(url){
  if(!url) return "";
  try{
    let m = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if(m && m[1]) return `https://drive.google.com/uc?export=download&id=${m[1]}`;
    m = url.match(/[?&]id=([^&]+)/);
    if(m && m[1]) return `https://drive.google.com/uc?export=download&id=${m[1]}`;
    return url;
  }catch{ return url; }
}

/* =======================
   Query Param: guest name
======================= */
const params = new URLSearchParams(window.location.search);
const guest = (params.get('to') || '').trim();

/* =======================
   Set Photo & Gallery
======================= */
const mainPhotoEl = document.getElementById('mainPhoto');
if (mainPhotoEl) {
  mainPhotoEl.src = PHOTO_URL ? driveToDirect(PHOTO_URL) : "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
}
const trackEl = document.getElementById('carouselTrack');
const slideEls = trackEl ? Array.from(trackEl.querySelectorAll('img.slide')) : [];
if (Array.isArray(GALLERY_URLS) && GALLERY_URLS.length && slideEls.length) {
  for (let i = 0; i < Math.min(slideEls.length, GALLERY_URLS.length); i++) {
    slideEls[i].src = driveToDirect(GALLERY_URLS[i]);
  }
}

/* =======================
   Carousel
======================= */
(function(){
  if(!trackEl) return;
  const slides = trackEl.children;
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');
  const dots = document.querySelectorAll('.carousel-dots button');
  let index = 0;

  function update(){
    if (!slides.length) return;
    trackEl.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d,i)=>d.classList.toggle('active', i===index));
  }
  nextBtn.addEventListener('click', ()=>{ index = (index + 1) % slides.length; update(); });
  prevBtn.addEventListener('click', ()=>{ index = (index - 1 + slides.length) % slides.length; update(); });
  dots.forEach((d,i)=> d.addEventListener('click', ()=>{ index=i; update(); }));
  update();
})();

/* =======================
   Countdown
======================= */
const eventDate = new Date(EVENT_ISO).getTime();
const countdownEl = document.getElementById('countdown');
if (countdownEl) {
  const tick = () => {
    const now = Date.now();
    const diff = eventDate - now;
    if (diff < 0) { countdownEl.innerHTML = `<div class="cd-box"><div class="num">0</div><div class="lbl">Days</div></div>`; return; }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff / 3600000) % 24);
    const m = Math.floor((diff / 60000) % 60);
    const s = Math.floor((diff / 1000) % 60);
    countdownEl.innerHTML = `
      <div class="cd-box"><div class="num">${d}</div><div class="lbl">Days</div></div>
      <div class="cd-box"><div class="num">${h}</div><div class="lbl">Hours</div></div>
      <div class="cd-box"><div class="num">${m}</div><div class="lbl">Minutes</div></div>
      <div class="cd-box"><div class="num">${s}</div><div class="lbl">Seconds</div></div>`;
  };
  tick(); setInterval(tick, 1000);
}

/* =======================
   Music control (autoplay-safe)
======================= */
const audioEl = document.getElementById('bgAudio');
const musicBtn = document.getElementById('musicBtn');

function setBtnPlaying(playing){
  musicBtn.classList.toggle('playing', playing);
  musicBtn.querySelector('.lbl').textContent = playing ? 'Pause music' : 'Play music';
  musicBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
}
async function tryPlay(){
  if (!audioEl) return;
  try{
    await audioEl.play();
    setBtnPlaying(true);
    localStorage.setItem('musicOn', '1');
  }catch{
    // blocked by browser; wait for user gesture
  }
}
function pauseMusic(){
  if (!audioEl) return;
  audioEl.pause();
  setBtnPlaying(false);
  localStorage.setItem('musicOn', '0');
}
musicBtn.addEventListener('click', ()=>{
  if (audioEl.paused) tryPlay(); else pauseMusic();
});
window.addEventListener('pointerdown', ()=>{
  // first interaction → try autoplay once
  if (localStorage.getItem('musicOn') !== '0' && audioEl.paused) tryPlay();
},{ once:true });

/* =======================
   Confetti
======================= */
const confettiCanvas = document.getElementById('confettiCanvas');
const ctx = confettiCanvas.getContext('2d');
function resizeCanvas(){
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas); resizeCanvas();

let confetti = [];
function spawnConfetti(count=80){
  for(let i=0;i<count;i++){
    confetti.push({
      x: Math.random()*confettiCanvas.width,
      y: -20 - Math.random()*100,
      r: 4 + Math.random()*6,
      vy: 1 + Math.random()*2,
      vx: -1 + Math.random()*2,
      rot: Math.random()*Math.PI,
      vr: (-0.05 + Math.random()*0.1),
    });
  }
}
function drawConfetti(){
  ctx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
  confetti.forEach(p=>{
    p.x += p.vx; p.y += p.vy; p.rot += p.vr;
    ctx.save();
    ctx.translate(p.x,p.y); ctx.rotate(p.rot);
    ctx.fillStyle = ['#ff7aa2','#ffd1dc','#f6dce7','#f2cbdd','#e8c8d8'][Math.floor(Math.random()*5)];
    ctx.fillRect(-p.r, -p.r, p.r*2, p.r*2);
    ctx.restore();
  });
  confetti = confetti.filter(p=> p.y < confettiCanvas.height + 20);
  requestAnimationFrame(drawConfetti);
}
drawConfetti();

// trigger confetti saat klik "Open Invitation"
document.getElementById('openInviteBtn')?.addEventListener('click', ()=> spawnConfetti(120));
spawnConfetti(70); // awal sedikit

/* =======================
   RSVP (WhatsApp + ICS)
======================= */
const rsvpForm = document.getElementById('rsvpForm');
rsvpForm?.addEventListener('submit',(e)=>{
  e.preventDefault();
  const name = document.getElementById('rsvpName').value.trim();
  const qty = document.getElementById('rsvpQty').value || '1';
  const msg = document.getElementById('rsvpMsg').value.trim();

  const line1 = `RSVP – Vathesya's Birthday`;
  const line2 = name ? `Name: ${name}` : '';
  const line3 = `Attendees: ${qty}`;
  const line4 = msg ? `Message: ${msg}` : '';
  const text = [line1,line2,line3,line4].filter(Boolean).join('%0A');

  const url = `https://wa.me/${RSVP_PHONE}?text=${text}`;
  window.open(url,'_blank','noopener');
});

// simple ICS for calendar
function buildICS(){
  const dtStart = new Date(EVENT_ISO);
  const dtEnd = new Date(new Date(EVENT_ISO).getTime() + 2*60*60*1000);
  const toICS = (d)=> d.toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z';
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vathesya Birthday//EN",
    "BEGIN:VEVENT",
    `DTSTART:${toICS(dtStart)}`,
    `DTEND:${toICS(dtEnd)}`,
    "SUMMARY:Vathesya Ester Politon — Birthday Celebration",
    "LOCATION:GMIM Marturia Roong, Tomohon",
    "DESCRIPTION:Let's celebrate together!",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
  return new Blob([ics], {type:"text/calendar"});
}
const addToCalendar = document.getElementById('addToCalendar');
if (addToCalendar){
  const blob = buildICS();
  addToCalendar.href = URL.createObjectURL(blob);
}

/* =======================
   Nice-to-have: greet by ?to=
======================= */
if (guest){
  document.title = `Invitation for ${guest} — Vathesya`;
}
