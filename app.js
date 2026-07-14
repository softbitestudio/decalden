import { createIcons, icons } from 'https://cdn.jsdelivr.net/npm/lucide@latest/+esm';

const STUDIO_EMAIL = 'softbitestudio@gmail.com';

/* ---------------- Vinyl catalog ---------------- */
const VINYLS = [
  { id:'glossy',  name:'Glossy Color',       desc:'Vivid, smooth, weatherproof',      icon:'droplet',        price:1.10, hasColor:true,  colors:['#e11d48','#f97316','#facc15','#22c55e','#0ea5e9','#6366f1','#111111','#ffffff'] },
  { id:'matte',   name:'Matte Color',        desc:'Flat, no-glare finish',            icon:'square',         price:1.25, hasColor:true,  colors:['#b91c1c','#ea580c','#ca8a04','#15803d','#1d4ed8','#4338ca','#111111','#f3f4f6'] },
  { id:'reflective', name:'Reflective',      desc:'Bounces light at night',           icon:'flashlight',     price:2.40, hasColor:true,  colors:['#e5e7eb','#fde047','#f97316','#ef4444','#38bdf8','#22c55e'] },
  { id:'glow',    name:'Glow-in-the-Dark',   desc:'Charges in light, glows at night', icon:'moon-star',      price:2.90, hasColor:false, colors:['#c7f9cc'] },
  { id:'holographic', name:'Holographic',    desc:'Rainbow shift chrome',             icon:'sparkles',       price:2.75, hasColor:false, colors:['#c4b5fd'] },
  { id:'chrome',  name:'Metallic Chrome',    desc:'Mirror-like metal look',           icon:'gem',            price:2.60, hasColor:true,  colors:['#d4d4d8','#fbbf24','#f43f5e','#60a5fa'] },
  { id:'clear',   name:'Clear Transfer',     desc:'Transparent background',           icon:'layers',         price:1.40, hasColor:true,  colors:['#111111','#ffffff','#ef4444','#3b82f6'] },
];

const SHAPES = [
  { id:'contour', name:'Contour cut', mult:1.0 },
  { id:'square',  name:'Square',      mult:0.92 },
  { id:'circle',  name:'Circle',      mult:0.96 },
  { id:'rounded', name:'Rounded',     mult:0.94 },
];

const SHIPPING = [
  { id:'free_us',      name:'Domestic (USA)',   detail:'Standard, no tracking', cost:0,  region:'USA',           icon:'home' },
  { id:'track_us',     name:'Domestic + Tracking', detail:'Tracked USA delivery', cost:5,  region:'USA',        icon:'map-pin' },
  { id:'free_intl',    name:'International',     detail:'Standard, no tracking', cost:0,  region:'International',  icon:'globe' },
  { id:'track_intl',   name:'International + Tracking', detail:'Tracked worldwide', cost:10, region:'International', icon:'plane' },
];

/* ---------------- State ---------------- */
const state = {
  file:null, imgName:null, imageEl:null,
  threshold:128, invert:false,
  vinyl:null, color:null,
  width:4, height:4, qty:1, shape:SHAPES[0],
  shipping:SHIPPING[0],
  address:{ name:'', line1:'', line2:'', city:'', state:'', zip:'', country:'' },
};

/* ---------------- Elements ---------------- */
const $ = (id) => document.getElementById(id);
const dropZone=$('dropZone'), fileInput=$('fileInput');
const mockCanvas=$('mockCanvas'), mockEmpty=$('mockEmpty'), ctx=mockCanvas.getContext('2d');

