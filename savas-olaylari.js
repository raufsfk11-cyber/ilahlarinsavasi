/* MEZAT SAVAŞ OLAYLARI ve İDDAA ORANLARI
   Her savaşta, takımlardaki karakterlere uyan olaylardan biri rastgele gerçekleşir.
   Olaylar büyüler gibi takım kopyalarının statlarını değiştirir. */
const adEsit = (k, isim) => String(k.isim || '').toLocaleUpperCase('tr-TR') === isim;
const takimdaVar = (takim, isim) => takim.some(k => adEsit(k, isim));

// hedef(k, benimTakim, rakipTakim): bu karakter etkilenir mi? degisim: stat farkları.
const SAVAS_OLAYLARI = [
  { ad: 'CUMA GÜNÜ', simge: '🕌', metin: 'Bugün cuma! Ahmet Şafak ortadan kayboldu, savaşa yarım akılla katıldı.',
    hedef: k => adEsit(k, 'AHMET ŞAFAK'), degisim: { guc: -25, savunma: -25, hiz: -25, zeka: -25 } },
  { ad: 'DAVUL SESİ', simge: '🥁', metin: 'Uzaktan davul sesi geldi. Yusuf görevi bırakıp halaya katıldı.',
    hedef: k => adEsit(k, 'YUSUF KARGIOĞLU'), degisim: { savunma: -30, zeka: -20, hiz: 15 } },
  { ad: 'AÇIK BÜFE', simge: '🍽️', metin: 'Savaştan önce açık büfe kuruldu. Diyet bozuldu ama güç geldi.',
    hedef: k => adEsit(k, 'EGE') || adEsit(k, 'AHMET ŞAFAK'), degisim: { guc: 20, hiz: -10 } },
  { ad: 'KUPON YATTI', simge: '📉', metin: 'Son maç 89. dakikada döndü, kuponlar yattı. İddia bağımlıları sinirden düşünemiyor.',
    hedef: k => etiketVar(k, 'iddia'), degisim: { zeka: -15 } },
  { ad: 'RAKI MASASI', simge: '🍻', metin: 'Gece rakı masası kuruldu. Alkolikler cesaretlendi ama ayakta zor duruyor.',
    hedef: k => etiketVar(k, 'alkol'), degisim: { guc: 15, hiz: -15 } },
  { ad: 'VİZE ÇIKTI', simge: '🛂', metin: 'Vize onaylandı! Gurbetçiler bavulu toplayıp yıldırım gibi hızlandı.',
    hedef: k => etiketVar(k, 'gurbet'), degisim: { hiz: 20 } },
  { ad: 'DOLANDIRICILIK', simge: '💸', metin: 'Hakan Keleş yeni bir iş kurdu. Karşısındaki Rauf yine dolandırıldı.',
    hedef: (k, ben, rakip) => adEsit(k, 'HAKAN KELEŞ') || (adEsit(k, 'RAUF') && takimdaVar(rakip, 'HAKAN KELEŞ')),
    degisim: k => adEsit(k, 'HAKAN KELEŞ') ? { zeka: 20 } : { zeka: -25 } },
  { ad: 'DERBİ GÜNÜ', simge: '⚽', metin: 'Derbi var! Futbol delileri gaza geldi.',
    hedef: k => ['FARE', 'AHMET ŞAFAK', 'RAUF', 'ÖZGÜR ÇETİNER'].some(i => adEsit(k, i)), degisim: { hiz: 15, guc: 10 } },
  { ad: 'SPOR SALONU', simge: '🥊', metin: 'Fare Topuria sabah antrenmanından yeni çıktı.',
    hedef: k => adEsit(k, 'FARE'), degisim: { guc: 25 } },
  { ad: 'SEÇİM GECESİ', simge: '🗳️', metin: 'Seçim sonuçları açıklanıyor! AKP trolü ve CHP sevdalısı birbirine girdi.',
    hedef: k => adEsit(k, 'AHMET ŞAFAK') || adEsit(k, 'METİN ŞAFAK'), degisim: { guc: 20, zeka: -15 } },
  { ad: 'TATBİKAT', simge: '⚓', metin: 'Deniz subayı Yiğithan tatbikattan döndü, disiplin tavan.',
    hedef: k => adEsit(k, 'YİĞİTHAN'), degisim: { savunma: 25, zeka: 10 } },
  { ad: 'RUHSATLI SİLAH', simge: '🔫', metin: 'Gökhan Günay ruhsatlı silahını beline taktı.',
    hedef: k => adEsit(k, 'GÖKHAN GÜNAY'), degisim: { guc: 25 } },
  { ad: 'KIZ MESAJ ATTI', simge: '📲', metin: 'Telefona bir mesaj düştü. Kadın düşkünlerinin aklı savaştan çıktı.',
    hedef: k => etiketVar(k, 'kadin'), degisim: { zeka: -15, hiz: 10 } },
  { ad: 'YAZLIĞA KAÇIŞ', simge: '🏖️', metin: 'Ayhan Keleş her şeyi bırakıp yazlığa kaçtı!',
    hedef: k => adEsit(k, 'AYHAN KELEŞ'), degisim: { guc: -20, savunma: -20 } }
];
const SAKIN_GUN = { ad: 'SAKİN GÜN', simge: '🌤️', metin: 'Bugün kimsenin başına bir şey gelmedi. Saf güç konuşacak.' };

// Yalnızca en az bir karakteri etkileyen olaylar arasından seçer.
function savasOlayiSec(takimlar) {
  const uygun = SAVAS_OLAYLARI.filter(o => takimlar.some((t, i) => t.some(k => o.hedef(k, t, takimlar[1 - i]))));
  return uygun.length ? uygun[Math.floor(Math.random() * uygun.length)] : SAKIN_GUN;
}

// Takım kopyalarını yerinde değiştirir, etkilenenlerin listesini döner.
function savasOlayiUygula(olay, takimlar) {
  const etkiler = [];
  if (!olay.hedef) return etkiler;
  takimlar.forEach((t, i) => t.forEach(k => {
    if (!olay.hedef(k, t, takimlar[1 - i])) return;
    const degisim = typeof olay.degisim === 'function' ? olay.degisim(k) : olay.degisim;
    Object.entries(degisim).forEach(([s, fark]) => { k[s] = Math.max(0, (Number(k[s]) || 0) + fark); });
    etkiler.push(k.isim + ' ' + Object.entries(degisim).map(([s, f]) => (f > 0 ? '+' : '') + f + ' ' + STAT_ADLARI[s]).join(', '));
  }));
  return etkiler;
}

// Savaşı (3 tur, en iyi 2) çok kez simüle edip kazanma ihtimali ve bahis oranı çıkarır.
const ORAN_SIMULASYONU = 600, BAHIS_MARJI = .92;
function iddaaOranlari(savascilar) {
  let kazanilan = 0;
  for (let n = 0; n < ORAN_SIMULASYONU; n++) {
    let tur = 0;
    savasTurlari.forEach((t, i) => { if (performansHesapla(savascilar[0], t, i, savascilar[1]) > performansHesapla(savascilar[1], t, i, savascilar[0])) tur++; });
    if (tur >= 2) kazanilan++;
  }
  const ihtimal = Math.min(.99, Math.max(.01, kazanilan / ORAN_SIMULASYONU));
  const oran = p => Math.min(25, Math.max(1.01, BAHIS_MARJI / p)).toFixed(2);
  return { ihtimal: [ihtimal, 1 - ihtimal], oran: [oran(ihtimal), oran(1 - ihtimal)] };
}
