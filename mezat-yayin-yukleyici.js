/* MEZAT: GitHub'da yayinlanan karakterleri yerel degisikliklerle birlestirir. */
(function () {
  'use strict';
  const kaynak = window.MezatYayinVerileri;
  if (!kaynak || !Array.isArray(kaynak.karakterler)) return;
  if (typeof karakterleriGetir !== 'function' || typeof iliskileriGetir !== 'function') return;

  const asilKarakterleriGetir = karakterleriGetir;
  const asilIliskileriGetir = iliskileriGetir;
  let yayinKarakterleriPromise;

  async function yayinKarakterleriniAl() {
    if (!yayinKarakterleriPromise) {
      yayinKarakterleriPromise = Promise.all(kaynak.karakterler.map(async kayit => {
        const karakter = { ...kayit };
        if (karakter.fotoDosya) {
          try {
            const cevap = await fetch(karakter.fotoDosya);
            if (!cevap.ok) throw new Error('HTTP ' + cevap.status);
            karakter.fotograf = await cevap.blob();
          } catch (hata) {
            console.warn('MEZAT: fotograf alinamadi', karakter.id, hata);
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
    const [yayin, yerel] = await Promise.all([
      yayinKarakterleriniAl(), asilKarakterleriGetir()
    ]);
    // Ayni ID varsa tarayicida kaydedilen duzenleme onceliklidir.
    const birlesik = new Map(yayin.map(k => [String(k.id), k]));
    yerel.forEach(k => birlesik.set(String(k.id), k));
    return Array.from(birlesik.values());
  };

  window.iliskileriGetir = async function () {
    const yerel = await asilIliskileriGetir();
    const birlesik = new Map((kaynak.iliskiler || []).map(i => [String(i.id), { ...i }]));
    yerel.forEach(i => birlesik.set(String(i.id), i));
    return Array.from(birlesik.values());
  };
})();