/* ---------------- Build vinyl cards ---------------- */
function buildVinyls(){
  $('vinylGrid').innerHTML = VINYLS.map(v=>`
    <button data-vinyl="${v.id}" class="vinyl-card text-left panel rounded-xl p-3.5 relative border" style="background:var(--panel)">
      <i data-lucide="check-circle-2" class="check absolute top-3 right-3 w-4 h-4 text-[var(--accent)] opacity-0"></i>
      <div class="w-9 h-9 rounded-lg bg-[var(--panel2)] grid place-items-center mb-2.5">
        <i data-lucide="${v.icon}" class="w-5 h-5 text-[var(--accent)]"></i>
      </div>
      <div class="font-semibold text-sm">${v.name}</div>
      <div class="text-[11px] text-[var(--sub)] mt-0.5">${v.desc}</div>
      <div class="text-[11px] font-mono text-[var(--sub)] mt-2">$${v.price.toFixed(2)}/in²</div>
    </button>`).join('');
  $('vinylGrid').querySelectorAll('[data-vinyl]').forEach(btn=>{
    btn.addEventListener('click',()=>selectVinyl(btn.dataset.vinyl));
  });
}

function selectVinyl(id){
  state.vinyl = VINYLS.find(v=>v.id===id);
  $('vinylGrid').querySelectorAll('[data-vinyl]').forEach(b=>b.classList.toggle('active', b.dataset.vinyl===id));
  // colors
  state.color = state.vinyl.colors[0];
  const row=$('colorRow'), sw=$('colorSwatches');
  if(state.vinyl.hasColor){
    row.classList.remove('hidden');
    sw.innerHTML = state.vinyl.colors.map(c=>`
      <button data-color="${c}" class="swatch w-9 h-9 rounded-full border-2" style="background:${c}; border-color:var(--line)"></button>`).join('');
    sw.querySelectorAll('[data-color]').forEach(b=>b.addEventListener('click',()=>{
      state.color=b.dataset.color;
      sw.querySelectorAll('[data-color]').forEach(x=>x.style.borderColor='var(--line)');
      b.style.borderColor='var(--accent)';
      render();
    }));
    sw.querySelector('[data-color]').style.borderColor='var(--accent)';
  } else {
    row.classList.add('hidden');
    state.color = state.vinyl.colors[0];
  }
  $('vinylTag').textContent = state.vinyl.name;
  render();
}

function buildShapes(){
  $('shapeRow').innerHTML = SHAPES.map((s,i)=>`
    <button data-shape="${s.id}" class="tag px-3 py-2 rounded-lg text-sm ${i===0?'!border-[var(--accent)] text-[var(--ink)]':'text-[var(--sub)]'}">${s.name}</button>`).join('');
  $('shapeRow').querySelectorAll('[data-shape]').forEach(b=>b.addEventListener('click',()=>{
    state.shape=SHAPES.find(s=>s.id===b.dataset.shape);
    $('shapeRow').querySelectorAll('[data-shape]').forEach(x=>{x.classList.remove('!border-[var(--accent)]');x.classList.add('text-[var(--sub)]');x.classList.remove('text-[var(--ink)]');});
    b.classList.add('!border-[var(--accent)]','text-[var(--ink)]'); b.classList.remove('text-[var(--sub)]');
    render();
  }));
}

function buildShipping(){
  $('shipRow').innerHTML = SHIPPING.map((s,i)=>`
    <button data-ship="${s.id}" class="ship-card text-left panel rounded-xl p-3.5 relative border ${i===0?'active':''}" style="background:var(--panel)">
      <i data-lucide="check-circle-2" class="scheck absolute top-3 right-3 w-4 h-4 text-[var(--accent)] ${i===0?'':'opacity-0'}"></i>
      <div class="flex items-center gap-2 mb-1">
        <i data-lucide="${s.icon}" class="w-4 h-4 text-[var(--accent)]"></i>
        <span class="font-semibold text-sm">${s.name}</span>
      </div>
      <div class="text-[11px] text-[var(--sub)]">${s.detail}</div>
      <div class="text-[11px] font-mono mt-1.5 ${s.cost===0?'text-[var(--accent)]':'text-[var(--sub)]'}">${s.cost===0?'Free':'+$'+s.cost.toFixed(2)}</div>
    </button>`).join('');
  $('shipRow').querySelectorAll('[data-ship]').forEach(btn=>btn.addEventListener('click',()=>{
    state.shipping=SHIPPING.find(s=>s.id===btn.dataset.ship);
    $('shipRow').querySelectorAll('[data-ship]').forEach(b=>{
      const on=b.dataset.ship===btn.dataset.ship;
      b.classList.toggle('active',on);
      b.querySelector('.scheck').classList.toggle('opacity-0',!on);
    });
    render();
  }));
}

