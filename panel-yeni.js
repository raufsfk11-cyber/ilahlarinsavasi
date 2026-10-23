/* MEZAT üst paneli: var olan oyun mantığını değiştirmeden HUD güncellemesi. */
(function () {
  const panel = document.getElementById('arenaHud');
  if (!panel) return;

  const temalar = {
    'neon-mor': ['#bc65ff', 'rgba(188,101,255,.23)'],
    'mor': ['#bc65ff', 'rgba(188,101,255,.23)'],
    'kirmizi': ['#ff6670', 'rgba(255,102,112,.2)'],
    'kırmızı': ['#ff6670', 'rgba(255,102,112,.2)'],
    'mavi': ['#59baff', 'rgba(89,186,255,.2)'],
    'altin': ['#f0bd67', 'rgba(240,189,103,.22)'],
    'altın': ['#f0bd67', 'rgba(240,189,103,.22)'],
    'yesil': ['#58d9ac', 'rgba(88,217,172,.2)'],
    'yeşil': ['#58d9ac', 'rgba(88,217,172,.2)']
  };
  function temaAnahtari(karakter) {
    const t = String(karakter?.tema || '').toLocaleLowerCase('tr-TR').trim();
    if (t && temalar[t]) return t;
    const k = String(karakter?.kategori || '').toLocaleUpperCase('tr-TR');
    if (k === 'SAVAŞÇI' || k === 'SUİKASTÇI') return 'kirmizi';
    if (k === 'TANK') return 'mavi';
    if (k === 'DESTEK') return 'yesil';
    if (karakter?.nadirlik === 'EFSANE') return 'altin';
    return 'neon-mor';
  }
  function guncelle() {
    if (typeof oyuncular === 'undefined' || !Array.isArray(oyuncular) || oyuncular.length !== 2) return;
    const tamamlanan = oyuncular.reduce((n, o) => n + o.takim.length, 0);
    const toplam = 10;
    const kalan = Math.max(0, toplam - tamamlanan);
    document.getElementById('arenaKalanYazi').textContent = `KALAN KARAKTER ${kalan} / ${toplam}`;
    const cubuklar = document.getElementById('arenaTurCubuklari');
    if (cubuklar.children.length !== toplam) {
      cubuklar.replaceChildren();
      for (let i = 0; i < toplam; i++) cubuklar.appendChild(document.createElement('span'));
    }
    [...cubuklar.children].forEach((c, i) => {
      c.classList.toggle('tamam', i < tamamlanan);
      c.classList.toggle('simdiki', i === tamamlanan && kalan > 0);
    });
    const k = typeof aktifKarakter !== 'undefined' ? aktifKarakter : null;
    const [renk, aura] = temalar[temaAnahtari(k)];
    panel.style.setProperty('--masa-rengi', renk);
    panel.style.setProperty('--masa-aura', aura);
    document.getElementById('arenaTemaAdi').textContent = 'MEZAT MASASI';
  }
  // Ana oyun her yeni lotta/teklifte arayuzuGuncelle çağırıyor.
  if (typeof arayuzuGuncelle === 'function') {
    const eski = arayuzuGuncelle;
    arayuzuGuncelle = function (...args) {
      const cevap = eski.apply(this, args);
      guncelle();
      return cevap;
    };
  }
  if (typeof ekranAc === 'function') {
    const eski = ekranAc;
    ekranAc = function (...args) {
      const cevap = eski.apply(this, args);
      guncelle();
      return cevap;
    };
  }
  window.addEventListener('resize', guncelle);
})();

/* ==============================================================
   MEZAT SAVAŞ SAHNESİ
   Eski savaş hesaplamasını korur, hazır sonucu animasyonlu gösterir.
   =============================================================== */
