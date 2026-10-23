/* MEZAT: Tarayicinin yerel karakterleri bos ise yayin verilerini okur. */
(function () {
  'use strict';
  const kaynak = window.MezatYayinVerileri;
  if (!kaynak || !Array.isArray(kaynak.karakterler)) return;
  if (typeof karakterleriGetir !== 'function' || typeof iliskileriGetir !== 'function') return;
  const asilKarakterleriGetir = karakterleriGetir;
  const asilIliskileriGetir = iliskileriGetir;
  let yayinKarakterleriPromise = null;
  let yayinVerisiEtkin = false;

  async function yayinKarakterleriniAl() {
    if (!yayinKarakterleriPromise) {
      yayinKarakterleriPromise = Promise.all(kaynak.karakterler.map(async (kayit) => {
        const karakter = { ...kayit };
        if (karakter.fotoDosya) {
          try {
            const cevap = await fetch(karakter.fotoDosya);
            if (!cevap.ok) throw new Error('Fotograf yuklenemedi: ' + cevap.status);
            karakter.fotograf = await cevap.blob();
          } catch (hata) {
            console.warn('MEZAT fotograf:', karakter.id, hata);
            karakter.fotograf = null;
          }
          delete karakter.fotoDosya;
        }
        return karakter;
      }));
    }
    return yayinKarakterleriPromise;
  }

  window.karakterleriGetir = async function () {
    const yerel = await asilKarakterleriGetir();
    if (yerel.length) {
      yayinVerisiEtkin = false;
      return yerel;
    }
    yayinVerisiEtkin = true;
    return yayinKarakterleriniAl();
  };

  window.iliskileriGetir = async function () {
    const yerelIliskiler = await asilIliskileriGetir();
    if (!yayinVerisiEtkin) return yerelIliskiler;
    return kaynak.iliskiler.map(x => ({ ...x }));
  };
})();
