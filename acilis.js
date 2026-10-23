/* Açılış videosu. Tarayıcılar sesli videoyu tıklamadan oynatmadığı için önce "izle" ekranı gelir. */
(() => {
    'use strict';
    const ekran = document.getElementById('acilisEkrani');
    if (!ekran) return;
    const video = ekran.querySelector('video');
    const ANAHTAR = 'acilisIzlendi';

    function izlendiMi() {
        try { return sessionStorage.getItem(ANAHTAR) === '1'; } catch { return false; }
    }

    function izlendiYap() {
        try { sessionStorage.setItem(ANAHTAR, '1'); } catch { /* gizli sekme vb. */ }
    }

    if (izlendiMi()) {
        ekran.remove();
        return;
    }

    let kapandi = false;
    function kapat() {
        if (kapandi) return;
        kapandi = true;
        izlendiYap();
        document.removeEventListener('keydown', tusla);
        ekran.classList.add('kapaniyor');
        setTimeout(() => {
            video.pause();
            video.removeAttribute('src');
            video.load();
            ekran.remove();
        }, 750);
    }

    function oynat() {
        if (ekran.classList.contains('oynuyor')) return;
        ekran.classList.add('oynuyor');
        video.muted = false;
        video.play().catch(() => {
            video.muted = true;
            video.play().catch(kapat);
        });
    }

    function tusla(e) {
        if (e.key === 'Escape') kapat();
        else if (e.target.tagName === 'BUTTON') return; // odaklı buton Enter/Boşlukla zaten tıklanır
        else if ((e.key === 'Enter' || e.key === ' ') && !ekran.classList.contains('oynuyor')) {
            e.preventDefault();
            oynat();
        }
    }

    ekran.querySelector('.acilis-giris').addEventListener('click', oynat);
    ekran.querySelector('.acilis-gec').addEventListener('click', kapat);
    video.addEventListener('ended', kapat);
    video.addEventListener('error', kapat);
    document.addEventListener('keydown', tusla);
})();
