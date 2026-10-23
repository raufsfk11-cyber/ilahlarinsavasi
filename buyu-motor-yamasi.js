/* MEZAT buyu motoru uzantisi. buyuler.js dosyasindan SONRA yukleyin.
   Buyu Atolyesi ayarlarini BUYULER'e yukler. Hesaplama ve ekranlar buyuler.js'teki
   fonksiyonlarla yapilir; her buyunun bonus/ceza puani oradan okunur. */
(()=>{'use strict';
const key='mezat_buyu_atolyesi_v1';
let settings=null;try{settings=JSON.parse(localStorage.getItem(key));}catch{}
// Atolyede kaydedilen ayar bu tarayicida oyunda da gecerlidir; yoksa yayindaki dosya kullanilir.
// Online macta oda sahibinin buyu tanimlari misafire ayrica gonderilir (online.js).
const published=window.MEZAT_BUYU_YAYIN;
const data=settings&&typeof settings==='object'&&Object.keys(settings).length?settings:published;
if(!data||typeof BUYULER==='undefined')return;
const etiketAdlari={alkol:'Alkol bağımlısı',kadin:'Kadın düşkünü',iddia:'İddia bağımlısı',gurbet:'Gurbetçi'};
const isValid=b=>b&&['alkol','kadin','iddia','gurbet'].includes(b.etiket)&&['guc','savunma','hiz','zeka'].includes(b.stat)&&Number.isFinite(+b.bonus)&&Number.isFinite(+b.ceza);
const yeni={};
Object.entries(data).forEach(([id,b])=>{if(!/^[a-z0-9_-]{1,40}$/.test(id)||!isValid(b))return;yeni[id]={ad:String(b.ad).slice(0,65),simge:String(b.simge).slice(0,15),etiket:b.etiket,etiketAdi:etiketAdlari[b.etiket],stat:b.stat,gorsel:typeof b.gorsel==='string'&&b.gorsel.trim()?b.gorsel.trim():'buyu-gorselleri/'+id,bonus:Math.max(0,Math.min(200,+b.bonus)),ceza:Math.max(0,Math.min(200,+b.ceza))};});
// Gecerli buyu yoksa varsayilan buyuler kalir; oyun buyusuz kalmasin.
if(!Object.keys(yeni).length)return;
for(const k of Object.keys(BUYULER))delete BUYULER[k];
Object.assign(BUYULER,yeni);
})();