(function () {
  if (typeof savasiBaslat !== 'function') return;

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'savas-ekrani.css';
  document.head.appendChild(css);

  const orijinalSavas = savasiBaslat;
  let gosterimAcik = false;

  function etiket(t, metin, sinif) {
    const e = document.createElement(t);
    if (sinif) e.className = sinif;
    if (metin !== undefined) e.textContent = metin;
    return e;
  }

  function fotoEkle(k, hucre, kullanilanURLler) {
    if (k.fotograf instanceof Blob) {
      const adres = URL.createObjectURL(k.fotograf);
      kullanilanURLler.push(adres);
      const img = document.createElement('img');
      img.src = adres;
      img.alt = k.isim;
      img.onerror = () => {
        img.remove();
        hucre.prepend(document.createTextNode('⚔'));
      };
      hucre.appendChild(img);
    } else {
      hucre.appendChild(document.createTextNode('⚔'));
    }
    hucre.appendChild(etiket('span', k.isim));
  }

  function takimiOlustur(o, renk, kullanilanURLler) {
    const alan = etiket('section', undefined, 'ms-team ' + renk);
    alan.appendChild(etiket('div', o.isim.toLocaleUpperCase('tr-TR'), 'ms-team-name'));
    alan.appendChild(etiket('div', (renk === 'red' ? 'KIRMIZI' : 'MAVİ') + ' TAKIM • 5 KARAKTER', 'ms-team-tag'));
    const grid = etiket('div', undefined, 'ms-portraits');
    for (const k of o.takim) {
      const face = etiket('div', undefined, 'ms-face');
      fotoEkle(k, face, kullanilanURLler);
      grid.appendChild(face);
    }
    alan.appendChild(grid);
    return alan;
  }

  function turBilgisiGetir() {
    const kartlar = [...document.querySelectorAll('#turSonuclari .tur-kart')];
    return kartlar.map((kart, i) => {
      const ad = kart.querySelector('strong')?.textContent || `TUR ${i + 1}`;
      const sonuc = kart.querySelector('p')?.textContent || '';
      const isim = sonuc.replace(/^Kazanan:\s*/i, '').trim();
      const skor = kart.querySelector('.tur-skor')?.textContent || '';
      return { ad, isim, skor, kazananIndex: isim === oyuncular[0].isim ? 0 : 1 };
    });
  }

  function baslat() {
    const turlar = turBilgisiGetir();
    if (turlar.length !== 3 || oyuncular.some(o => o.takim.length !== 5)) {
      // Standart sonuç ekranı açık kalır.
      return;
    }

    gosterimAcik = true;
    const urls = [];
    const overlay = etiket('div');
    overlay.id = 'mezat-savas-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'MEZAT savaş sahnesi');

    const shell = etiket('div', undefined, 'ms-shell');
    overlay.appendChild(shell);
    const top = etiket('div', undefined, 'ms-top');
    top.appendChild(etiket('span', '⚔ MEZAT • SAVAŞ ARENASI'));
    const dots = etiket('div', undefined, 'ms-stepdots');
    for (let i = 0; i < 5; i++) dots.appendChild(etiket('i'));
    top.appendChild(dots);
    top.appendChild(etiket('span', '5 VS 5'));
    shell.appendChild(top);

    const title = etiket('h1', '', 'ms-title');
    const sub = etiket('p', '', 'ms-sub');
    shell.append(title, sub);

    const duel = etiket('div', undefined, 'ms-duel');
    const left = takimiOlustur(oyuncular[0], 'blue', urls);
    const middle = etiket('div', 'VS', 'ms-middle');
    const right = takimiOlustur(oyuncular[1], 'red', urls);
    duel.append(left, middle, right);
    shell.appendChild(duel);

    const scores = etiket('div', undefined, 'ms-score');
    const blueScore = etiket('span', '0', 'blue');
    const redScore = etiket('span', '0', 'red');
    scores.append(blueScore, etiket('span', '-'), redScore);
    shell.appendChild(scores);

    // Tur puanlarını iki renkli çubukla gösterir; skor metni .tur-skor'dan okunur.
    const cubuk = etiket('div', undefined, 'ms-guc-cubugu gizli');
    const cubukMavi = etiket('span', '', 'blue'), cubukKirmizi = etiket('span', '', 'red');
    cubuk.append(cubukMavi, cubukKirmizi);
    shell.appendChild(cubuk);

    const story = etiket('div', '', 'ms-story');
    shell.appendChild(story);
    // Olay ve iddaa oranları; sonuç ekranındaki metinlerden gelir (online misafirde de vardır).
    const bilgi = etiket('div', undefined, 'ms-bilgi');
    ['pasif', 'olay', 'oran'].forEach(sinif => {
      const metin = document.querySelector('#sonucEkstra .' + sinif)?.textContent;
      if (metin) bilgi.appendChild(etiket('p', metin, sinif));
    });
    shell.appendChild(bilgi);
    const bonus = etiket('div', '', 'ms-bonus');
    shell.appendChild(bonus);
    const foot = etiket('div', undefined, 'ms-foot');
    const button = etiket('button', 'SAVAŞI BAŞLAT ⚔️');
    foot.appendChild(button);
    shell.appendChild(foot);

    const toplam = [0, 0];
    let asama = 0;
    const bonusMetni = oyuncular.map(o => {
      if (typeof takimKimyasi !== 'function') return '';
      const kimya = takimKimyasi(o.takim);
      // Özellik, olay sonrası hesaplanan sonuç kartından okunur ki iki ekran aynı şeyi söylesin.
      const kart = [...document.querySelectorAll('#sonucKartlari .sonuc-kart')][oyuncular.indexOf(o)];
      const ozMetni = [...(kart?.querySelectorAll('p') || [])].map(p => p.textContent).find(t => t.includes('Takım özelliği:'));
      const oz = ozMetni ? ozMetni.split(' (')[0].replace('Takım özelliği: ', '') : '';
      return o.isim + ' • ' + (kimya.bonus >= 0 ? '+' : '') + kimya.bonus + ' takım uyumu' + (o.para ? ' • 💰 +' + o.para * (typeof PARA_GUC_BONUSU === 'number' ? PARA_GUC_BONUSU : 0) + ' GÜÇ' : '') + (oz ? ' • ' + oz : '');
    }).join('     |     ');

    function kapat() {
      overlay.remove();
      urls.forEach(url => URL.revokeObjectURL(url));
      gosterimAcik = false;
      // Orijinal savaş fonksiyonu sonuç ekranını zaten açtı.
      document.getElementById('sonucEkrani')?.classList.remove('gizli');
    }

    function ciz() {
      [...dots.children].forEach((e, i) => e.classList.toggle('on', i <= asama));
      shell.classList.remove('ms-flash');
      void shell.offsetWidth;
      shell.classList.add('ms-flash');
      bonus.textContent = bonusMetni;
      bilgi.classList.toggle('gizli', asama !== 0);
      const skor = asama >= 1 && asama <= 3 ? (turlar[asama - 1].skor.match(/(\d+)\s*–\s*(\d+)/) || []).slice(1).map(Number) : [];
      cubuk.classList.toggle('gizli', skor.length !== 2);
      if (skor.length === 2) {
        const oran = skor[0] + skor[1] ? skor[0] / (skor[0] + skor[1]) : .5;
        cubukMavi.textContent = skor[0];
        cubukKirmizi.textContent = skor[1];
        // Önce ortada başlar, sonra gerçek orana kayar.
        cubukMavi.style.width = '50%';
        cubukKirmizi.style.width = '50%';
        requestAnimationFrame(() => requestAnimationFrame(() => {
          cubukMavi.style.width = (oran * 100).toFixed(1) + '%';
          cubukKirmizi.style.width = ((1 - oran) * 100).toFixed(1) + '%';
        }));
      }

      if (asama === 0) {
        title.textContent = 'SAVAŞ BAŞLIYOR';
        sub.textContent = 'İki takım karşı karşıya. Üç turun galibi MEZAT şampiyonu olacak.';
        const buyular = typeof buyuOzetiMetni === 'function' ? buyuOzetiMetni() : '';
        story.textContent = 'Hazır mısınız? Takımlar kuruldu, dostluklar ve düşmanlıklar hesaplandı.' + (buyular ? ' 🔮 Büyüler: ' + buyular : '');
        button.textContent = '1. TURU GÖSTER →';
        blueScore.textContent = '0';
        redScore.textContent = '0';
        return;
      }
      if (asama >= 1 && asama <= 3) {
        const tur = turlar[asama - 1];
        toplam[tur.kazananIndex]++;
        title.textContent = tur.ad.replace(/^TUR\s*\d+\s*•\s*/i, '');
        sub.textContent = `TUR ${asama} / 3`;
        story.textContent = `🏆 Bu turun kazananı: ${tur.isim}${tur.skor ? ' (' + tur.skor + ')' : ''}. ${asama === 3 ? 'Final sonucu belli oluyor!' : 'Mücadele devam ediyor.'}`;
        blueScore.textContent = toplam[0];
        redScore.textContent = toplam[1];
        button.textContent = asama === 3 ? 'ZAFER EKRANI →' : 'SONRAKİ TUR →';
        return;
      }
      const galip = toplam[0] > toplam[1] ? 0 : 1;
      title.textContent = '🏆 ZAFER!';
      sub.textContent = oyuncular[galip].isim.toLocaleUpperCase('tr-TR') + ' KAZANDI';
      const ek = sinif => document.querySelector('#sonucEkstra .' + sinif)?.textContent || '';
      story.textContent = `${oyuncular[0].isim} ${toplam[0]} - ${toplam[1]} ${oyuncular[1].isim}. Kazanan takım kupayı kaldırdı!` + [ek('mvp'), ek('surpriz')].filter(Boolean).map(m => ' ' + m).join('');
      button.textContent = 'AYRINTILI SONUÇLARI GÖR →';
    }

    button.addEventListener('click', () => {
      if (asama === 4) { kapat(); return; }
      asama++;
      ciz();
    });

    // Tur hesabı zaten yapıldı, burada yalnızca sunumu sırayla gösteriyoruz.
    ciz();
    document.body.appendChild(overlay);
  }

  savasiBaslat = function (...args) {
    if (gosterimAcik) return;
    const dahaOnceBitti = typeof oyunBitti !== 'undefined' && oyunBitti;
    const animasyonVar = typeof animasyonDevamEdiyor !== 'undefined' && animasyonDevamEdiyor;
    if (dahaOnceBitti || animasyonVar) return;
    const sonuc = orijinalSavas.apply(this, args);
    if (typeof oyunBitti !== 'undefined' && oyunBitti) {
      try { baslat(); } catch (err) {
        console.error('Savaş sahnesi gösterilemedi; standart sonuç ekranı açık.', err);
      }
    }
    return sonuc;
  };

  // Online misafir savaşı kendisi hesaplamaz; hazır sonuç DOM'a yazılınca sahneyi açar.
  window.MezatSavasSahnesi = function () {
    if (gosterimAcik) return;
    try { baslat(); } catch (err) {
      console.error('Savaş sahnesi gösterilemedi; standart sonuç ekranı açık.', err);
    }
  };
})();
