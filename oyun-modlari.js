/* MEZAT oyun modu secimi — mevcut oyun motorunu degistirmez. */
(() => {
  'use strict';
  const init = () => {
    const ana = document.getElementById('anaEkran');
    const lobi = document.getElementById('lobiEkrani');
    if (!ana || !lobi || document.getElementById('modSecimEkrani')) return;

    const stil = document.createElement('style');
    stil.textContent = `
      #modSecimEkrani {background:radial-gradient(ellipse at 50% 25%,#153744 0%,#071522 62%,#050c14 100%); color:#f4e3c5;}
      #modSecimEkrani .mod-kutu {width:min(900px,100%);text-align:center;}
      #modSecimEkrani .mod-baslik {color:#45d9d0;font-weight:800;letter-spacing:4px;font-size:14px;}
      #modSecimEkrani h1 {font-size:clamp(36px,5vw,62px);margin:8px 0 25px;color:#e7c58c;}
      #modSecimEkrani .mod-kartlar {display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px;}
      #modSecimEkrani .mod-kart {width:100%;min-height:222px;padding:23px 16px;display:flex;flex-direction:column;align-items:flex-start;gap:11px;text-align:left;border:1px solid #49717d;border-radius:13px;background:linear-gradient(140deg,#122b39,#09131d);color:#e9f4f7;transition:transform .2s,border-color .2s,box-shadow .2s;}
      #modSecimEkrani .mod-kart:not(:disabled):hover {transform:translateY(-5px);border-color:#b9a16c;box-shadow:0 0 25px #2c61734a;}
      #modSecimEkrani .mod-kart .mod-simge {font-size:30px;line-height:1;}
      #modSecimEkrani .mod-kart strong {font-size:25px;letter-spacing:.4px;}
      #modSecimEkrani .mod-kart .mod-aciklama {font-size:17px;line-height:1.35;color:#bad0da;font-weight:500;}
      #modSecimEkrani .mod-kart .mod-durum {margin-top:auto;align-self:flex-start;font-size:13px;letter-spacing:1px;color:#7de5bc;font-weight:800;}
      #modSecimEkrani .mod-kart:disabled {opacity:.72;cursor:not-allowed;}
      #modSecimEkrani .mod-kart:disabled .mod-durum {color:#edc48a;}
      #modSecimEkrani .mod-geri {width:min(340px,100%);padding:14px;margin-top:24px;background:#091923;border:1px solid #95764a;color:#e9c98d;font-size:19px;}
      @media(max-width:720px){#modSecimEkrani .mod-kartlar{grid-template-columns:1fr;}#modSecimEkrani .mod-kart{min-height:150px;}}
    `;
    document.head.appendChild(stil);

    const ekran = document.createElement('section');
    ekran.id = 'modSecimEkrani';
    ekran.className = 'giris ekran gizli';
    ekran.innerHTML = `
      <div class="mod-kutu">
        <div class="mod-baslik">1 VS 1 • MEZAT</div>
        <h1>OYUN MODUNU SEÇ</h1>
        <div class="mod-kartlar">
          <button id="modOffline" class="mod-kart" type="button">
            <span class="mod-simge" aria-hidden="true">⚔</span>
            <strong>OFFLINE</strong>
            <span class="mod-aciklama">Aynı bilgisayarda iki arkadaş, mevcut MEZAT kurallarıyla oynar.</span>
            <span class="mod-durum">OYNA →</span>
          </button>
          <button id="modBot" class="mod-kart" type="button">
            <span class="mod-simge" aria-hidden="true">♟</span>
            <strong>BOTA KARŞI</strong>
            <span class="mod-aciklama">Bilgisayara karşı teklif ver, takımını kur ve savaş.</span>
            <span class="mod-durum">OYNA →</span>
          </button>
          <button class="mod-kart" type="button" disabled aria-label="Online, yakında">
            <span class="mod-simge" aria-hidden="true">◎</span>
            <strong>ONLINE</strong>
            <span class="mod-aciklama">Arkadaşınla farklı bilgisayarlardan aynı mezata bağlan.</span>
            <span class="mod-durum">YAKINDA</span>
          </button>
        </div>
        <button id="modGeri" class="mod-geri" type="button">GERİ</button>
      </div>`;
    ana.insertAdjacentElement('afterend', ekran);

    const oyunAc = ana.querySelector('button[onclick*="lobiEkrani"]');
    if (oyunAc) {
      oyunAc.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (typeof ekranAc === 'function') ekranAc('modSecimEkrani');
      }, true);
    }
    document.getElementById('modOffline').addEventListener('click', () => {
      window.MezatBotModu = false;
      if (typeof ekranAc === 'function') ekranAc('lobiEkrani');
    });
    document.getElementById('modBot').addEventListener('click', () => {
      if (!window.MezatBot) {
        alert('bot.js yüklenemedi. Kurulum dosyasını yeniden çalıştır.');
        return;
      }
      window.MezatBotModu = true;
      window.MezatBot.ayarEkraniniAc();
    });
    document.getElementById('modGeri').addEventListener('click', () => {
      if (typeof ekranAc === 'function') ekranAc('anaEkran');
    });
    const lobiGeri = lobi.querySelector('button[onclick*="anaEkran"]');
    if (lobiGeri) lobiGeri.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (typeof ekranAc === 'function') ekranAc('modSecimEkrani');
    }, true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
