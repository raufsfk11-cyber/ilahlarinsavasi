/* MEZAT BÜYÜLER: 4 büyü her oyunda rastgele iki ikiliye ayrılır.
   1. oyuncu kendi ikilisinden birini, ardından 2. oyuncu diğer ikiliden birini seçer.
   Büyünün sahibinin etiketli karakterleri statı +20 alır, rakipteki etiketliler −20 yer. */
const BUYULER = {
  viski:  { ad: 'VİSKİ',       simge: '🥃', etiket: 'alkol',  etiketAdi: 'Alkol bağımlısı', stat: 'guc',     gorsel: 'buyu-gorselleri/viski' },
  kadin:  { ad: 'KADIN',       simge: '💋', etiket: 'kadin',  etiketAdi: 'Kadın düşkünü',   stat: 'hiz',     gorsel: 'buyu-gorselleri/kadin' },
  futbol: { ad: 'FUTBOL MAÇI', simge: '⚽', etiket: 'iddia',  etiketAdi: 'İddia bağımlısı', stat: 'zeka',    gorsel: 'buyu-gorselleri/futbol' },
  gurbet: { ad: 'GURBET',      simge: '✈️', etiket: 'gurbet', etiketAdi: 'Gurbetçi',        stat: 'savunma', gorsel: 'buyu-gorselleri/gurbet' }
};
// Büyüyle ilgisi olan ama sahibine göre değişmeyen özel zaaflar.
const BUYU_ZAAFLARI = { 'kadin-korkusu': { buyu: 'kadin', etiketAdi: 'Kadınlardan çekinir' } };
const BUYU_ETKISI = 20;
const STAT_ADLARI = { guc: 'GÜÇ', savunma: 'SAVUNMA', hiz: 'HIZ', zeka: 'ZEKA' };
const GORSEL_UZANTILARI = ['png', 'jpg', 'jpeg', 'webp'];
// Online senkron için boş seçim null değil '' tutulur.
let buyuHavuzlari = [[], []], buyuSecimleri = ['', ''], buyuEkraniKapandi = false;

const aktifBuyulerAl = () => buyuSecimleri.filter(Boolean);
const buyuSecimiBitti = () => buyuSecimleri.every(Boolean);
const etiketVar = (k, etiket) => Array.isArray(k.etiketler) && k.etiketler.includes(etiket);
const buyuSayisi = (takim, id) => takim.filter(k => etiketVar(k, BUYULER[id].etiket)).length;
// 0 veya 1: büyüyü seçen oyuncu. -1: bu oyunda seçilmedi.
const buyuSahibi = id => buyuSecimleri.indexOf(id);
const oyuncuAdi = i => (typeof oyuncular !== 'undefined' && oyuncular[i]?.isim) || (i + 1) + '. OYUNCU';

function buyuSecimiBaslat() {
  const anahtarlar = Object.keys(BUYULER);
  for (let i = anahtarlar.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [anahtarlar[i], anahtarlar[j]] = [anahtarlar[j], anahtarlar[i]]; }
  buyuHavuzlari = [anahtarlar.slice(0, 2), anahtarlar.slice(2, 4)];
  buyuSecimleri = ['', ''];
  buyuEkraniKapandi = false;
}

// Sıra dışı ya da havuz dışı seçimleri reddeder; online'da oda sahibi de bunu kullanır.
function buyuSec(oyuncu, id) {
  if (buyuSecimleri[oyuncu] || !buyuHavuzlari[oyuncu]?.includes(id)) return false;
  if (oyuncu === 1 && !buyuSecimleri[0]) return false;
  buyuSecimleri[oyuncu] = id;
  buyuSecimEkraniniGuncelle();
  if (typeof arayuzuGuncelle === 'function' && typeof aktifKarakter !== 'undefined' && aktifKarakter) arayuzuGuncelle();
  return true;
}

