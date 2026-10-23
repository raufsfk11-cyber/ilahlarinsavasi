/* MEZAT TEKLİF SÜRESİ: sıradaki oyuncu süre içinde oynamazsa otomatik hamle yapılır.
   Açık artırmada teklif yoksa ₺1 açılır, teklif varsa pas geçilir; seçim modunda karakter takıma alınır.
   Online'da süreyi oda sahibi işletir, misafir yalnızca gelen kalan süreyi gösterir. */
(function () {
  'use strict';
  const el = id => document.getElementById(id);
  const SECENEKLER = [0, 10, 15, 25];
  let sureSn = 15;
  try { const s = Number(localStorage.getItem('mezatSure')); if (SECENEKLER.includes(s) && localStorage.getItem('mezatSure') !== null) sureSn = s; } catch (e) { /* varsayılan */ }
  let anahtar = '', bitis = 0, sonTik = -1;
  window.MezatSureKalan = null;

  function rozet() {
    let r = el('sureRozeti');
    const fiyat = document.querySelector('#mezatEkrani .fiyat');
    if (!r && fiyat) { r = document.createElement('span'); r.id = 'sureRozeti'; r.className = 'sure-rozeti gizli'; fiyat.append(r); }
    return r;
  }
  // Misafir de bu fonksiyonla gösterir (online.js'ten gelen değerle).
  window.MezatSureGoster = function (kalan) {
    const yok = kalan === null || kalan === undefined;
    // Büyü seçim ekranı açıksa sayaç onun içinde de görünür (fiyat rozeti ekranın arkasında kalır).
    const kutu = document.querySelector('#buyuTanitim .buyu-tanitim-kutu');
    let b = kutu?.querySelector('.buyu-sure');
    if (kutu && !b && !yok) { b = document.createElement('div'); b.className = 'buyu-sure'; kutu.prepend(b); }
    if (b) { b.classList.toggle('gizli', yok); if (!yok) { b.textContent = '⏱ ' + kalan; b.classList.toggle('kritik', kalan <= 5); } }
    const r = rozet(); if (!r) return;
    r.classList.toggle('gizli', yok);
    if (yok) return;
    r.textContent = '⏱ ' + kalan;
    r.classList.toggle('kritik', kalan <= 5);
  };

  const hamleBekleniyor = () => typeof oyuncular !== 'undefined' && oyuncular.length === 2 && !oyunBitti && !lotBitti && !animasyonDevamEdiyor &&
    !el('mezatEkrani')?.classList.contains('gizli') && !el('buyuTanitim') && !el('mezat-savas-overlay') && (mezatModu === 'acik' || mezatModu === 'secim');
  // Büyü seçimi de süreye tabidir: online'da seçimi ulaşmayan ya da oyunu bırakan oyuncu maçı kilitlemesin.
  const draftBekleniyor = () => typeof oyuncular !== 'undefined' && oyuncular.length === 2 && !oyunBitti && !!el('buyuTanitim') &&
    typeof buyuHavuzlari !== 'undefined' && buyuHavuzlari[0].length > 0 && !buyuSecimiBitti();

  function draftSuresiDoldu() {
    const kim = buyuSecimleri[0] ? 1 : 0, id = buyuHavuzlari[kim][0];
    if (!id) return;
    buyuSec(kim, id);
    const spiker = el('spiker');
    if (spiker) spiker.textContent = `⏱ ${oyuncular[kim]?.isim || ''} için büyü süresi doldu, ${BUYULER[id]?.ad || id} seçildi.`;
  }

  function sureDoldu() {
    const kim = mezatModu === 'secim' ? secimYapan : sira, ad = oyuncular[kim]?.isim || '';
    if (mezatModu === 'secim') karakterSec(bosYerVar(secimYapan) ? secimYapan : 1 - secimYapan);
    else if (teklifSahibi === -1) { if (teklifVerebilir(sira)) teklifVer(1); }
    else pasGec();
    const spiker = el('spiker');
    if (spiker) spiker.textContent = `⏱ ${ad} için süre doldu! ` + spiker.textContent;
  }

  setInterval(() => {
    if (window.MezatYerelOyuncu === 1) return; // online misafir: süreyi oda sahibi yönetir
    const draft = sureSn && draftBekleniyor();
    if (!sureSn || (!draft && !hamleBekleniyor())) { anahtar = ''; window.MezatSureKalan = null; window.MezatSureGoster(null); return; }
    const yeni = draft ? 'draft:' + buyuSecimleri.join(',') : [lot, mezatModu, sira, teklif, teklifSahibi, secimYapan].join(':');
    if (yeni !== anahtar) { anahtar = yeni; bitis = Date.now() + sureSn * 1000; }
    const kalan = Math.max(0, Math.ceil((bitis - Date.now()) / 1000));
    window.MezatSureKalan = kalan;
    window.MezatSureGoster(kalan);
    // Son 3 saniyede tik sesi (gelistirmeler.js'teki ses kapalıysa sessiz kalır).
    if (kalan <= 3 && kalan > 0 && kalan !== sonTik) { sonTik = kalan; window.MezatSesCal?.('tik'); }
    if (Date.now() >= bitis) { anahtar = 'doldu'; sonTik = -1; if (draft) draftSuresiDoldu(); else sureDoldu(); }
  }, 200);

  // Mod seçim ekranına süre ayarı.
  function ayarKur() {
    const kutu = document.querySelector('#modSecimEkrani .mod-kutu'), geri = el('modGeri');
    if (!kutu || !geri || el('sureAyari')) return;
    const alan = document.createElement('div');
    alan.id = 'sureAyari';
    alan.className = 'sure-ayari';
    const etiket = document.createElement('span');
    etiket.textContent = '⏱ TEKLİF SÜRESİ';
    alan.append(etiket);
    SECENEKLER.forEach(s => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = s ? s + ' SN' : 'KAPALI';
      b.classList.toggle('secili', s === sureSn);
      b.onclick = () => {
        sureSn = s;
        try { localStorage.setItem('mezatSure', String(s)); } catch (e) { /* kalıcı olmasa da çalışır */ }
        alan.querySelectorAll('button').forEach(x => x.classList.toggle('secili', x === b));
      };
      alan.append(b);
    });
    kutu.insertBefore(alan, geri);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ayarKur);
  else ayarKur();
})();
