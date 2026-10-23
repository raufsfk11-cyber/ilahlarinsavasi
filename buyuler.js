/* MEZAT BÜYÜLER: her oyunda 4 büyüden 2'si rastgele seçilir.
   Bir büyü, ilgili etikete sahip daha çok karakteri olan takıma geçer.
   Sahip takımın etiketli karakterleri statı +20 alır, rakipteki etiketliler −20 yer.
   Eşitlikte büyü dengede kalır ve kimseyi etkilemez. */
const BUYULER = {
  viski:  { ad: 'VİSKİ',       simge: '🥃', etiket: 'alkol',  etiketAdi: 'Alkol bağımlısı', stat: 'guc',     gorsel: 'buyu-gorselleri/viski' },
  kadin:  { ad: 'KADIN',       simge: '💋', etiket: 'kadin',  etiketAdi: 'Kadın düşkünü',   stat: 'hiz',     gorsel: 'buyu-gorselleri/kadin' },
  futbol: { ad: 'FUTBOL MAÇI', simge: '⚽', etiket: 'iddia',  etiketAdi: 'İddia bağımlısı', stat: 'zeka',    gorsel: 'buyu-gorselleri/futbol' },
  gurbet: { ad: 'GURBET',      simge: '✈️', etiket: 'gurbet', etiketAdi: 'Gurbetçi',        stat: 'savunma', gorsel: 'buyu-gorselleri/gurbet' }
};
// Büyüyle ilgisi olan ama sahibine göre değişmeyen özel zaaflar.
const BUYU_ZAAFLARI = { 'kadin-korkusu': { buyu: 'kadin', etiketAdi: 'Kadınlardan çekinir' } };
const BUYU_ETKISI = 20, BUYU_SAYISI = 2;
const STAT_ADLARI = { guc: 'GÜÇ', savunma: 'SAVUNMA', hiz: 'HIZ', zeka: 'ZEKA' };
const GORSEL_UZANTILARI = ['png', 'jpg', 'jpeg', 'webp'];
let aktifBuyuler = [];

function buyuleriSec() {
  const anahtarlar = Object.keys(BUYULER);
  for (let i = anahtarlar.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [anahtarlar[i], anahtarlar[j]] = [anahtarlar[j], anahtarlar[i]]; }
  return anahtarlar.slice(0, BUYU_SAYISI);
}
const etiketVar = (k, etiket) => Array.isArray(k.etiketler) && k.etiketler.includes(etiket);
const buyuSayisi = (takim, id) => takim.filter(k => etiketVar(k, BUYULER[id].etiket)).length;

// 0 veya 1: büyünün sahibi oyuncu. -1: dengede.
function buyuSahibi(id, takimlar) {
  const a = buyuSayisi(takimlar[0], id), b = buyuSayisi(takimlar[1], id);
  return a === b ? -1 : a > b ? 0 : 1;
}

// Takımın büyüler uygulanmış kopyası ve olay listesi. Asıl karakter kayıtları değişmez.
function buyuluTakim(index, takimlar) {
  const olaylar = [];
  const takim = takimlar[index].map(k => ({ ...k }));
  aktifBuyuler.forEach(id => {
    const b = BUYULER[id], sahip = buyuSahibi(id, takimlar);
    takim.forEach(k => {
      let fark = 0;
      if (sahip !== -1 && etiketVar(k, b.etiket)) fark = sahip === index ? BUYU_ETKISI : -BUYU_ETKISI;
      Object.entries(BUYU_ZAAFLARI).forEach(([etiket, z]) => { if (z.buyu === id && etiketVar(k, etiket)) fark -= BUYU_ETKISI; });
      if (!fark) return;
      k[b.stat] = Math.max(0, (Number(k[b.stat]) || 0) + fark);
      olaylar.push({ metin: `${b.simge} ${b.ad}: ${k.isim} ${fark > 0 ? '+' : ''}${fark} ${STAT_ADLARI[b.stat]}`, puan: fark });
    });
  });
  return { takim, olaylar };
}
const takimlarAl = () => (typeof oyuncular !== 'undefined' ? oyuncular : []).map(o => o.takim);

function buyuOzetiMetni() {
  const t = takimlarAl();
  if (!aktifBuyuler.length || t.length !== 2) return '';
  return aktifBuyuler.map(id => {
    const b = BUYULER[id], s = buyuSahibi(id, t);
    return `${b.simge} ${b.ad} → ${s === -1 ? 'dengede' : oyuncular[s].isim}`;
  }).join('  •  ');
}

// Görsel yoksa sırayla uzantıları dener, en sonda emojiye düşer.
// Bulunan adres (veya yokluğu) hatırlanır; her teklifte tekrar istek atılmaz.
const gorselAdresleri = new Map();
function buyuGorseli(id, sinif) {
  const b = BUYULER[id], kutu = document.createElement('div');
  kutu.className = sinif;
  const bilinen = gorselAdresleri.get(id);
  if (bilinen === null) { kutu.textContent = b.simge; return kutu; }
  let i = 0;
  const img = document.createElement('img');
  img.alt = b.ad;
  img.onload = () => gorselAdresleri.set(id, img.src);
  img.onerror = () => {
    if (!bilinen && ++i < GORSEL_UZANTILARI.length) { img.src = b.gorsel + '.' + GORSEL_UZANTILARI[i]; return; }
    gorselAdresleri.set(id, null); img.remove(); kutu.textContent = b.simge;
  };
  img.src = bilinen || b.gorsel + '.' + GORSEL_UZANTILARI[0];
  kutu.append(img);
  return kutu;
}

