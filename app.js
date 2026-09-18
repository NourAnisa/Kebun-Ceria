(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const key = 'kebun-ceria-v1';
  let saved = null;
  try { const data = JSON.parse(localStorage.getItem(key)); if (Garden.valid(data)) saved = data; } catch (_) { /* Storage may be unavailable. */ }
  let s = saved || Garden.fresh(), selected = 'carrot', playing = false, saveTimer = 0;
  const titles = ['Kebun Pemula', 'Kebun Berkembang', 'Pesanan Pasar'];
  const dialog = $('dialog');
  function persist() { try { localStorage.setItem(key, JSON.stringify(s)); saved = s; $('continue').hidden = false; } catch (_) { $('message').textContent += ' Penyimpanan browser tidak tersedia.'; } }
  function say(message) { $('message').textContent = message; }
  function render() {
    $('coins').textContent = s.coins; $('water').textContent = s.water;
    $('chapter').textContent = `LEVEL ${s.level} / 3`; $('levelTitle').textContent = titles[s.level - 1];
    $('seeds').innerHTML = Object.entries(Garden.crops).map(([id,c]) => `<button class="seed ${selected === id ? 'selected' : ''}" data-seed="${id}" aria-pressed="${selected === id}" ${c.level > s.level ? 'disabled' : ''}><span>${c.icon} ${c.name}</span><span>${c.level > s.level ? 'Level '+c.level : s.seeds[id]+' benih'}</span></button>`).join('');
    $('goals').innerHTML = Object.entries(Garden.goals[s.level - 1]).map(([id,n]) => `<div class="goal"><span>${Garden.crops[id].icon} ${Garden.crops[id].name}</span><b>${s.harvest[id]} / ${n} ${s.harvest[id] >= n ? '✓' : ''}</b></div>`).join('');
    $('next').disabled = !Garden.ready(s); $('next').textContent = s.level === 3 ? 'Selesaikan pesanan ✓' : 'Buka level berikutnya ↗';
    s.plots.forEach((p,i) => {
      const button = $('plot'+i); const c = p && Garden.crops[p.crop];
      const ripe = p && p.watered && p.remaining === 0;
      const label = !p ? 'Tanam '+Garden.crops[selected].name : !p.watered ? 'Siram '+c.name : ripe ? 'Panen '+c.name : c.name+' · '+Math.ceil(p.remaining)+' dtk';
      button.className = 'plot'+(p && p.watered ? ' watered' : '')+(ripe ? ' ripe' : '');
      button.setAttribute('aria-label', `Petak ${i+1}: ${label}`);
      button.innerHTML = `<span class="icon" aria-hidden="true">${!p ? '＋' : ripe ? c.icon : p.watered ? '🌿' : '🌱'}</span><span class="label">${label}</span>${p && p.watered && !ripe ? `<progress value="${c.seconds-p.remaining}" max="${c.seconds}" aria-label="Pertumbuhan"></progress>` : `<span class="sub">${!p ? 'Petak '+(i+1) : ripe ? '+'+c.sale+' koin' : '1 air'}</span>`}`;
    });
  }
  function action(type,value) { const message = Garden.act(s,type,value); say(message); render(); persist(); return message; }
  function open(html) { $('dialogContent').innerHTML = html; if (!dialog.open) dialog.showModal(); }
  function start(fresh) { if (fresh) s = Garden.fresh(); selected = 'carrot'; playing = true; $('welcome').hidden = true; $('game').hidden = false; $('menuButton').hidden = false; dialog.close(); render(); persist(); say('Pilih benih, lalu klik petak kosong. Tanaman hanya tumbuh setelah disiram.'); if(s.won) victory(); }
  function victory() { open('<p class="eyebrow">KEBUN TELADAN</p><h2>Panen kebahagiaan! 🌻</h2><p>Semua target selesai. Kamu sudah mempelajari siklus tanam, air, waktu tumbuh, panen, dan investasi benih.</p><button class="primary" id="again">Buat kebun baru</button>'); $('again').onclick = confirmNew; }
  function confirmNew() { if (!saved) return start(true); open('<h2>Mulai kebun baru?</h2><p>Progres Kebun Ceria yang tersimpan di browser ini akan diganti. Game lainnya tidak terpengaruh.</p><button class="primary" id="confirmNew">Ya, mulai dari awal</button> <button id="cancelNew">Batal</button>'); $('confirmNew').onclick = () => start(true); $('cancelNew').onclick = () => dialog.close(); }
  for (let i=0;i<9;i++) { const b = document.createElement('button'); b.id = 'plot'+i; b.onclick = () => action('plot',{index:i,crop:selected}); $('plots').appendChild(b); }
  $('seeds').onclick = e => { const b = e.target.closest('[data-seed]'); if(b && !b.disabled) { selected=b.dataset.seed; render(); } };
  $('start').onclick = confirmNew; $('continue').hidden = !saved; $('continue').onclick = () => start(false);
  $('guide').onclick = () => open('<p class="eyebrow">PANDUAN PENJAGA KEBUN</p><h2>Empat langkah sederhana</h2><ol><li>Pilih wortel dan klik petak kosong untuk menanam.</li><li>Klik tanaman untuk menyiram. Isi air gratis di sumur jika habis.</li><li>Tunggu 6–14 detik sesuai tanaman, lalu klik tanaman matang untuk panen. Hasil otomatis terjual.</li><li>Beli benih di toko. Penuhi target panen untuk membuka level selanjutnya.</li></ol><p>Pertumbuhan berhenti saat dialog, menu, atau tab lain dibuka. Progres tersimpan di browser ini. Tidak ada pertumbuhan saat game ditutup.</p>');
  function menu() { if (!playing) return; playing = false; persist(); $('welcome').hidden=false; $('game').hidden=true; $('menuButton').hidden=true; }
  $('menuButton').onclick=menu; $('brand').onclick=e=>{ e.preventDefault(); menu(); };
  $('refill').onclick=()=>action('refill'); $('close').onclick=()=>dialog.close();
  function shop(message='') { open(`<p class="eyebrow">TOKO PAK TANI</p><h2>Benih untuk esok hari</h2><p>Saldo: <b>${s.coins} koin</b>. Satu benih untuk satu petak.</p>${Object.entries(Garden.crops).map(([id,c])=>`<div class="shop-row"><div><p>${c.icon} ${c.name}</p><small>Tumbuh ${c.seconds} dtk · Jual ${c.sale} koin</small></div><button data-buy="${id}" ${c.level>s.level || s.coins<c.cost ? 'disabled' : ''}>${c.level>s.level ? 'Level '+c.level : 'Beli · '+c.cost+' koin'}</button></div>`).join('')}<p id="shopMessage" role="status"></p>`); $('shopMessage').textContent=message; }
  $('shopButton').onclick=()=>shop(); $('dialogContent').addEventListener('click',e=>{const b=e.target.closest('[data-buy]');if(b && !b.disabled) shop(action('buy',b.dataset.buy));});
  $('next').onclick=()=>{action('next'); if(s.won) victory();};
  let last=performance.now();
  setInterval(()=>{const now=performance.now(),dt=Math.min((now-last)/1000,.5);last=now;if(!playing || dialog.open || document.hidden || s.won) return;Garden.tick(s,dt);render();saveTimer+=dt;if(saveTimer>=2){persist();saveTimer=0;}},250);
  document.addEventListener('visibilitychange',()=>{last=performance.now();if(playing)persist();});
  window.addEventListener('pagehide',()=>{if(playing)persist();});
  render();
})();