const ADDR_FIELDS={ shName:'name', shLine1:'line1', shLine2:'line2', shCity:'city', shState:'state', shZip:'zip', shCountry:'country' };
function bindAddress(){
  Object.entries(ADDR_FIELDS).forEach(([id,key])=>{
    const el=$(id); if(!el) return;
    el.addEventListener('input',()=>{ state.address[key]=el.value.trim(); render(); });
  });
}

function addressComplete(){
  const a=state.address;
  return a.name && a.line1 && a.city && a.state && a.zip && a.country;
}

/* ---------------- Upload ---------------- */
dropZone.addEventListener('click',()=>fileInput.click());
['dragover','dragenter'].forEach(e=>dropZone.addEventListener(e,ev=>{ev.preventDefault();dropZone.classList.add('border-[var(--accent)]');}));
['dragleave','drop'].forEach(e=>dropZone.addEventListener(e,ev=>{ev.preventDefault();dropZone.classList.remove('border-[var(--accent)]');}));
dropZone.addEventListener('drop',ev=>{ const f=ev.dataTransfer.files[0]; if(f) loadFile(f); });
fileInput.addEventListener('change',e=>{ const f=e.target.files[0]; if(f) loadFile(f); });

function loadFile(f){
  if(!f.type.startsWith('image/')){ alert('Please choose an image file.'); return; }
  state.file=f; state.imgName=f.name;
  const reader=new FileReader();
  reader.onload=()=>{
    const img=new Image();
    img.onload=()=>{ state.imageEl=img; $('imgControls').classList.remove('hidden'); render(); if(!state.vinyl) selectVinyl('glossy'); };
    img.src=reader.result;
  };
  reader.readAsDataURL(f);
}

$('removeImg').addEventListener('click',()=>{
  state.imageEl=null; state.file=null; state.imgName=null;
  $('imgControls').classList.add('hidden');
  fileInput.value='';
  mockCanvas.classList.add('hidden'); mockEmpty.classList.remove('hidden');
  render();
});

/* ---------------- Sliders ---------------- */
$('threshold').addEventListener('input',e=>{ state.threshold=+e.target.value; $('threshVal').textContent=e.target.value; render(); });
$('invert').addEventListener('change',e=>{ state.invert=e.target.checked; render(); });
$('width').addEventListener('input',e=>{ state.width=+e.target.value; $('wVal').textContent=e.target.value; render(); });
$('height').addEventListener('input',e=>{ state.height=+e.target.value; $('hVal').textContent=e.target.value; render(); });
$('qty').addEventListener('input',e=>{ state.qty=+e.target.value; $('qVal').textContent=e.target.value; render(); });

/* ---------------- Render mockup + B&W conversion ---------------- */
function render(){
  drawMock();
  updatePrice();
  const ready = state.imageEl && state.vinyl && signedIn && addressComplete();
  $('purchaseBtn').disabled = !ready;
  const hint=$('purchaseHint');
  if(hint){
    let msg='';
    if(!signedIn) msg='Sign in to place your order.';
    else if(!state.imageEl) msg='Upload an image to continue.';
    else if(!state.vinyl) msg='Choose a vinyl type.';
    else if(!addressComplete()) msg='Enter your shipping address to continue.';
    hint.textContent = msg;
    hint.classList.toggle('hidden', !msg);
  }
}