function buyuAlaniniGuncelle() {
  const alan = document.getElementById('buyuAlani');
  if (!alan || typeof oyuncular === 'undefined' || oyuncular.length !== 2) return;
  alan.replaceChildren();
  const t = takimlarAl(), k = typeof aktifKarakter !== 'undefined' ? aktifKarakter : null;
  aktifBuyuler.forEach(id => {
    const b = BUYULER[id], s = buyuSahibi(id, t);
    const kart = document.createElement('div');
    kart.className = 'buyu-kart' + (k && etiketVar(k, b.etiket) ? ' etkiler' : '');
    const yazi = document.createElement('div');
    const ad = document.createElement('strong'), etki = document.createElement('small'), durum = document.createElement('small');
    ad.textContent = b.simge + ' ' + b.ad;
    etki.textContent = `${b.etiketAdi}: sahibine +${BUYU_ETKISI}, rakibe −${BUYU_ETKISI} ${STAT_ADLARI[b.stat]}`;
    durum.textContent = `${oyuncular[0].isim} ${buyuSayisi(t[0], id)} – ${buyuSayisi(t[1], id)} ${oyuncular[1].isim} → ${s === -1 ? 'DENGEDE' : oyuncular[s].isim.toLocaleUpperCase('tr-TR')}`;
    durum.className = 'buyu-durum';
    yazi.append(ad, etki, durum);
    kart.append(buyuGorseli(id, 'buyu-gorsel'), yazi);
    alan.append(kart);
  });
}

// Karakterin etiketlerini, bu oyunda aktif olanları vurgulayarak gösterir.
function karakterEtiketleriniGoster(k) {
  const alan = document.getElementById('karakterEtiketleri');
  if (!alan) return;
  alan.replaceChildren();
  (k?.etiketler || []).forEach(etiket => {
    const buyuId = Object.keys(BUYULER).find(id => BUYULER[id].etiket === etiket) || BUYU_ZAAFLARI[etiket]?.buyu;
    if (!buyuId) return;
    const b = BUYULER[buyuId], chip = document.createElement('span');
    chip.className = 'etiket-chip' + (aktifBuyuler.includes(buyuId) ? ' aktif' : '') + (BUYU_ZAAFLARI[etiket] ? ' zaaf' : '');
    chip.textContent = b.simge + ' ' + (BUYU_ZAAFLARI[etiket]?.etiketAdi || b.etiketAdi);
    chip.title = aktifBuyuler.includes(buyuId) ? b.ad + ' büyüsü bu oyunda aktif.' : b.ad + ' büyüsü bu oyunda yok.';
    alan.append(chip);
  });
}

function buyuTanitimiGoster() {
  if (!aktifBuyuler.length || document.getElementById('buyuTanitim')) return;
  const ekran = document.createElement('div');
  ekran.id = 'buyuTanitim';
  ekran.setAttribute('role', 'dialog');
  ekran.setAttribute('aria-modal', 'true');
  const kutu = document.createElement('div');
  kutu.className = 'buyu-tanitim-kutu';
  const ust = document.createElement('div'), baslik = document.createElement('h1'), aciklama = document.createElement('p');
  ust.className = 'kucuk-baslik';
  ust.textContent = 'BU OYUNUN BÜYÜLERİ';
  baslik.textContent = '🔮 ' + aktifBuyuler.map(id => BUYULER[id].ad).join(' & ');
  aciklama.textContent = `Bir büyü, o özelliğe sahip daha çok karakteri olan takıma geçer. Sahibinin karakterleri +${BUYU_ETKISI}, rakipteki aynı karakterler −${BUYU_ETKISI} alır. Eşitlikte büyü dengede kalır.`;
  const kartlar = document.createElement('div');
  kartlar.className = 'buyu-tanitim-kartlar';
  aktifBuyuler.forEach(id => {
    const b = BUYULER[id], kart = document.createElement('div'), ad = document.createElement('strong'), etki = document.createElement('p');
    kart.className = 'buyu-tanitim-kart';
    ad.textContent = b.simge + ' ' + b.ad;
    etki.textContent = `${b.etiketAdi} karakterler • ${STAT_ADLARI[b.stat]} ±${BUYU_ETKISI}`;
    kart.append(buyuGorseli(id, 'buyu-tanitim-gorsel'), ad, etki);
    kartlar.append(kart);
  });
  const btn = document.createElement('button');
  btn.className = 'altin';
  btn.textContent = 'MEZATA BAŞLA ⚔';
  btn.onclick = () => ekran.remove();
  kutu.append(ust, baslik, aciklama, kartlar, btn);
  ekran.append(kutu);
  document.body.append(ekran);
  btn.focus();
}
