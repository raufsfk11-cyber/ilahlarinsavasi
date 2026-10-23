
const DB_ADI = "MezatVeritabani";
const DB_SURUMU = 2;

const KARAKTER_MAGAZASI = "karakterler";
const ILISKI_MAGAZASI = "iliskiler";

function veritabaniAc() {
    return new Promise((resolve, reject) => {
        const istek = indexedDB.open(DB_ADI, DB_SURUMU);

        istek.onupgradeneeded = () => {
            const db = istek.result;

            if (!db.objectStoreNames.contains(KARAKTER_MAGAZASI)) {
                db.createObjectStore(KARAKTER_MAGAZASI, {
                    keyPath: "id",
                    autoIncrement: true
                });
            }

            if (!db.objectStoreNames.contains(ILISKI_MAGAZASI)) {
                db.createObjectStore(ILISKI_MAGAZASI, {
                    keyPath: "id",
                    autoIncrement: true
                });
            }
        };

        istek.onsuccess = () => resolve(istek.result);
        istek.onerror = () => reject(istek.error);
        istek.onblocked = () => reject(
            new Error("Veritabanı başka sekmede açık.")
        );
    });
}

async function kayitlariGetir(magaza) {
    const db = await veritabaniAc();

    return new Promise((resolve, reject) => {
        const islem = db.transaction(magaza, "readonly");
        const istek = islem.objectStore(magaza).getAll();

        let sonuc = [];

        istek.onsuccess = () => {
            sonuc = istek.result;
        };

        islem.oncomplete = () => {
            db.close();
            resolve(sonuc);
        };

        islem.onerror = () => {
            db.close();
            reject(islem.error);
        };
    });
}

async function kayitKaydet(magaza, kayit) {
    const db = await veritabaniAc();

    return new Promise((resolve, reject) => {
        const islem = db.transaction(magaza, "readwrite");
        const istek = islem.objectStore(magaza).put(kayit);

        let id;

        istek.onsuccess = () => {
            id = istek.result;
        };

        islem.oncomplete = () => {
            db.close();
            resolve(id);
        };

        islem.onerror = () => {
            db.close();
            reject(islem.error);
        };
    });
}

function karakterleriGetir() {
    return kayitlariGetir(KARAKTER_MAGAZASI);
}

function iliskileriGetir() {
    return kayitlariGetir(ILISKI_MAGAZASI);
}

function karakterKaydet(karakter) {
    return kayitKaydet(KARAKTER_MAGAZASI, karakter);
}

function iliskiKaydet(iliski) {
    return kayitKaydet(ILISKI_MAGAZASI, iliski);
}

async function iliskiSil(id) {
    const db = await veritabaniAc();

    return new Promise((resolve, reject) => {
        const islem = db.transaction(ILISKI_MAGAZASI, "readwrite");

        islem.objectStore(ILISKI_MAGAZASI).delete(id);

        islem.oncomplete = () => {
            db.close();
            resolve();
        };

        islem.onerror = () => {
            db.close();
            reject(islem.error);
        };
    });
}

// Karakter silinirse o karaktere ait ilişkiler de silinir.
async function karakterSil(id) {
    const db = await veritabaniAc();

    return new Promise((resolve, reject) => {
        const islem = db.transaction(
            [KARAKTER_MAGAZASI, ILISKI_MAGAZASI],
            "readwrite"
        );

        islem.objectStore(KARAKTER_MAGAZASI).delete(id);

        const iliskiMagazasi = islem.objectStore(ILISKI_MAGAZASI);
        const istek = iliskiMagazasi.getAll();

        istek.onsuccess = () => {
            istek.result.forEach(iliski => {
                if (iliski.karakter1 === id ||
                    iliski.karakter2 === id) {
                    iliskiMagazasi.delete(iliski.id);
                }
            });
        };

        islem.oncomplete = () => {
            db.close();
            resolve();
        };

        islem.onerror = () => {
            db.close();
            reject(islem.error);
        };
    });
}