function drawMock(){
  if(!state.imageEl){ mockCanvas.classList.add('hidden'); mockEmpty.classList.remove('hidden'); return; }
  mockEmpty.classList.add('hidden'); mockCanvas.classList.remove('hidden');
  const S=600; mockCanvas.width=S; mockCanvas.height=S;
  ctx.clearRect(0,0,S,S);

  // fit image into a temp canvas at content resolution
  const img=state.imageEl;
  const ratio=Math.min((S*0.78)/img.width,(S*0.78)/img.height);
  const w=img.width*ratio, h=img.height*ratio;
  const ox=(S-w)/2, oy=(S-h)/2;

  // draw to offscreen for pixel processing
  const off=document.createElement('canvas'); off.width=Math.max(1,Math.round(w)); off.height=Math.max(1,Math.round(h));
  const octx=off.getContext('2d'); octx.drawImage(img,0,0,off.width,off.height);
  const data=octx.getImageData(0,0,off.width,off.height);
  const d=data.data;
  const vinylColor = pickInkColor();
  const rgb=hexToRgb(vinylColor);
  for(let i=0;i<d.length;i+=4){
    const a=d[i+3];
    const lum=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];
    let on = lum < state.threshold; // dark => decal material
    if(state.invert) on=!on;
    if(a<40) on=false;
    if(on){ d[i]=rgb.r; d[i+1]=rgb.g; d[i+2]=rgb.b; d[i+3]=255; }
    else { d[i+3]=0; }
  }
  octx.putImageData(data,0,0);

  // shape clip / backing
  ctx.save();
  applyShapeBacking(ox,oy,w,h);
  ctx.restore();

  // finish sheen overlay based on vinyl
  ctx.drawImage(off,ox,oy,w,h);
  applyFinishEffect(off,ox,oy,w,h,vinylColor);
}

function pickInkColor(){
  if(!state.vinyl) return '#111111';
  if(state.vinyl.id==='glow') return '#7CFC00';
  if(state.vinyl.id==='holographic') return '#b98cff';
  if(state.vinyl.id==='reflective' && (!state.color)) return '#e5e7eb';
  return state.color || '#111111';
}

function applyShapeBacking(ox,oy,w,h){
  const pad=14;
  const x=ox-pad, y=oy-pad, bw=w+pad*2, bh=h+pad*2;
  ctx.fillStyle='rgba(255,255,255,0.06)';
  const sh=state.shape?.id;
  if(sh==='square'){ ctx.fillRect(x,y,bw,bh); }
  else if(sh==='circle'){ const r=Math.max(bw,bh)/2; ctx.beginPath(); ctx.arc(ox+w/2,oy+h/2,r,0,7); ctx.fill(); }
  else if(sh==='rounded'){ roundRect(x,y,bw,bh,22); ctx.fill(); }
  // contour: no backing box
}

function applyFinishEffect(off,ox,oy,w,h,color){
  if(!state.vinyl) return;
  const id=state.vinyl.id;
  ctx.save();
  // clip to decal shape (the drawn pixels)
  if(id==='glow'){
    ctx.globalCompositeOperation='lighter';
    ctx.shadowColor='#7CFC00'; ctx.shadowBlur=18; ctx.drawImage(off,ox,oy,w,h); ctx.shadowBlur=0;
  } else if(id==='reflective'){
    ctx.globalAlpha=0.25; ctx.globalCompositeOperation='screen';
    const g=ctx.createLinearGradient(ox,oy,ox+w,oy+h);
    g.addColorStop(0,'#ffffff'); g.addColorStop(0.5,'rgba(255,255,255,0)'); g.addColorStop(1,'#ffffff');
    ctx.fillStyle=g;
    // mask by decal
    ctx.globalCompositeOperation='source-atop';
    ctx.fillRect(ox,oy,w,h);
  } else if(id==='holographic'){
    ctx.globalAlpha=0.45; ctx.globalCompositeOperation='source-atop';
    const g=ctx.createLinearGradient(ox,oy,ox+w,oy+h);
    ['#ff2d55','#ffcc00','#34c759','#00c7be','#5856d6','#ff2d55'].forEach((c,i,a)=>g.addColorStop(i/(a.length-1),c));
    ctx.fillStyle=g; ctx.fillRect(ox,oy,w,h);
  } else if(id==='chrome'){
    ctx.globalAlpha=0.4; ctx.globalCompositeOperation='source-atop';
    const g=ctx.createLinearGradient(ox,oy,ox,oy+h);
    g.addColorStop(0,'#ffffff'); g.addColorStop(0.45,'rgba(255,255,255,0)'); g.addColorStop(0.55,'rgba(0,0,0,0.25)'); g.addColorStop(1,'#ffffff');
    ctx.fillStyle=g; ctx.fillRect(ox,oy,w,h);
  } else if(id==='glossy'){
    ctx.globalAlpha=0.18; ctx.globalCompositeOperation='source-atop';
    const g=ctx.createLinearGradient(ox,oy,ox,oy+h*0.5);
    g.addColorStop(0,'#ffffff'); g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g; ctx.fillRect(ox,oy,w,h*0.5);
  }
  ctx.restore();
}

