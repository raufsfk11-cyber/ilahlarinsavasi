/* MEZAT BOT v1: Yerel tek oyunculu mod, veritabanına yazmaz. */
(() => {
  'use strict';
  window.MezatBotModu = false;
  let zorluk = 'orta';
  let islemBekliyor = false;
  let bekleyenAnahtar = '';
  let sonAnahtar = '';
  let zamanlayici = null;
  let aktif = false;
  let ayarEkrani = null;

  function el(id) { return document.getElementById(id); }
  function sayi(v) { return Number(v) || 0; }
  // Aktif büyüden etkilenen karakterler bot için daha değerlidir.
  function buyuDegeri(k) {
    if (typeof aktifBuyuler === 'undefined' || typeof etiketVar !== 'function') return 0;
    return aktifBuyuler.reduce((t, id) => t + (etiketVar(k, BUYULER[id].etiket) ? 8 : 0) - (id === 'kadin' && etiketVar(k, 'kadin-korkusu') ? 8 : 0), 0);
  }
  function havuzKalan() {
    return typeof havuz !== 'undefined' ? havuz.length : 0;
  }
  function iliskiKatkisi(karakter, takim) {
    if (typeof iliskiBul !== 'function') return 0;
    return takim.reduce((toplam, diger) => {
      const i = iliskiBul(karakter.id, diger.id);
      return toplam + (i ? sayi(i.bonus) : 0);
    }, 0);
  }
  function ihtiyac(k) {
    const bot = oyuncular[1];
    const insan = oyuncular[0];
    const ort = (typeof overallAl === 'function' ? overallAl(k) : (sayi(k.guc) + sayi(k.savunma) + sayi(k.hiz) + sayi(k.zeka)) / 4) + buyuDegeri(k);
    const dostluk = iliskiKatkisi(k, bot.takim);
    const rakipIliski = iliskiKatkisi(k, insan.takim);
    const kalanSlot = Math.max(1, 5 - bot.takim.length);
    const para = bot.para;
    const rezerv = Math.max(0, kalanSlot - 1);
    const alinabilir = Math.max(1, para - rezerv);
    const gucDegeri = Math.max(0, Math.min(1, (ort - 30) / 65));
    let hedef;
    if (zorluk === 'kolay') {
      hedef = 1 + Math.floor(Math.random() * 5);
    } else if (zorluk === 'zor') {
      hedef = 1 + Math.round(gucDegeri * 5 + dostluk / 25 - Math.max(0, rakipIliski) / 40);
    } else {
      hedef = 1 + Math.round(gucDegeri * 4 + Math.max(0, dostluk) / 45);
    }
    if (kalanSlot <= 2 && para > 0) hedef += 1;
    if (zorluk === 'zor' && dostluk < 0) hedef += Math.round(dostluk / 35);
    return Math.max(1, Math.min(alinabilir, Math.min(para, hedef)));
  }
  function botKararVer() {
    if (!window.MezatBotModu || !aktif || typeof oyuncular === 'undefined' || oyuncular.length !== 2) return;
    if (typeof oyunBitti !== 'undefined' && oyunBitti) return;
    if (typeof animasyonDevamEdiyor !== 'undefined' && animasyonDevamEdiyor) return;
    if (typeof lotBitti !== 'undefined' && lotBitti) return;
    if (typeof aktifKarakter === 'undefined' || !aktifKarakter) return;

    if (mezatModu === 'acik' && sira !== 1) return;
    if (mezatModu === 'secim' && secimYapan !== 1) return;
    if (mezatModu !== 'acik' && mezatModu !== 'secim') return;
    const anahtar = [lot, mezatModu, teklif, teklifSahibi, sira, secimYapan, oyuncular[1].takim.length, oyuncular[0].takim.length].join(':');
    if (islemBekliyor || sonAnahtar === anahtar) return;
    islemBekliyor = true;
    bekleyenAnahtar = anahtar;
    const sure = zorluk === 'kolay' ? 750 : zorluk === 'zor' ? 1400 : 1050;
    zamanlayici = setTimeout(() => {
      zamanlayici = null;
      islemBekliyor = false;
      if (!window.MezatBotModu || !aktif || oyunBitti || lotBitti || animasyonDevamEdiyor || !aktifKarakter) return;
      const simdikiAnahtar = [lot, mezatModu, teklif, teklifSahibi, sira, secimYapan, oyuncular[1].takim.length, oyuncular[0].takim.length].join(':');
      if (simdikiAnahtar !== bekleyenAnahtar) return;
      sonAnahtar = simdikiAnahtar;

      if (mezatModu === 'secim' && secimYapan === 1) {
        const benimBos = bosYerVar(1);
        const rakipBos = bosYerVar(0);
        if (!benimBos) return karakterSec(0);
        if (!rakipBos) return karakterSec(1);
        const kimya = iliskiKatkisi(aktifKarakter, oyuncular[1].takim);
        const ort = (typeof overallAl === 'function' ? overallAl(aktifKarakter) : (sayi(aktifKarakter.guc) + sayi(aktifKarakter.savunma) + sayi(aktifKarakter.hiz) + sayi(aktifKarakter.zeka)) / 4) + buyuDegeri(aktifKarakter);
        const al = (ort + kimya * .5) > (zorluk === 'zor' ? 59 : zorluk === 'orta' ? 52 : 46);
        return karakterSec(al ? 1 : 0);
      }
      if (mezatModu !== 'acik' || sira !== 1 || !teklifVerebilir(1)) return;
      const hedef = ihtiyac(aktifKarakter);
      const yeni = teklif + 1;
      if (yeni > oyuncular[1].para || (teklifSahibi !== -1 && yeni > hedef)) {
        if (teklifSahibi !== -1) pasGec();
        return;
      }
      if (zorluk === 'kolay' && teklifSahibi !== -1 && Math.random() < .25) {
        pasGec();
        return;
      }
      let artis = 1;
      if (zorluk === 'zor' && hedef >= teklif + 2 && Math.random() < .35) artis = 2;
      teklifVer(artis);
    }, sure);
  }

  function gorunumuKur() {
    const css = document.createElement('style');
    css.textContent = `
      /* Bot ayarları normal sayfa akışından çıkar: tam ekran, ortalanmış modal. */
      #botAyarEkrani:not(.gizli) {
        position: fixed !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100dvh !important;
        min-height: 0 !important;
        z-index: 100000 !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        overflow-y: auto !important;
        padding: 18px !important;
        margin: 0 !important;
        background: radial-gradient(ellipse at 50% 25%,#1d3942,#08141e 67%) !important;
      }
      #botAyarEkrani.gizli { display: none !important; }
      #botAyarEkrani .bot-panel {
        width: min(520px, 100%);
        max-height: calc(100dvh - 36px);
        min-height: 0;
        overflow-y: auto;
        flex-shrink: 0;
        margin: auto;
        border: 1px solid #9f8051;
        background: #0c1b26ee;
        border-radius: 16px;
        padding: 27px;
        text-align: center;
        box-shadow: 0 22px 75px #0009;
      }
      body:has(#botAyarEkrani:not(.gizli)) { overflow: hidden !important; }
      @media(max-height: 680px) {
        #botAyarEkrani .bot-panel { padding: 16px 24px; }
        #botAyarEkrani label { margin-top: 10px; }
        #botAyarEkrani h1 { margin: 4px 0; }
      }
      #botAyarEkrani h1 {color:#e9c88f;font-size:clamp(32px,5vw,50px);margin:8px 0;}
      #botAyarEkrani p {font-size:17px;color:#b4c4cf;}
      #botAyarEkrani label {display:block;text-align:left;font-size:16px;color:#d5bb8d;margin:20px 0 8px;}
      #botAyarEkrani select,#botAyarEkrani input {display:block;width:100%;padding:13px;margin:0;background:#102938;border:1px solid #6f8d99;color:white;font:inherit;font-size:20px;border-radius:6px;}
      #botAyarEkrani button {width:100%;padding:13px;margin-top:14px;font-size:19px;}
      #mezatEkrani.bot-sira #teklifButonlari button {opacity:.4;pointer-events:none;}
    `;
    document.head.append(css);
    ayarEkrani = document.createElement('section');
    ayarEkrani.className = 'giris ekran gizli';
    ayarEkrani.id = 'botAyarEkrani';
    ayarEkrani.innerHTML = `<div class="bot-panel"><div class="kucuk-baslik">MEZAT • TEK OYUNCULU</div><h1>BOTA KARŞI</h1><p>Karakterleri açık artırmada kap, 5 kişilik takımını kur, bilgisayarla savaş.</p><label for="botOyuncuAdi">OYUNCU ADIN</label><input id="botOyuncuAdi" maxlength="18" placeholder="Adını yaz" autocomplete="off"><label for="botZorluk">BOT ZORLUĞU</label><select id="botZorluk"><option value="kolay">KOLAY</option><option value="orta" selected>ORTA</option><option value="zor">ZOR</option></select><button id="botDevam" class="altin" type="button">OYUNA BAŞLA ⚔</button><button id="botGeri" class="geri" type="button">GERİ</button></div>`;
    document.body.append(ayarEkrani);
    const botAdiInput = el('botOyuncuAdi');
    botAdiInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') el('botDevam').click();
    });
    el('botDevam').addEventListener('click', async () => {
      const ad = botAdiInput.value.trim();
      if (!ad) { botAdiInput.focus(); botAdiInput.setCustomValidity('Önce adını yaz.'); botAdiInput.reportValidity(); return; }
      botAdiInput.setCustomValidity('');
      zorluk = el('botZorluk').value;
      const botAdi = zorluk === 'zor' ? 'MEZAT USTASI' : 'MEZAT BOT';
      if (ad.toLocaleLowerCase('tr-TR') === botAdi.toLocaleLowerCase('tr-TR')) {
        botAdiInput.setCustomValidity('Botla aynı ismi kullanamazsın.'); botAdiInput.reportValidity(); return;
      }
      el('isim1').value = ad;
      el('isim2').value = botAdi;
      el('isim2').readOnly = true;
      window.MezatBotModu = true;
      // Botu doğrudan başlat: ayrı isim lobisine geçilmez.
      aktif = true;
      sonAnahtar = '';
      await oyunuBaslat();
      if (!el('mezatEkrani').classList.contains('gizli')) {
        botAdiInput.blur();
      } else {
        aktif = false;
      }
    });
    botAdiInput.addEventListener('input', () => botAdiInput.setCustomValidity(''));
    el('botGeri').addEventListener('click', () => ekranAc('modSecimEkrani'));
    const lobi = el('lobiEkrani');
    const baslat = lobi?.querySelector('button[onclick*="oyunuBaslat"]');
    if (baslat) baslat.addEventListener('click', () => { if (window.MezatBotModu) aktif = true; }, true);
    const modOffline = el('modOffline');
    if (modOffline) modOffline.addEventListener('click', () => {
      aktif = false;
      if (zamanlayici) clearTimeout(zamanlayici);
      zamanlayici = null; islemBekliyor = false; sonAnahtar = '';
      el('isim2').readOnly = false;
      el('isim2').value = '';
      el('isim2').title = '';
      el('isim1').placeholder = 'Birinci oyuncu';
    });
    const lobiGeri = lobi?.querySelector('button[onclick*="anaEkran"]');
    if (lobiGeri) lobiGeri.addEventListener('click', e => {
      if (window.MezatBotModu) {
        e.preventDefault(); e.stopImmediatePropagation(); aktif = false; ekranAc('botAyarEkrani');
      }
    }, true);
    // Butonları bot sırasında engelle, geri kalan oyun mantığına dokunma.
    const oyun = el('mezatEkrani');
    oyun?.addEventListener('click', e => {
      if (!window.MezatBotModu || !aktif || lotBitti) return;
      const buton = e.target.closest('#teklifButonlari button');
      if (!buton) return;
      const botSirasi = (mezatModu === 'acik' && sira === 1) || (mezatModu === 'secim' && secimYapan === 1);
      if (botSirasi) { e.preventDefault(); e.stopImmediatePropagation(); }
    }, true);
    setInterval(() => {
      if (!window.MezatBotModu || !aktif) return;
      const botSirasi = !lotBitti && ((mezatModu === 'acik' && sira === 1) || (mezatModu === 'secim' && secimYapan === 1));
      el('mezatEkrani')?.classList.toggle('bot-sira', botSirasi);
      if (botSirasi) botKararVer();
    }, 250);
  }
  window.MezatBot = {
    ayarEkraniniAc() { window.MezatBotModu = true; aktif = false; sonAnahtar = ''; ekranAc('botAyarEkrani'); requestAnimationFrame(() => el('botOyuncuAdi')?.focus({preventScroll:true})); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', gorunumuKur);
  else gorunumuKur();
})();
