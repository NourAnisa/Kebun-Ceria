(function (root) {
  'use strict';
  const crops = {
    carrot: { name: 'Wortel', icon: '🥕', cost: 4, sale: 9, seconds: 6, level: 1 },
    tomato: { name: 'Tomat', icon: '🍅', cost: 7, sale: 15, seconds: 10, level: 2 },
    corn: { name: 'Jagung', icon: '🌽', cost: 10, sale: 22, seconds: 14, level: 3 }
  };
  const goals = [{ carrot: 3 }, { carrot: 5, tomato: 3 }, { carrot: 7, tomato: 5, corn: 3 }];
  function fresh() { return { version: 1, level: 1, coins: 30, water: 6, seeds: { carrot: 3, tomato: 0, corn: 0 }, harvest: { carrot: 0, tomato: 0, corn: 0 }, plots: Array.from({ length: 9 }, () => null), won: false }; }
  function valid(s) {
    const integer = n => Number.isSafeInteger(n) && n >= 0;
    return s && s.version === 1 && integer(s.level) && s.level >= 1 && s.level <= 3 && integer(s.coins) && integer(s.water) && s.water <= 6 && typeof s.won === 'boolean' &&
      ['seeds', 'harvest'].every(k => s[k] && Object.keys(crops).every(c => integer(s[k][c]))) &&
      Array.isArray(s.plots) && s.plots.length === 9 && s.plots.every(p => p === null || (p && crops[p.crop] && typeof p.watered === 'boolean' && Number.isFinite(p.remaining) && p.remaining >= 0 && p.remaining <= crops[p.crop].seconds));
  }
  function ready(s) { return Object.entries(goals[s.level - 1]).every(([c, n]) => s.harvest[c] >= n); }
  function act(s, type, value) {
    if (s.won) return 'Permainan selesai. Mulai kebun baru untuk bermain lagi.';
    if (type === 'refill') { s.water = 6; return 'Air terisi penuh. Pengisian di sumur gratis.'; }
    if (type === 'buy') {
      const c = crops[value];
      if (!c || c.level > s.level) return 'Benih belum terbuka.';
      if (s.coins < c.cost) return 'Koin belum cukup. Panen tanaman untuk mendapatkan koin.';
      s.coins -= c.cost; s.seeds[value]++; return `Membeli 1 benih ${c.name}.`;
    }
    if (type === 'next') {
      if (!ready(s)) return 'Target panen belum lengkap.';
      if (s.level === 3) { s.won = true; return 'Semua pesanan selesai! Kebunmu menjadi kebun teladan.'; }
      s.level++; s.coins += 15; s.water = 6;
      return `Level ${s.level} terbuka! Bonus 15 koin dan air penuh.`;
    }
    if (type === 'plot') {
      const { index, crop } = value || {};
      if (!Number.isInteger(index) || index < 0 || index >= s.plots.length) return 'Petak tidak valid.';
      const p = s.plots[index];
      if (!p) {
        if (!crops[crop] || crops[crop].level > s.level) return 'Tanaman belum terbuka.';
        if (s.seeds[crop] < 1) return 'Benih habis. Beli benih di toko.';
        s.seeds[crop]--; s.plots[index] = { crop, watered: false, remaining: crops[crop].seconds };
        return 'Benih tertanam. Klik petak sekali lagi untuk menyiram.';
      }
      if (!p.watered) {
        if (s.water < 1) return 'Air habis. Isi ulang di sumur.';
        s.water--; p.watered = true; return 'Tanaman disiram dan mulai tumbuh.';
      }
      if (p.remaining > 0) return `Masih tumbuh: ${Math.ceil(p.remaining)} detik lagi.`;
      const c = crops[p.crop]; s.harvest[p.crop]++; s.coins += c.sale; s.plots[index] = null;
      return `Panen ${c.name}! Terjual otomatis +${c.sale} koin.`;
    }
    return 'Aksi tidak dikenal.';
  }
  function tick(s, seconds) {
    if (s.won || !Number.isFinite(seconds) || seconds < 0) return;
    s.plots.forEach(p => { if (p && p.watered) p.remaining = Math.max(0, p.remaining - seconds); });
  }
  const api = { crops, goals, fresh, valid, ready, act, tick };
  if (typeof module !== 'undefined') module.exports = api;
  else root.Garden = api;
})(typeof window === 'undefined' ? {} : window);