function roundRect(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function hexToRgb(hex){ hex=hex.replace('#',''); if(hex.length===3) hex=hex.split('').map(c=>c+c).join(''); const n=parseInt(hex,16); return {r:(n>>16)&255,g:(n>>8)&255,b:n&255}; }

/* ---------------- Pricing ---------------- */
function computePrice(){
  if(!state.vinyl) return null;
  const area=state.width*state.height;
  const shapeMult=state.shape?.mult ?? 1;
  const setup=2.50;
  let unit = setup + area*state.vinyl.price*shapeMult;
  unit = Math.max(unit, 3.00);
  // volume discount
  let disc=0;
  const q=state.qty;
  if(q>=100) disc=0.30; else if(q>=50) disc=0.22; else if(q>=25) disc=0.15; else if(q>=10) disc=0.08;
  const unitDisc = unit*(1-disc);
  const subtotal = unitDisc*q;
  const ship = state.shipping ? state.shipping.cost : 0;
  const total = subtotal + ship;
  return { area, unit, unitDisc, disc, subtotal, ship, total, shapeMult };
}

function updatePrice(){
  const p=computePrice();
  if(!p){ $('total').textContent='$0.00'; return; }
  $('pBase').textContent = state.vinyl.name + ' · $'+state.vinyl.price.toFixed(2)+'/in²';
  $('pArea').textContent = `${state.width}"×${state.height}" (${p.area.toFixed(1)} in²)`;
  $('pQty').textContent = '×'+state.qty;
  $('pDisc').textContent = p.disc>0 ? '−'+Math.round(p.disc*100)+'%' : 'None';
  $('pSubtotal').textContent = '$'+p.subtotal.toFixed(2);
  $('pShip').textContent = p.ship>0 ? '$'+p.ship.toFixed(2) : 'Free';
  $('pShip').classList.toggle('text-[var(--accent)]', p.ship===0);
  $('unitPrice').textContent = '$'+p.unitDisc.toFixed(2)+' / decal · '+(state.shipping?state.shipping.name:'');
  $('total').textContent = '$'+p.total.toFixed(2);
}

/* ---------------- Auth ---------------- */
let signedIn=false, currentUser=null;
async function refreshAuth(){
  try{ signedIn = puter.auth.isSignedIn(); }catch(e){ signedIn=false; }
  if(signedIn){
    try{ currentUser=await puter.auth.getUser(); }catch(e){ currentUser=null; }
    $('authBtnText').textContent='Sign out';
    $('authStatus').textContent = currentUser? ('Signed in as '+currentUser.username) : 'Signed in';
    $('authStatus').classList.remove('hidden');
  } else {
    $('authBtnText').textContent='Sign in';
    $('authStatus').classList.add('hidden');
    currentUser=null;
  }
  render();
}
$('authBtn').addEventListener('click',async()=>{
  if(signedIn){ await puter.auth.signOut(); await refreshAuth(); }
  else { try{ await puter.auth.signIn(); }catch(e){} await refreshAuth(); }
});

/* ---------------- Purchase ---------------- */
const modal=$('orderModal');
function openModal(html){ $('modalBody').innerHTML=html; modal.classList.remove('hidden'); modal.classList.add('flex'); createIcons({icons}); }
function closeModal(){ modal.classList.add('hidden'); modal.classList.remove('flex'); }

$('purchaseBtn').addEventListener('click', onPurchase);

async function onPurchase(){
  if(!state.imageEl || !state.vinyl) return;
  if(!signedIn){ await puter.auth.signIn(); await refreshAuth(); if(!signedIn) return; }

  const p=computePrice();
  openModal(`
    <div class="text-center">
      <div class="w-14 h-14 rounded-full bg-[var(--panel2)] grid place-items-center mx-auto mb-4">
        <i data-lucide="loader-2" class="w-7 h-7 text-[var(--accent)] animate-spin"></i>
      </div>
      <h3 class="display font-semibold text-lg">Preparing your order…</h3>
      <p class="text-sm text-[var(--sub)] mt-1">Uploading your design &amp; building the order email.</p>
    </div>`);

  try{
    // 1. render a high-res B&W export of the decal on transparent bg
    const exportUrl = await buildExportPng();
    // 2. upload both mockup and processed art to cloud
    const stamp=Date.now();
    const dir='decal-orders';
    try{ await puter.fs.mkdir(dir,{createMissingParents:true}); }catch(e){}
    const mockBlob = await (await fetch(mockCanvas.toDataURL('image/png'))).blob();
    const artBlob = await (await fetch(exportUrl)).blob();
    const mockFile = await puter.fs.write(`${dir}/mockup-${stamp}.png`, mockBlob);
    const artFile  = await puter.fs.write(`${dir}/decal-bw-${stamp}.png`, artBlob);
    const mockLink = await puter.fs.getReadURL(mockFile.path);
    const artLink  = await puter.fs.getReadURL(artFile.path);

    const order = buildOrderSummary(p);
    const mailto = buildMailto(order, mockLink, artLink);

    showOrderReady(order, mockLink, artLink, mailto);
  }catch(err){
    openModal(`
      <div class="text-center">
        <div class="w-14 h-14 rounded-full bg-red-500/15 grid place-items-center mx-auto mb-4"><i data-lucide="alert-triangle" class="w-7 h-7 text-red-400"></i></div>
        <h3 class="display font-semibold text-lg">Something went wrong</h3>
        <p class="text-sm text-[var(--sub)] mt-1">${(err&&err.message)||'Please try again.'}</p>
        <button onclick="document.getElementById('orderModal').classList.add('hidden')" class="mt-5 px-4 py-2 rounded-lg border border-[var(--line)] text-sm">Close</button>
      </div>`);
    createIcons({icons});
  }
}

function buildExportPng(){
  return new Promise((resolve)=>{
    const img=state.imageEl;
    const scale=Math.min(1400/img.width,1400/img.height,4);
    const w=Math.round(img.width*scale), h=Math.round(img.height*scale);
    const c=document.createElement('canvas'); c.width=w; c.height=h;
    const cx=c.getContext('2d'); cx.drawImage(img,0,0,w,h);
    const dat=cx.getImageData(0,0,w,h); const d=dat.data;
    const rgb=hexToRgb(pickInkColor());
    for(let i=0;i<d.length;i+=4){
      const a=d[i+3]; const lum=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];
      let on=lum<state.threshold; if(state.invert) on=!on; if(a<40) on=false;
      if(on){ d[i]=rgb.r; d[i+1]=rgb.g; d[i+2]=rgb.b; d[i+3]=255; } else { d[i+3]=0; }
    }
    cx.putImageData(dat,0,0);
    resolve(c.toDataURL('image/png'));
  });
}

function buildOrderSummary(p){
  return {
    ref:'DF-'+Math.random().toString(36).slice(2,7).toUpperCase(),
    customer: currentUser? (currentUser.username) : 'Guest',
    email: currentUser? (currentUser.email||'n/a') : 'n/a',
    vinyl: state.vinyl.name,
    color: state.vinyl.hasColor ? state.color : '—',
    finish: state.vinyl.desc,
    sh