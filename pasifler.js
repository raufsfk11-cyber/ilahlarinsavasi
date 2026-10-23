/* MEZAT PASİFLER: her karakterin hikâyesinden gelen, savaşta devreye giren yeteneği.
   uygula(c) takım kopyalarını değiştirir ve kısa bir açıklama döner; null = bu savaşta tetiklenmedi.
   c = { k, benim, rakip, benimIndex, rakipIndex, fiyat } (fiyat: mezattaki alış fiyatı, bilinmiyorsa null) */
function statEkle(k, degisim) {
  Object.entries(degisim).forEach(([s, f]) => { k[s] = Math.max(0, (Number(k[s]) || 0) + f); });
  return Object.entries(degisim).map(([s, f]) => (f > 0 ? '+' : '') + f + ' ' + STAT_ADLARI[s]).join(', ');
}
const statSirala = (takim, stat, yon) => [...takim].sort((a, b) => yon * ((Number(b[stat]) || 0) - (Number(a[stat]) || 0)))[0];
const takimaEkle = (takim, degisim) => { takim.forEach(k => statEkle(k, degisim)); return 'takımdaki herkes ' + statEkle({}, degisim); };

const KARAKTER_PASIFLERI = {
  'EGE': { ad: 'CANLI KALKAN', aciklama: 'Tank cüssesiyle takımı korur: takımdaki herkese +8 SAVUNMA.',
    uygula: c => takimaEkle(c.benim, { savunma: 8 }) },
  'RAUF': { ad: 'KUMAR BARONU', aciklama: 'Savaş öncesi kupon yapar: %50 tutar (takıma +8 GÜÇ), %50 yatar (takıma −4 GÜÇ).',
    uygula: c => Math.random() < .5 ? 'kupon tuttu! ' + takimaEkle(c.benim, { guc: 8 }) : 'kupon yattı… ' + takimaEkle(c.benim, { guc: -4 }) },
  'CEM': { ad: 'VELİAHT', aciklama: 'Takımında Ayhan Keleş varsa tüm takım +6 ZEKA, yoksa kendisi +15 ZEKA.',
    uygula: c => takimdaVar(c.benim, 'AYHAN KELEŞ') ? 'hükümdar yanında: ' + takimaEkle(c.benim, { zeka: 6 }) : 'CEM ' + statEkle(c.k, { zeka: 15 }) },
  'FARE': { ad: 'SADIK ASKER', aciklama: 'Takımında Cem varsa onun uğruna canını verir: +25 GÜÇ.',
    uygula: c => takimdaVar(c.benim, 'CEM') ? 'Cem için savaşıyor: FARE ' + statEkle(c.k, { guc: 25 }) : null },
  'ARDA': { ad: 'AM CANAVARI', aciklama: 'Rakipteki her kadın düşkününü rakip görür, kafalarını karıştırır: her biri −10 HIZ.',
    uygula: c => { const hedef = c.rakip.filter(k => etiketVar(k, 'kadin')); if (!hedef.length) return null; hedef.forEach(k => statEkle(k, { hiz: -10 })); return hedef.map(k => k.isim).join(', ') + ' −10 HIZ'; } },
  'AHMET ŞAFAK': { ad: 'BELEŞ AHMET', aciklama: 'Bedavaya gelirse mutlu olur: tüm statlar +15. ₺5 ve üstüne alınırsa küser: tüm statlar −10.',
    uygula: c => c.fiyat === 0 ? 'bedavaya geldi, keyfi yerinde: AHMET ' + statEkle(c.k, { guc: 15, savunma: 15, hiz: 15, zeka: 15 })
      : c.fiyat >= 5 ? `₺${c.fiyat} ödendi, küstü: AHMET ` + statEkle(c.k, { guc: -10, savunma: -10, hiz: -10, zeka: -10 }) : null },
  'AYHAN KELEŞ': { ad: 'AİLE REİSİ', aciklama: 'Takımında ailesinden olan her karakter için +12 SAVUNMA.',
    uygula: c => { const n = c.benim.filter(d => d !== c.k && iliskiBul(c.k.id, d.id)?.tur === 'aile').length; return n ? `${n} aile ferdi yanında: AYHAN ` + statEkle(c.k, { savunma: 12 * n }) : null; } },
  'GÖKHAN GÜNAY': { ad: 'MANİPÜLATÖR', aciklama: 'Rakipteki en düşük ZEKA\'lı karakteri parmağında oynatır: −20 GÜÇ.',
    uygula: c => { const h = statSirala(c.rakip, 'zeka', -1); return h ? h.isim + ' manipüle edildi: ' + statEkle(h, { guc: -20 }) : null; } },
  'ÖZGÜR ÇETİNER': { ad: 'SİNYAL KESİCİ', aciklama: 'Vodafone sahibi: rakipteki en hızlı karakterin sinyalini keser, −20 HIZ.',
    uygula: c => { const h = statSirala(c.rakip, 'hiz', 1); return h ? h.isim + ' çekmiyor: ' + statEkle(h, { hiz: -20 }) : null; } },
  'HAKAN KELEŞ': { ad: 'DOLANDIRICI DEHA', aciklama: 'Rakibin artan parasının yarısını çalar: o kadar GÜÇ rakipten düşer, kendi takımına eklenir.',
    uygula: c => {
      const x = Math.floor((typeof oyuncular !== 'undefined' ? oyuncular[c.rakipIndex].para : 0) * (typeof PARA_GUC_BONUSU === 'number' ? PARA_GUC_BONUSU : 1) / 2);
      if (!x) return null;
      c.rakip.forEach(k => statEkle(k, { guc: -x }));
      return `rakipten ₺${x} çaldı: rakip herkes −${x} GÜÇ, ` + takimaEkle(c.benim, { guc: x });
    } },
  'YUSUF KARGIOĞLU': { ad: 'HALAY BAŞI', aciklama: 'Halay coşkusu: takımdaki herkese +6 HIZ.',
    uygula: c => takimaEkle(c.benim, { hiz: 6 }) },
  'YİĞİTHAN': { ad: 'ALEMCİ', aciklama: 'Takımdaki her alkol bağımlısı (kendisi dahil) için +10 GÜÇ.',
    uygula: c => { const n = c.benim.filter(k => etiketVar(k, 'alkol')).length; return n ? `${n} alemci masada: YİĞİTHAN ` + statEkle(c.k, { guc: 10 * n }) : null; } },
  'METİN ŞAFAK': { ad: 'UÇAN TEKME', aciklama: '%40 ihtimalle rakibin en güçlü karakterine efsane uçan tekmeyi atar: −35 GÜÇ.',
    uygula: c => { const h = statSirala(c.rakip, 'guc', 1); if (!h) return null; return Math.random() < .4 ? 'TEKME İSABET! ' + h.isim + ' ' + statEkle(h, { guc: -35 }) : 'tekme ıskaladı'; } },
  'RAUF ŞAFAK DÜŞMANI': { ad: 'ŞAFAK DÜŞMANI', aciklama: 'Rakipteki her Şafak\'a kin kusar: her biri −15 SAVUNMA.',
    uygula: c => { const h = c.rakip.filter(k => String(k.isim).toLocaleUpperCase('tr-TR').includes('ŞAFAK')); if (!h.length) return null; h.forEach(k => statEkle(k, { savunma: -15 })); return h.map(k => k.isim).join(', ') + ' −15 SAVUNMA'; } },
  'ÖMER ŞAFAK': { ad: 'HAFTADA 3 İŞ', aciklama: 'Her savaşa başka bir işten gelir: rastgele bir statına +30.',
    uygula: c => { const s = ['guc', 'savunma', 'hiz', 'zeka'][Math.floor(Math.random() * 4)]; return 'yeni işinden geldi: ÖMER ' + statEkle(c.k, { [s]: 30 }); } }
};
const pasifAl = k => KARAKTER_PASIFLERI[String(k?.isim || '').toLocaleUpperCase('tr-TR')] || null;

// İki takımın pasiflerini sırayla uygular; her takım için tetiklenen yeteneklerin listesini döner.
function pasifleriUygula(takimlar) {
  return takimlar.map((benim, i) => benim.map(k => {
    const p = pasifAl(k);
    if (!p) return null;
    const fiyat = (typeof transferler !== 'undefined' ? transferler.find(t => t.oyuncu === i && t.k.id === k.id) : null)?.fiyat ?? null;
    const sonuc = p.uygula({ k, benim, rakip: takimlar[1 - i], benimIndex: i, rakipIndex: 1 - i, fiyat });
    return sonuc ? { karakter: k.isim, ad: p.ad, metin: sonuc } : null;
  }).filter(Boolean));
}

function karakterPasifiniGoster(k) {
  const alan = document.getElementById('karakterPasif');
  if (!alan) return;
  const p = pasifAl(k);
  alan.replaceChildren();
  alan.classList.toggle('gizli', !p);
  if (!p) return;
  const b = document.createElement('strong'), a = document.createElement('span');
  b.textContent = '⚡ ' + p.ad;
  a.textContent = p.aciklama;
  alan.append(b, a);
}