// Takımın büyüler uygulanmış kopyası ve olay listesi. Asıl karakter kayıtları değişmez.
function buyuluTakim(index, takimlar) {
  const olaylar = [];
  const takim = takimlar[index].map(k => ({ ...k }));
  aktifBuyulerAl().forEach(id => {
    const b = BUYULER[id], sahip = buyuSahibi(id);
    takim.forEach(k => {
      let fark = 0;
      if (etiketVar(k, b.etiket)) fark = sahip === index ? BUYU_ETKISI : -BUYU_ETKISI;
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
  return aktifBuyulerAl().map(id => `${BUYULER[id].simge} ${BUYULER[id].ad} → ${oyuncuAdi(buyuSahibi(id))}`).join('  •  ');
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
  if (!aktifBuyulerAl().length) { alan.textContent = 'Büyüler henüz seçilmedi.'; return; }
  aktifBuyulerAl().forEach(id => {
    const b = BUYULER[id], s = buyuSahibi(id);
    const kart = document.createElement('div');
    kart.className = 'buyu-kart' + (k && etiketVar(k, b.etiket) ? ' etkiler' : '');
    const yazi = document.createElement('div');
    const ad = document.createElement('strong'), etki = document.createElement('small'), durum = document.createElement('small');
    ad.textContent = `${b.simge} ${b.ad} • ${oyuncuAdi(s).toLocaleUpperCase('tr-TR')}`;
    etki.textContent = `${b.etiketAdi}: sahibine +${BUYU_ETKISI}, rakibe −${BUYU_ETKISI} ${STAT_ADLARI[b.stat]}`;
    durum.textContent = `${oyuncular[s].isim}: ${buyuSayisi(t[s], id)} kişi (+) • ${oyuncular[1 - s].isim}: ${buyuSayisi(t[1 - s], id)} kişi (−)`;
    durum.className = 'buyu-durum';
    yazi.append(ad, etki, durum);
    kart.append(buyuGorseli(id, 'buyu-gorsel'), yazi);
    alan.append(kart);
  });
}

// Karakterin etiketlerini, bu oyunda seçilen büyüleri vurgulayarak gösterir.
function karakterEtiketleriniGoster(k) {
  const alan = document.getElementById('karakterEtiketleri');
  if (!alan) return;
  alan.replaceChildren();
  (k?.etiketler || []).forEach(etiket => {
    const buyuId = Object.keys(BUYULER).find(id => BUYULER[id].etiket === etiket) || BUYU_ZAAFLARI[etiket]?.buyu;
    if (!buyuId) return;
    const b = BUYULER[buyuId], sahip = buyuSahibi(buyuId), chip = document.createElement('span');
    chip.className = 'etiket-chip' + (sahip !== -1 ? ' aktif' : '') + (BUYU_ZAAFLARI[etiket] ? ' zaaf' : '');
    chip.textContent = b.simge + ' ' + (BUYU_ZAAFLARI[etiket]?.etiketAdi || b.etiketAdi) + (sahip !== -1 ? ' • seçen: ' + oyuncuAdi(sahip) : '');
    chip.title = sahip !== -1 ? `${b.ad}, ${oyuncuAdi(sahip)} tarafından seçildi. Onun takımında +${BUYU_ETKISI}, rakipte −${BUYU_ETKISI} ${STAT_ADLARI[b.stat]}.` : b.ad + ' büyüsü bu oyunda seçilmedi.';
    alan.append(chip);
  });
}

function buyuSecimKarti(id, tiklanabilir, oyuncu) {
  const b = BUYULER[id], kart = document.createElement(tiklanabilir ? 'button' : 'div');
  const ad = document.createElement('strong'), etki = document.createElement('p');
  kart.className = 'buyu-tanitim-kart' + (tiklanabilir ? ' secilebilir' : '');
  if (tiklanabilir) {
    kart.type = 'button';
    kart.dataset.buyu = id;
    kart.dataset.oyuncu = oyuncu;
    kart.onclick = () => buyuSec(oyuncu, id);
  }
  ad.textContent = b.simge + ' ' + b.ad;
  etki.textContent = `${b.etiketAdi} karakterler • ${STAT_ADLARI[b.stat]} ±${BUYU_ETKISI}`;
  kart.append(buyuGorseli(id, 'buyu-tanitim-gorsel'), ad, etki);
  return kart;
}

/* Seçim ekranı. window.MezatYerelOyuncu online'da bu ekrandaki oyuncuyu (0/1) belirtir;
   tanımsızsa iki oyuncu aynı ekrandadır. Bot modunda 2. oyuncunun seçimini bot yapar. */
function buyuSecimEkraniniGuncelle() {
  let ekran = document.getElementById('buyuTanitim');
  if (buyuEkraniKapandi || !buyuHavuzlari[0].length) { ekran?.remove(); return; }
  if (!ekran) {
    ekran = document.createElement('div');
    ekran.id = 'buyuTanitim';
    ekran.setAttribute('role', 'dialog');
    ekran.setAttribute('aria-modal', 'true');
    document.body.append(ekran);
  }
  const sira = !buyuSecimleri[0] ? 0 : !buyuSecimleri[1] ? 1 : -1;
  const yerel = window.MezatYerelOyuncu;
  const botSirasi = sira === 1 && window.MezatBotModu;
  const benimSiram = sira !== -1 && !botSirasi && (yerel === undefined || yerel === sira);
  const kutu = document.createElement('div');
  kutu.className = 'buyu-tanitim-kutu';
  const ust = document.createElement('div'), baslik = document.createElement('h1'), aciklama = document.createElement('p');
  ust.className = 'kucuk-baslik';
  ust.textContent = sira === -1 ? 'BU OYUNUN BÜYÜLERİ' : `BÜYÜ SEÇİMİ • ${sira + 1}. OYUNCU`;
  const kartlar = document.createElement('div');
  kartlar.className = 'buyu-tanitim-kartlar';
  if (sira === -1) {
    baslik.textContent = '🔮 ' + buyuSecimleri.map(id => BUYULER[id].ad).join(' VS ');
    aciklama.textContent = `Büyünün sahibinin etiketli karakterleri +${BUYU_ETKISI}, rakipteki aynı karakterler −${BUYU_ETKISI} alır. Mezatta buna göre teklif ver!`;
    buyuSecimleri.forEach((id, i) => {
      const kart = buyuSecimKarti(id, false, i), sahip = document.createElement('p');
      sahip.className = 'buyu-sahip';
      sahip.textContent = 'SAHİBİ: ' + oyuncuAdi(i).toLocaleUpperCase('tr-TR');
      kart.prepend(sahip);
      kartlar.append(kart);
    });
  } else {
    baslik.textContent = benimSiram ? `${oyuncuAdi(sira).toLocaleUpperCase('tr-TR')}, BÜYÜNÜ SEÇ` : `${oyuncuAdi(sira).toLocaleUpperCase('tr-TR')} SEÇİYOR...`;
    aciklama.textContent = (sira === 1 ? `${oyuncuAdi(0)} ${BUYULER[buyuSecimleri[0]].simge} ${BUYULER[buyuSecimleri[0]].ad} seçti. ` : '') +
      `Seçtiğin büyünün etiketli karakterleri senin takımında +${BUYU_ETKISI}, rakibinde −${BUYU_ETKISI} alır.`;
    buyuHavuzlari[sira].forEach(id => kartlar.append(buyuSecimKarti(id, benimSiram, sira)));
  }
  kutu.append(ust, baslik, aciklama, kartlar);
  if (sira === -1) {
    const btn = document.createElement('button');
    btn.className = 'altin';
    btn.textContent = 'MEZATA BAŞLA ⚔';
    btn.onclick = () => { buyuEkraniKapandi = true; ekran.remove(); };
    kutu.append(btn);
  }
  ekran.replaceChildren(kutu);
  (ekran.querySelector('button') || null)?.focus({ preventScroll: true });
}
