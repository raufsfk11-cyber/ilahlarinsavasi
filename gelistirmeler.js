/* MEZAT GELİŞTİRMELER: ses efektleri, klavye kısayolları ve şampiyonlar tablosu.
   Oyun motoruna dokunmaz; arayuzuGuncelle'yi sarar ve DOM olaylarını dinler. */
(function () {
  'use strict';
  const el = id => document.getElementById(id);
  const depoOku = (anahtar, varsayilan) => { try { return JSON.parse(localStorage.getItem(anahtar)) ?? varsayilan; } catch (e) { return varsayilan; } };
  const depoYaz = (anahtar, deger) => { try { localStorage.setItem(anahtar, JSON.stringify(deger)); } catch (e) { /* gizli sekme vb. */ } };

  /* ---------- SES: dosya yok, sesler Web Audio ile üretilir ---------- */
  let ctx = null, sesAcik = depoOku('mezatSes', true) !== false;
  function sesBaglami() {
    if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ctx = new AC(); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function ton(frek, sure, { tip = 'sine', ses = .12, gecikme = 0, kayma = null } = {}) {
    const c = sesBaglami(); if (!c) return;
    const t = c.currentTime + gecikme, o = c.createOscillator(), g = c.createGain();
    o.type = tip;
    o.frequency.setValueAtTime(frek, t);
    if (kayma) o.frequency.exponentialRampToValueAtTime(kayma, t + sure);
    g.gain.setValueAtTime(ses, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + sure);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + sure + .02);
  }
  function gurultu(sure, ses, gecikme = 0) {
    const c = sesBaglami(); if (!c) return;
    const tampon = c.createBuffer(1, Math.ceil(c.sampleRate * sure), c.sampleRate), veri = tampon.getChannelData(0);
    for (let i = 0; i < veri.length; i++) veri[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / veri.length, 3);
    const k = c.createBufferSource(), g = c.createGain();
    k.buffer = tampon; g.gain.value = ses;
    k.connect(g).connect(c.destination);
    k.start(c.currentTime + gecikme);
  }
  const SESLER = {
    teklif: () => ton(880, .08, { tip: 'square', ses: .05 }),
    allin: () => { ton(220, .55, { tip: 'sawtooth', ses: .07, kayma: 880 }); ton(440, .55, { tip: 'square', ses: .035, kayma: 1760, gecikme: .05 }); },
    satildi: () => { gurultu(.09, .35); ton(150, .35, { ses: .3, kayma: 55 }); ton(1046, .3, { tip: 'triangle', ses: .07, gecikme: .12 }); },
    yeniLot: () => ton(330, .25, { tip: 'triangle', ses: .05, kayma: 660 }),
    buyu: () => [523, 659, 784, 1046].forEach((f, i) => ton(f, .4, { ses: .06, gecikme: i * .07 })),
    tur: () => { gurultu(.18, .25); ton(110, .35, { tip: 'sawtooth', ses: .1, kayma: 50 }); },
    zafer: () => [523, 659, 784, 1046, 784, 1046].forEach((f, i) => ton(f, i === 5 ? .7 : .18, { tip: 'triangle', ses: .1, gecikme: i * .14 })),
    tik: () => ton(1320, .05, { tip: 'square', ses: .04 })
  };
  function cal(ad) { if (!sesAcik) return; try { SESLER[ad]?.(); } catch (e) { /* ses opsiyonel */ } }
  window.MezatSesCal = cal;
  // Tarayıcılar sesi ilk kullanıcı etkileşimine kadar kilitler.
  document.addEventListener('pointerdown', () => { if (sesAcik) sesBaglami(); }, true);

  // Oyun durumundaki değişimden ses ve teklif geçmişi çıkarır; offline, bot ve online misafirde aynı çalışır.
  let onceki = null, teklifGecmisi = [];
  function durumSesi() {
    if (typeof lot === 'undefined' || typeof oyuncular === 'undefined') return;
    const d = { lot, teklif, teklifSahibi, lotBitti };
    if (!onceki || d.lot !== onceki.lot) teklifGecmisi = [];
    if (onceki) {
      if (d.lot !== onceki.lot) cal('yeniLot');
      else if (d.lotBitti && !onceki.lotBitti) cal('satildi');
      else if (d.teklif > onceki.teklif && d.teklifSahibi !== -1) cal(d.teklif === oyuncular[d.teklifSahibi]?.para ? 'allin' : 'teklif');
    }
    if (d.teklifSahibi !== -1 && d.teklif > 0 && (!onceki || d.teklif !== onceki.teklif || d.lot !== onceki.lot)) teklifGecmisi.push(`${oyuncular[d.teklifSahibi].isim} ₺${d.teklif}`);
    onceki = d;
  }
  function teklifGecmisiniGoster() {
    const alan = el('teklifVeren');
    if (alan && teklifGecmisi.length > 1) alan.textContent = teklifGecmisi.slice(-4).join(' → ');
  }

  /* "Bu karakteri alırsan" önizlemesi: her oyuncu için uyum, büyü ve takım özelliği farkı. */
  function alimOnizlemesi() {
    let alan = el('alimOnizleme');
    const hikaye = el('karakterHikaye');
    if (!alan && hikaye) { alan = document.createElement('div'); alan.id = 'alimOnizleme'; alan.className = 'alim-onizleme'; hikaye.after(alan); }
    if (!alan) return;
    const k = typeof aktifKarakter !== 'undefined' ? aktifKarakter : null;
    alan.replaceChildren();
    if (!k || lotBitti || typeof oyuncular === 'undefined' || oyuncular.length !== 2) { alan.classList.add('gizli'); return; }
    alan.classList.remove('gizli');
    oyuncular.forEach((o, i) => {
      if (!bosYerVar(i)) return;
      const parcalar = [];
      const uyum = o.takim.reduce((t, d) => t + (Number(iliskiBul(k.id, d.id)?.bonus) || 0), 0);
      if (uyum) parcalar.push(`${uyum > 0 ? '🤝 +' : '⚔️ '}${uyum} uyum`);
      aktifBuyulerAl().forEach(id => {
        const b = BUYULER[id];
        if (etiketVar(k, b.etiket)) parcalar.push(`${b.simge} ${buyuSahibi(id) === i ? '+' + buyuBonusu(b) : '−' + buyuCezasi(b)} ${STAT_ADLARI[b.stat]}`);
        if (Object.entries(BUYU_ZAAFLARI).some(([e, z]) => z.buyu === id && etiketVar(k, e))) parcalar.push(`${b.simge} −${buyuCezasi(b)} ${STAT_ADLARI[b.stat]} (zaaf)`);
      });
      const once = takimOzelligi(savasTakimi(i).takim);
      const t = takimlarAl().map(x => [...x]); t[i].push(k);
      const sonra = takimOzelligi(buyuluTakim(i, t).takim.map(c => ({ ...c, guc: (Number(c.guc) || 0) + o.para * PARA_GUC_BONUSU })));
      if (sonra && (!once || once.anahtar !== sonra.anahtar)) parcalar.push(`${once ? once.simge + ' ' + once.ad : 'ÖZELLİK YOK'} → ${sonra.simge} ${sonra.ad}`);
      const satir = document.createElement('p'), ad = document.createElement('strong');
      ad.textContent = o.isim.toLocaleUpperCase('tr-TR') + ' ALIRSA: ';
      satir.append(ad, document.createTextNode(parcalar.length ? parcalar.join(' • ') : 'özel bir etkisi yok'));
      alan.append(satir);
    });
  }

  if (typeof arayuzuGuncelle === 'function') {
    const eski = arayuzuGuncelle;
    arayuzuGuncelle = function (...args) {
      const cevap = eski.apply(this, args);
      try { durumSesi(); teklifGecmisiniGoster(); alimOnizlemesi(); } catch (e) { console.warn('Geliştirmeler', e); }
      return cevap;
    };
  }
  document.addEventListener('click', e => {
    if (e.target.closest('#buyuTanitim [data-buyu]')) { cal('buyu'); return; }
    const b = e.target.closest('#mezat-savas-overlay .ms-foot button');
    if (!b) return;
    if (b.textContent.includes('ZAFER')) cal('zafer');
    else if (b.textContent.includes('TUR')) cal('tur');
  }, true);

  /* ---------- KLAVYE KISAYOLLARI ---------- */
  // Butonlara tıklama olayı gönderir; bot/online kilitleri tıklamayla aynı şekilde çalışır.
  const KISAYOLLAR = {
    '1': t => t === 'AÇ +1', '2': t => t === 'AÇ +2', '5': t => t === 'AÇ +5',
    'h': t => t === 'HEPSİ', 'b': t => t === 'BIRAK',
    'a': t => t.includes('TAKIMIMA AL'), 'r': t => t.includes('RAKİBE VER'),
    'Enter': t => t.includes('SONRAKİ') || t.includes('SAVAŞA GEÇ')
  };
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest?.('input, textarea, select')) return;
    // Odaklı butonda Enter/Boşluk zaten tıklar; ikinci kez tetiklemeyelim.
    if (e.target.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return;
    const ov = el('mezat-savas-overlay');
    if (ov) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ov.querySelector('.ms-foot button')?.click(); } return; }
    const tan = el('buyuTanitim');
    if (tan) {
      const kartlar = tan.querySelectorAll('[data-buyu]');
      if ((e.key === '1' || e.key === '2') && kartlar[+e.key - 1]) { e.preventDefault(); kartlar[+e.key - 1].click(); }
      else if (e.key === 'Enter') { const b = [...tan.querySelectorAll('button')].find(x => x.textContent.includes('MEZATA')); if (b) { e.preventDefault(); b.click(); } }
      return;
    }
    if (el('mezatEkrani')?.classList.contains('gizli')) return;
    const kosul = KISAYOLLAR[e.key.length === 1 ? e.key.toLocaleLowerCase('tr-TR') : e.key];
    if (!kosul) return;
    const b = [...document.querySelectorAll('#teklifButonlari button')].find(x => !x.disabled && kosul(x.textContent.trim()));
    if (b) { e.preventDefault(); b.click(); }
  });

  /* ---------- ŞAMPİYONLAR TABLOSU (bu tarayıcıda saklanır) ---------- */
  const KAYIT = 'mezatSampiyonlar';
  const bosKayit = () => ({ oyuncular: {}, mvp: {}, maclar: [] });
  // Maç sonunda bir kez çağrılır: oda sahibi/offline sonucEkstrasiniYaz'dan, misafir online.js'ten.
  window.MezatMacKaydet = function () {
    try {
      if (typeof oyuncular === 'undefined' || oyuncular.length !== 2) return;
      const k = depoOku(KAYIT, bosKayit());
      const baslik = el('kazananYazisi').textContent.trim();
      const kazanan = oyuncular.findIndex(o => baslik === '🏆 ' + o.isim.toLocaleUpperCase('tr-TR') + ' KAZANDI!');
      const mvp = (el('sonucEkstra').querySelector('.mvp')?.textContent.match(/MAÇIN ADAMI: (.+?) \(/) || [])[1] || '';
      oyuncular.forEach((o, i) => {
        const s = k.oyuncular[o.isim] || (k.oyuncular[o.isim] = { mac: 0, galibiyet: 0 });
        s.mac++; if (i === kazanan) s.galibiyet++;
      });
      if (mvp) k.mvp[mvp] = (k.mvp[mvp] || 0) + 1;
      k.maclar.unshift({ t: Date.now(), ozet: el('savasOzeti').textContent, kazanan: oyuncular[kazanan]?.isim || '', mvp });
      k.maclar = k.maclar.slice(0, 12);
      depoYaz(KAYIT, k);
    } catch (e) { console.warn('Maç kaydedilemedi', e); }
  };

  function sampiyonlariGoster() {
    const k = depoOku(KAYIT, bosKayit());
    const ekran = document.createElement('div');
    ekran.id = 'sampiyonlarEkrani';
    ekran.setAttribute('role', 'dialog');
    ekran.setAttribute('aria-modal', 'true');
    const kutu = document.createElement('div');
    kutu.className = 'sampiyon-kutu';
    const yeni = (etiket, metin, sinif) => { const e = document.createElement(etiket); if (metin !== undefined) e.textContent = metin; if (sinif) e.className = sinif; return e; };
    kutu.append(yeni('div', 'BU BİLGİSAYARDAKİ MAÇLAR', 'kucuk-baslik'), yeni('h1', '🏆 ŞAMPİYONLAR'));
    const liste = Object.entries(k.oyuncular).sort((a, b) => b[1].galibiyet - a[1].galibiyet || (b[1].galibiyet / b[1].mac) - (a[1].galibiyet / a[1].mac));
    if (!liste.length) kutu.append(yeni('p', 'Henüz oynanmış maç yok. İlk şampiyon sen ol!', 'sampiyon-bos'));
    else {
      const tablo = yeni('div', undefined, 'sampiyon-tablo');
      liste.forEach(([isim, s], i) => {
        const satir = yeni('div', undefined, 'sampiyon-satir' + (i === 0 ? ' lider' : ''));
        satir.append(yeni('span', ['🥇', '🥈', '🥉'][i] || (i + 1) + '.'), yeni('strong', isim),
          yeni('span', `${s.galibiyet}G ${s.mac - s.galibiyet}M`), yeni('span', '%' + Math.round(s.galibiyet / s.mac * 100)));
        tablo.append(satir);
      });
      kutu.append(tablo);
      const mvpler = Object.entries(k.mvp).sort((a, b) => b[1] - a[1]).slice(0, 5);
      if (mvpler.length) kutu.append(yeni('h2', '⭐ EN ÇOK MAÇIN ADAMI OLANLAR'), yeni('p', mvpler.map(([ad, n]) => `${ad} (${n})`).join(' • '), 'sampiyon-mvp'));
      kutu.append(yeni('h2', '📜 SON MAÇLAR'));
      k.maclar.slice(0, 6).forEach(m => kutu.append(yeni('p', `${new Date(m.t).toLocaleDateString('tr-TR')} • ${m.ozet}${m.mvp ? ' • ⭐ ' + m.mvp : ''}`, 'sampiyon-mac')));
    }
    const butonlar = yeni('div', undefined, 'sampiyon-butonlar');
    const kapat = yeni('button', 'KAPAT', 'altin');
    kapat.onclick = () => ekran.remove();
    butonlar.append(kapat);
    if (liste.length) {
      const sifirla = yeni('button', 'SIFIRLA', 'geri');
      sifirla.onclick = () => { if (confirm('Tüm şampiyonluk kayıtları silinsin mi?')) { depoYaz(KAYIT, bosKayit()); ekran.remove(); sampiyonlariGoster(); } };
      butonlar.append(sifirla);
    }
    kutu.append(butonlar);
    ekran.append(kutu);
    ekran.addEventListener('click', e => { if (e.target === ekran) ekran.remove(); });
    document.body.append(ekran);
    kapat.focus();
  }

  function kur() {
    const eylem = document.querySelector('#anaEkran .menu-eylem');
    if (eylem && !el('sampiyonlarButonu')) {
      const b = document.createElement('button');
      b.id = 'sampiyonlarButonu';
      b.className = 'menu-yonetim';
      b.type = 'button';
      b.textContent = '🏆 ŞAMPİYONLAR';
      b.onclick = sampiyonlariGoster;
      eylem.append(b);
    }
    const ses = document.createElement('button');
    ses.id = 'sesDugmesi';
    ses.type = 'button';
    const sesYaz = () => { ses.textContent = sesAcik ? '🔊' : '🔇'; ses.title = sesAcik ? 'Sesi kapat' : 'Sesi aç'; ses.setAttribute('aria-label', ses.title); };
    ses.onclick = () => { sesAcik = !sesAcik; depoYaz('mezatSes', sesAcik); sesYaz(); if (sesAcik) cal('teklif'); };
    sesYaz();
    const ipucu = document.createElement('div');
    ipucu.id = 'kisayolIpucu';
    ipucu.textContent = '⌨ KISAYOLLAR: 1 · 2 · 5 teklif • H hepsi • B bırak • A al • R rakibe ver • Enter sonraki';
    document.body.append(ses, ipucu);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kur);
  else kur();
})();
