/* MEZAT ana menü. Sadece IndexedDB'den okur, hiçbir kayıt değiştirmez. */
(() => {
    'use strict';
    const kartlar = Array.from(document.querySelectorAll('#anaEkran [data-menu-kart]'));
    if (!kartlar.length) return;
    const urlListesi = new Map();
    let karakterler = [];
    let siradaki = 0;
    let dongu = null;

    function karistir(liste) {
        const kopya = [...liste];
        for (let i = kopya.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [kopya[i], kopya[j]] = [kopya[j], kopya[i]];
        }
        return kopya;
    }

    function fotograf(k) {
        if (!(k.fotograf instanceof Blob)) return null;
        if (!urlListesi.has(k.id)) urlListesi.set(k.id, URL.createObjectURL(k.fotograf));
        return urlListesi.get(k.id);
    }

    function kartDoldur(kart, karakter) {
        kart.classList.remove('nadirlik-normal','nadirlik-nadir','nadirlik-epik','nadirlik-efsane');
        const n = String(karakter?.nadirlik || 'normal').trim().toLocaleLowerCase('tr-TR');
        kart.classList.add('nadirlik-' + (['normal','nadir','epik','efsane'].includes(n) ? n : 'normal'));
        const on = kart.querySelector('.menu-kart-on');
        on.replaceChildren();
        if (karakter) {
            const src = fotograf(karakter);
            if (src) {
                const img = document.createElement('img');
                img.src = src;
                img.alt = '';
                on.append(img);
                return;
            }
        }
        const ikon = document.createElement('span');
        ikon.textContent = '✦';
        ikon.style.fontSize = '60px';
        ikon.style.color = '#eac184';
        on.append(ikon);
    }

    function sonrakiKarakter() {
        if (!karakterler.length) return null;
        const k = karakterler[siradaki % karakterler.length];
        siradaki++;
        return k;
    }

    function kartDegistir(kart) {
        if (!karakterler.length || kart.classList.contains('donuyor')) return;
        kart.classList.add('donuyor');
        setTimeout(() => {
            if (!kart.isConnected) return;
            kartDoldur(kart, sonrakiKarakter());
        }, 450);
        setTimeout(() => kart.classList.remove('donuyor'), 1050);
    }

    async function baslat() {
        try {
            if (typeof karakterleriGetir !== 'function') throw new Error('Veritabanı bağlantısı bulunamadı');
            const kayitlar = await karakterleriGetir();
            karakterler = karistir(kayitlar);
            const sayac = document.getElementById('menuKarakterSayisi');
            if (sayac) sayac.textContent = karakterler.length;
            kartlar.forEach(kart => kartDoldur(kart, sonrakiKarakter()));
            if (karakterler.length > 4 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                dongu = setInterval(() => {
                    if (!document.getElementById('anaEkran')?.classList.contains('gizli')) {
                        kartDegistir(kartlar[Math.floor(Math.random() * kartlar.length)]);
                    }
                }, 4100);
            }
        } catch (hata) {
            console.warn('Ana menü kartları yüklenemedi:', hata);
            kartlar.forEach(kart => kartDoldur(kart, null));
            const sayac = document.getElementById('menuKarakterSayisi');
            if (sayac) sayac.textContent = '—';
        }
    }
    window.addEventListener('pagehide', () => {
        if (dongu) clearInterval(dongu);
        urlListesi.forEach(url => URL.revokeObjectURL(url));
    });
    baslat();
})();
