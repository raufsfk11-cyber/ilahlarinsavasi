/* MEZAT ÖZELLİKLER: overall, takım özelliği ve sabit ilişki puanları.
   Hem oyun (index.html) hem karakter yönetimi (karakterler.html) kullanır. */

// Her sınıf kendi rolüne uygun statlardan overall alır.
const SINIF_AGIRLIKLARI = {
  'TANK':      { guc: .35, savunma: .45, hiz: .05, zeka: .15 },
  'SAVAŞÇI':   { guc: .45, savunma: .25, hiz: .20, zeka: .10 },
  'SUİKASTÇI': { guc: .30, savunma: .05, hiz: .40, zeka: .25 },
  'BÜYÜCÜ':    { guc: .25, savunma: .15, hiz: .20, zeka: .40 },
  'TAKTİKÇİ':  { guc: .15, savunma: .10, hiz: .20, zeka: .55 },
  'DESTEK':    { guc: .20, savunma: .35, hiz: .15, zeka: .30 }
};
const NADIRLIK_BONUSU = { 'NORMAL': 0, 'NADİR': 1, 'EPİK': 2, 'EFSANE': 3 };

function overallHesapla(k) {
  const a = SINIF_AGIRLIKLARI[String(k.kategori || '').toLocaleUpperCase('tr-TR')] || { guc: .25, savunma: .25, hiz: .25, zeka: .25 };
  const ham = ['guc', 'savunma', 'hiz', 'zeka'].reduce((t, s) => t + (Number(k[s]) || 0) * a[s], 0);
  const bonus = NADIRLIK_BONUSU[String(k.nadirlik || '').toLocaleUpperCase('tr-TR')] || 0;
  return Math.max(1, Math.min(99, Math.round(ham) + bonus));
}
// Yayın verisinde sabit overall vardır; yerel karakterlerde hesaplanır.
const overallAl = k => Number(k.overall) || overallHesapla(k);
const takimOverall = takim => takim.length ? Math.round(takim.reduce((t, k) => t + overallAl(k), 0) / takim.length) : 0;

/* İLİŞKİLER: puan türe göre sabittir, elle girilmez. */
const ILISKI_TURLERI = {
  'can-dostu':   { ad: 'CAN DOSTU',   puan: 50,  simge: '💚' },
  'dostluk':     { ad: 'DOSTLUK',     puan: 25,  simge: '🤝' },
  'aile':        { ad: 'AİLE',        puan: 20,  simge: '💛' },
  'ortak-nokta': { ad: 'ORTAK NOKTA', puan: 10,  simge: '🔗' },
  'rekabet':     { ad: 'REKABET',     puan: -20, simge: '⚔️' },
  'dusmanlik':   { ad: 'DÜŞMANLIK',   puan: -50, simge: '☠️' }
};
function iliskiPuani(il) {
  const t = ILISKI_TURLERI[il.tur];
  return t ? t.puan : Number(il.bonus) || 0;
}
// Kayıtlı bonus yerine türün sabit puanını yazar; tüketiciler il.bonus okumaya devam eder.
const iliskileriSabitle = liste => liste.map(il => ({ ...il, bonus: iliskiPuani(il) }));

/* TAKIM ÖZELLİĞİ: takımın en yüksek toplam statı özelliği belirler.
   Döngü: ZEKA > GÜÇ > SAVUNMA > HIZ > ZEKA. Karşı kutuplar (GÜÇ-HIZ, ZEKA-SAVUNMA) nötrdür. */
const TAKIM_OZELLIKLERI = {
  guc:     { ad: 'EZİCİ GÜÇ',       stat: 'GÜÇ',     simge: '💪', yener: 'savunma', tur: 0, aciklama: 'Saldırı Çatışması turunda +%10.' },
  savunma: { ad: 'ÇELİK DUVAR',     stat: 'SAVUNMA', simge: '🛡️', yener: 'hiz',     tur: 1, aciklama: 'Savunma ve Taktik turunda +%10.' },
  hiz:     { ad: 'YILDIRIM',        stat: 'HIZ',     simge: '⚡', yener: 'zeka',    tur: 2, aciklama: 'Son Karşılaşma turunda +%10.' },
  zeka:    { ad: 'STRATEJİ USTASI', stat: 'ZEKA',    simge: '🧠', yener: 'guc',     tur: -1, aciklama: 'Tüm turlarda +%4.' }
};
const OZELLIK_TUR_BONUSU = .10, ZEKA_GENEL_BONUSU = .04, KARSI_OZELLIK_BONUSU = .10;
// Eşitlikte bu sıra geçerli olur.
const OZELLIK_SIRASI = ['guc', 'savunma', 'hiz', 'zeka'];

function takimOzelligi(takim) {
  if (!takim || !takim.length) return null;
  const toplamlar = {};
  OZELLIK_SIRASI.forEach(s => { toplamlar[s] = takim.reduce((t, k) => t + (Number(k[s]) || 0), 0); });
  const anahtar = OZELLIK_SIRASI.reduce((en, s) => toplamlar[s] > toplamlar[en] ? s : en, OZELLIK_SIRASI[0]);
  return { anahtar, toplamlar, ...TAKIM_OZELLIKLERI[anahtar] };
}
// 1: a, b'yi yener. -1: b, a'yı yener. 0: nötr.
function ozellikKarsilastir(a, b) {
  if (!a || !b || a === b) return 0;
  if (TAKIM_OZELLIKLERI[a].yener === b) return 1;
  if (TAKIM_OZELLIKLERI[b].yener === a) return -1;
  return 0;
}
// Bir turda takımın performansına uygulanacak çarpan.
function ozellikCarpani(benim, rakip, turIndex) {
  if (!benim) return 1;
  let c = 1;
  const o = TAKIM_OZELLIKLERI[benim];
  if (o.tur === turIndex) c += OZELLIK_TUR_BONUSU;
  if (benim === 'zeka') c += ZEKA_GENEL_BONUSU;
  if (ozellikKarsilastir(benim, rakip) === 1) c += KARSI_OZELLIK_BONUSU;
  return c;
}
function ozellikEtkisiMetni(benim, rakip) {
  const r = ozellikKarsilastir(benim, rakip);
  if (r === 1) return 'rakibin özelliğine KARŞI (+%10 tüm turlar)';
  if (r === -1) return 'rakibin özelliğine YENİK';
  return 'rakiple nötr';
}
