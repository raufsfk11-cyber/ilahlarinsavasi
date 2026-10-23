const BASLANGIC_PARASI=20, TAKIM_LIMITI=5;
const el=id=>document.getElementById(id);
let oyuncular=[],havuz=[],tumKarakterler=[],tumIliskiler=[],aktifKarakter=null,aktifFotoURL=null;
let lot=0,sira=0,teklif=0,teklifSahibi=-1,paslar=new Set(),lotBitti=false,oyunBitti=false,animasyonDevamEdiyor=false;
let mezatModu='acik',secimYapan=-1;
const fotoURLleri=new Map();
async function verileriYukle(){tumKarakterler=await karakterleriGetir();tumIliskiler=iliskileriSabitle(await iliskileriGetir());el('havuzBilgisi').textContent='Kayıtlı karakter sayısı: '+tumKarakterler.length;}
verileriYukle().catch(e=>{console.error(e);el('havuzBilgisi').textContent='Karakterler yüklenemedi.';});
function nadirlikSinifi(s){const n=String(s||'normal').toLocaleLowerCase('tr-TR');return ['nadir','epik','efsane'].includes(n)?n:'normal';}
function ekranAc(id){document.querySelectorAll('.ekran').forEach(e=>e.classList.add('gizli'));el(id).classList.remove('gizli');if(id==='lobiEkrani')verileriYukle().catch(console.error);}
async function oyunuBaslat(){
 const isim1=el('isim1').value.trim(),isim2=el('isim2').value.trim();
 if(!isim1||!isim2){alert('İki oyuncunun da adını yaz.');return;}
 if(isim1.toLocaleLowerCase('tr-TR')===isim2.toLocaleLowerCase('tr-TR')){alert('Oyuncu isimleri farklı olmalı.');return;}
 try{await verileriYukle();}catch(e){alert('Karakterler yüklenemedi.');return;}
 if(tumKarakterler.length<10){alert('5’e 5 savaş için en az 10 kayıtlı karakter gerekli. Şu an '+tumKarakterler.length+' var.');return;}
 oyuncular=[isim1,isim2].map(isim=>({isim,para:BASLANGIC_PARASI,takim:[]}));
 havuz=[...tumKarakterler];for(let i=havuz.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[havuz[i],havuz[j]]=[havuz[j],havuz[i]];}
 lot=0;teklif=0;teklifSahibi=-1;paslar=new Set();lotBitti=false;oyunBitti=false;animasyonDevamEdiyor=false;
 aktifBuyuler=buyuleriSec();
 ekranAc('mezatEkrani');yeniLot();buyuTanitimiGoster();
}
function iliskiBul(a,b){return tumIliskiler.find(i=>(i.karakter1===a&&i.karakter2===b)||(i.karakter1===b&&i.karakter2===a));}
function takimKimyasi(takim){let bonus=0;const olaylar=[];for(let i=0;i<takim.length;i++)for(let j=i+1;j<takim.length;j++){
 const a=takim[i],b=takim[j],il=iliskiBul(a.id,b.id);if(!il)continue;const puan=Number(il.bonus)||0;bonus+=puan;
 olaylar.push({metin:`${a.isim} + ${b.isim}: ${puan>0?'+':''}${puan} (${il.neden||''})`,puan});}
 return {bonus,olaylar};}
const bosYerVar=i=>oyuncular[i].takim.length<TAKIM_LIMITI;
const takimlarTamam=()=>oyuncular.every(o=>o.takim.length===TAKIM_LIMITI);
const satinAlabilir=i=>!!oyuncular[i]&&bosYerVar(i)&&oyuncular[i].para>=1;
const teklifVerebilir=i=>mezatModu==='acik'&&!lotBitti&&satinAlabilir(i)&&!paslar.has(i)&&i!==teklifSahibi&&oyuncular[i].para>teklif;
function siradakiOyuncuyuBul(b){for(let j=0;j<2;j++){const i=(b+j)%2;if(teklifVerebilir(i))return i;}return -1;}
function yeniLot(){
 if(oyunBitti||animasyonDevamEdiyor)return;if(takimlarTamam()){savasiBaslat();return;}
 if(!havuz.length){alert('Karakter havuzu tükendi, takımlar tamamlanamadı.');return;}
 aktifKarakter=havuz.pop();lot++;teklif=0;teklifSahibi=-1;paslar=new Set();lotBitti=false;secimYapan=-1;
 const t0=satinAlabilir(0),t1=satinAlabilir(1),b0=bosYerVar(0),b1=bosYerVar(1);
 if(t0&&t1){mezatModu='acik';sira=(lot-1)%2;el('spiker').textContent=aktifKarakter.isim+' açık artırmada! Açılış 1 ₺.';arayuzuGuncelle();return;}
 if(t0&&b1){mezatModu='secim';secimYapan=sira=0;el('spiker').textContent=oyuncular[0].isim+' seçiyor: Takımına al veya rakibe ver.';arayuzuGuncelle();return;}
 if(t1&&b0){mezatModu='secim';secimYapan=sira=1;el('spiker').textContent=oyuncular[1].isim+' seçiyor: Takımına al veya rakibe ver.';arayuzuGuncelle();return;}
 // Bir takım dolmuşsa kalanlar mecburen karşı tarafa gider.
 if(b0&&!b1){otomatikKarakterVer(0);return;}if(b1&&!b0){otomatikKarakterVer(1);return;}
 // Her ikisinin de bütçesi bitti: boş yuvası daha çok olana sırayla dağıt.
 if(b0&&b1){const a=oyuncular[0].takim.length,b=oyuncular[1].takim.length;otomatikKarakterVer(a<b?0:b<a?1:(lot-1)%2);return;}
 savasiBaslat();
}
function teklifVer(artis){if(lotBitti||oyunBitti||!teklifVerebilir(sira))return;const yeni=teklif+artis;if(yeni>oyuncular[sira].para)return;teklif=yeni;teklifSahibi=sira;el('spiker').textContent=oyuncular[sira].isim+' ₺'+teklif+' teklif etti!';turIlerle();}
function hepsiniVer(){if(lotBitti||oyunBitti||mezatModu!=='acik')return;const artis=oyuncular[sira].para-teklif;if(artis>0)teklifVer(artis);}
function pasGec(){if(lotBitti||oyunBitti||mezatModu!=='acik'||teklifSahibi===-1)return;paslar.add(sira);el('spiker').textContent=oyuncular[sira].isim+' pas geçti.';turIlerle();}
function turIlerle(){const sonraki=siradakiOyuncuyuBul((sira+1)%2);if(sonraki===-1){lotuBitir();return;}sira=sonraki;arayuzuGuncelle();}
function lotuBitir(){if(lotBitti||teklifSahibi===-1)return;karakteriDagit(teklifSahibi,teklif,'satın aldı');}
function karakterSec(hedef){if(lotBitti||oyunBitti||mezatModu!=='secim'||!bosYerVar(hedef))return;const aciklama=hedef===secimYapan?'takımına aldı':oyuncular[secimYapan].isim+' tarafından rakibine verildi';karakteriDagit(hedef,0,aciklama);}
function otomatikKarakterVer(hedef){mezatModu='otomatik';sira=hedef;arayuzuGuncelle();karakteriDagit(hedef,0,'ücretsiz olarak takıma katıldı');}
function karakteriDagit(hedef,fiyat,aciklama){
 if(lotBitti||oyunBitti||!bosYerVar(hedef)||fiyat>oyuncular[hedef].para)return;
 lotBitti=true;const o=oyuncular[hedef],k=aktifKarakter,slot=o.takim.length;o.para-=fiyat;o.takim.push(k);
 el('spiker').textContent=`${k.isim} → ${o.isim}: ${aciklama}${fiyat?' (₺'+fiyat+')':''}`;
 arayuzuGuncelle();animasyonDevamEdiyor=true;
 const kart=document.querySelector('#mezatEkrani .karakter-kart');kart?.classList.add('satildi-efekt');
 sonrakiLotButonuGoster();satinAlmaAnimasyonu(k,hedef,slot);
}
function sonrakiLotButonuGoster(){const alan=el('teklifButonlari');alan.replaceChildren();const b=document.createElement('button');b.className='altin';b.textContent=takimlarTamam()?'SAVAŞA GEÇ ⚔️':'SONRAKİ KARAKTER →';b.disabled=animasyonDevamEdiyor;b.onclick=()=>{if(animasyonDevamEdiyor)return;takimlarTamam()?savasiBaslat():yeniLot();};alan.append(b);}
function butonOlustur(yazi,fonk,cls='',disabled=false){const b=document.createElement('button');b.textContent=yazi;b.className=cls;b.disabled=disabled;b.onclick=fonk;return b;}
function butonlariYenile(){const alan=el('teklifButonlari');alan.replaceChildren();if(mezatModu==='otomatik')return;
 if(mezatModu==='secim'){const secen=secimYapan,rakip=1-secen;if(bosYerVar(secen))alan.append(butonOlustur('✅ TAKIMIMA AL',()=>karakterSec(secen),'altin'));if(bosYerVar(rakip))alan.append(butonOlustur('↗ RAKİBE VER',()=>karakterSec(rakip),'pas'));return;}
 const max=oyuncular[sira].para-teklif;
 [1,2,5].forEach(n=>alan.append(butonOlustur('AÇ +'+n,()=>teklifVer(n),'',max<n)));
 alan.append(butonOlustur('HEPSİ',hepsiniVer,'altin',max<1),butonOlustur('BIRAK',pasGec,'pas',teklifSahibi===-1));
}
function fotoAdresi(k){if(!(k.fotograf instanceof Blob))return null;const key=k.id;if(!fotoURLleri.has(key))fotoURLleri.set(key,URL.createObjectURL(k.fotograf));return fotoURLleri.get(key);}
function fotografGoster(k){const alan=el('karakterResmi');alan.replaceChildren();const src=fotoAdresi(k);if(src){const img=document.createElement('img');img.src=src;img.alt=k.isim;img.onerror=()=>{alan.textContent='⚔️';};alan.append(img);}else alan.textContent='⚔️';}
function slotFotografiEkle(yuva,k){const src=fotoAdresi(k);if(src){const img=document.createElement('img');img.src=src;img.alt=k.isim;img.onerror=()=>{yuva.textContent=k.isim[0]||'?';};yuva.append(img);}else{const span=document.createElement('span');span.className='yuva-harf';span.textContent=k.isim[0]||'?';yuva.append(span);}}
function satinAlmaAnimasyonu(k,oyuncuIndex,slotIndex){
 const kaynak=el('karakterResmi'),hedef=el('takim'+(oyuncuIndex+1))?.children[slotIndex];
 const bitir=()=>{animasyonDevamEdiyor=false;if(hedef?.isConnected){hedef.classList.remove('varis-efekti');void hedef.offsetWidth;hedef.classList.add('varis-efekti');}const b=el('teklifButonlari').querySelector('button');if(b&&lotBitti)b.disabled=false;};
 if(!kaynak||!hedef||window.matchMedia('(prefers-reduced-motion: reduce)').matches){bitir();return;}
 const a=kaynak.getBoundingClientRect(),z=hedef.getBoundingClientRect(),ucus=document.createElement('div');ucus.className='flying-kart nadirlik-'+nadirlikSinifi(k.nadirlik);
 Object.assign(ucus.style,{left:a.left+'px',top:a.top+'px',width:a.width+'px',height:a.height+'px'});
 const src=fotoAdresi(k);if(src){const img=document.createElement('img');img.src=src;img.alt=k.isim;ucus.append(img);}else{const d=document.createElement('div');d.className='fallback';d.textContent='⚔️';ucus.append(d);}
 document.body.append(ucus);requestAnimationFrame(()=>requestAnimationFrame(()=>Object.assign(ucus.style,{left:z.left+'px',top:z.top+'px',width:z.width+'px',height:z.height+'px',opacity:'.12',transform:'rotate(8deg)'})));
 setTimeout(()=>{ucus.remove();bitir();},850);
}
function oyuncuGuncelle(index){const o=oyuncular[index],n=index+1;el('ad'+n).textContent=o.isim.toLocaleUpperCase('tr-TR');el('para'+n).textContent='₺'+o.para;
 el('paraBar'+n).style.width=Math.max(0,Math.min(100,o.para/BASLANGIC_PARASI*100))+'%';
 el('sira'+n).classList.toggle('kapali',lotBitti||index!==sira);
 const oz=takimOzelligi(savasTakimi(index).takim),ozEt=el('ozellik'+n),paraNotu=`Harcanmayan ₺${o.para}, savaşta her karaktere +${o.para*PARA_GUC_BONUSU} GÜÇ verir.`;ozEt.textContent=oz?`${oz.simge} ${oz.ad} • OVR ${takimOverall(o.takim)} • 💰+${o.para*PARA_GUC_BONUSU} GÜÇ`:`💰 +${o.para*PARA_GUC_BONUSU} GÜÇ`;ozEt.title=oz?`${oz.stat} toplamı ${oz.toplamlar[oz.anahtar]}. ${oz.aciklama} ${TAKIM_OZELLIKLERI[oz.yener].stat} özelliğini yener. ${paraNotu}`:paraNotu;
 const alan=el('takim'+n);alan.replaceChildren();for(let i=0;i<TAKIM_LIMITI;i++){const d=document.createElement('div');d.className='yuva';d.dataset.slot=i;const k=o.takim[i];if(k){d.classList.add('dolu','nadirlik-'+nadirlikSinifi(k.nadirlik));d.title=k.isim;slotFotografiEkle(d,k);}else{d.textContent=String(i+1).padStart(2,'0');if(i===o.takim.length)d.classList.add('ilk-bos');}alan.append(d);}}
function iliskiUyarilariniGoster(){const alan=el('iliskiUyarilari');alan.replaceChildren();let count=0;oyuncular.forEach(o=>o.takim.forEach(k=>{const il=iliskiBul(aktifKarakter.id,k.id);if(!il)return;count++;const p=Number(il.bonus)||0,poz=p>=0,d=document.createElement('div');d.className='iliski-uyari '+(poz?'dostluk':'rekabet');const strong=document.createElement('strong');const tip=ILISKI_TURLERI[il.tur];strong.textContent=(tip?tip.simge+' '+tip.ad+' ':poz?'🤝 ':'⚔️ ')+(p>0?'+':'')+p+' • '+k.isim;const t=document.createElement('p');t.textContent=o.isim+' takımında '+k.isim+' var. Aynı takıma katılırsa '+(poz?'dostluk bonusu':'uyum cezası')+' uygulanır. Neden: '+(il.neden||'');d.append(strong,t);alan.append(d);}));if(!count)alan.textContent='Mevcut takımlarla bilinen ilişki yok.';}
function istatistikGoster(ad,value){const n=Number(value)||0;el(ad).textContent=n;el(ad+'Bar').style.width=Math.min(100,Math.max(0,n))+'%';}
function karakterTemasi(k){
 const bil=el('karakterBilgi');bil.classList.remove('tema-neon-mor','tema-kirmizi','tema-mavi','tema-altin','tema-yesil');
 const izin=['neon-mor','kirmizi','mavi','altin','yesil'];let tema=String(k.tema||'').trim().toLocaleLowerCase('tr-TR');
 if(!izin.includes(tema)){const kat=String(k.kategori||'').toLocaleUpperCase('tr-TR');tema=kat==='SAVAŞÇI'||kat==='SUİKASTÇI'?'kirmizi':kat==='TANK'?'mavi':kat==='DESTEK'?'yesil':kat==='TAKTİKÇİ'||kat==='BÜYÜCÜ'?'neon-mor':'altin';}
 bil.classList.add('tema-'+tema);
 const lakap=(String(k.lakap||'').trim()||k.isim).toLocaleUpperCase('tr-TR');const arka=el('lakapArka');arka.textContent=lakap;arka.dataset.text=lakap;
 // Çok uzun lakapları sınırla, küçük karakterler ise daha büyük görülebilir.
 arka.style.fontSize=lakap.length>17?'clamp(65px, 9vw, 140px)':lakap.length>10?'clamp(85px, 12vw, 195px)':'clamp(110px, 16vw, 270px)';
}
function arayuzuGuncelle(){oyuncuGuncelle(0);oyuncuGuncelle(1);const k=aktifKarakter;
 el('karakterAdi').textContent=k.isim;el('kartIsim').textContent=k.isim;
 const resim=el('karakterResmi');if(resim.dataset.karakterId!==String(k.id)){fotografGoster(k);resim.dataset.karakterId=String(k.id);}
 const kart=document.querySelector('#mezatEkrani .karakter-kart');kart.classList.remove('nadirlik-normal','nadirlik-nadir','nadirlik-epik','nadirlik-efsane','satildi-efekt');kart.classList.add('nadirlik-'+nadirlikSinifi(k.nadirlik));
 karakterTemasi(k);el('kartKategori').textContent=k.kategori||'KARAKTER';el('kartNadirlik').textContent=k.nadirlik||'NORMAL';
 const lotMetin='LOT '+String(lot).padStart(2,'0');el('kartLot').textContent=lotMetin;el('lotUst').textContent=lotMetin;el('lotSayaci').textContent='LOT '+lot+' / '+tumKarakterler.length;
 el('karakterHikaye').textContent=k.hikaye||'Henüz hikâye eklenmemiş.';
 ['guc','savunma','hiz','zeka'].forEach(key=>istatistikGoster(key,k[key]));istatistikGoster('overall',overallAl(k));el('fiyatYazisi').textContent='₺'+teklif;el('teklifVeren').textContent=teklifSahibi===-1?'Henüz teklif yok':oyuncular[teklifSahibi].isim;
 el('siraYazisi').textContent=lotBitti?'KARAKTER DAĞITILDI':mezatModu==='secim'?'SEÇİM: '+oyuncular[secimYapan].isim.toLocaleUpperCase('tr-TR'):mezatModu==='otomatik'?'OTOMATİK DAĞITIM':'SIRA: '+oyuncular[sira].isim.toLocaleUpperCase('tr-TR');
 el('kartOvr').textContent=overallAl(k);karakterEtiketleriniGoster(k);buyuAlaniniGuncelle();
 iliskiUyarilariniGoster();if(!lotBitti)butonlariYenile();
}
const savasTurlari=[{ad:'SALDIRI ÇATIŞMASI',agirlik:{guc:1.5,savunma:.35,hiz:.7,zeka:.3}},{ad:'SAVUNMA VE TAKTİK',agirlik:{guc:.35,savunma:1.5,hiz:.3,zeka:.75}},{ad:'SON KARŞILAŞMA',agirlik:{guc:.7,savunma:.45,hiz:1.2,zeka:.9}}];
// Harcanmayan her ₺, savaşta takımdaki her karaktere bu kadar GÜÇ verir.
const PARA_GUC_BONUSU=1;
// Büyüler ve artan para uygulanmış takım kopyası; asıl kayıtlar değişmez.
function savasTakimi(i){const b=buyuluTakim(i,takimlarAl()),paraBonusu=oyuncular[i].para*PARA_GUC_BONUSU;if(paraBonusu)b.takim.forEach(k=>k.guc=(Number(k.guc)||0)+paraBonusu);return {...b,paraBonusu};}
// Takım özelliği yalnızca stat puanını çarpar; ilişki bonusu ve şans sabit kalır.
function performansHesapla(o,t,turIndex,rakip){const a=t.agirlik;let p=0;o.takim.forEach(k=>p+=(Number(k.guc)||0)*a.guc+(Number(k.savunma)||0)*a.savunma+(Number(k.hiz)||0)*a.hiz+(Number(k.zeka)||0)*a.zeka);
 p*=ozellikCarpani(takimOzelligi(o.takim)?.anahtar,takimOzelligi(rakip.takim)?.anahtar,turIndex);return p+takimKimyasi(o.takim).bonus+(Math.random()*60-30)*o.takim.length;}
function savasiBaslat(){if(oyunBitti||animasyonDevamEdiyor)return;if(!takimlarTamam()){alert('Savaş için iki takımın da 5 karakteri olmalı.');return;}oyunBitti=true;
 // Savaş, büyüler ve artan para uygulanmış takım kopyalarıyla yapılır.
 const buyulu=[0,1].map(savasTakimi),savascilar=oyuncular.map((o,i)=>({...o,takim:buyulu[i].takim}));
 const kazan=[0,0],sonuclar=[];savasTurlari.forEach((tur,i)=>{const a=performansHesapla(savascilar[0],tur,i,savascilar[1]),b=performansHesapla(savascilar[1],tur,i,savascilar[0]);const kim=a===b?(Math.random()<.5?0:1):(a>b?0:1);kazan[kim]++;sonuclar.push({ad:tur.ad,tur:i+1,kazanan:oyuncular[kim].isim,skor:[a,b].map(Math.round)});});
 const kazanan=kazan[0]>kazan[1]?0:1;el('kazananYazisi').textContent='🏆 '+oyuncular[kazanan].isim.toLocaleUpperCase('tr-TR')+' KAZANDI!';el('savasOzeti').textContent=oyuncular[0].isim+' '+kazan[0]+' - '+kazan[1]+' '+oyuncular[1].isim;
 const turAlan=el('turSonuclari');turAlan.replaceChildren();sonuclar.forEach(t=>{const d=document.createElement('div');d.className='tur-kart';const b=document.createElement('strong'),p=document.createElement('p');b.textContent='TUR '+t.tur+' • '+t.ad;p.textContent='Kazanan: '+t.kazanan;const s=document.createElement('small');s.className='tur-skor';s.textContent=`${oyuncular[0].isim} ${t.skor[0]} – ${t.skor[1]} ${oyuncular[1].isim}`;d.append(b,p,s);turAlan.append(d);});
 const alan=el('sonucKartlari');alan.replaceChildren();oyuncular.forEach((o,oi)=>{const d=document.createElement('div');d.className='sonuc-kart';const b=document.createElement('strong'),p=document.createElement('p');b.textContent=o.isim.toLocaleUpperCase('tr-TR');p.textContent='Takım: '+o.takim.map(k=>k.isim).join(', ');d.append(b,p);const oz=takimOzelligi(savascilar[oi].takim),rakipOz=takimOzelligi(savascilar[1-oi].takim),ozP=document.createElement('p');ozP.textContent=`${oz.simge} Takım özelliği: ${oz.ad} (${oz.stat} ${oz.toplamlar[oz.anahtar]}) • ${ozellikEtkisiMetni(oz.anahtar,rakipOz.anahtar)}`;const ovP=document.createElement('p');ovP.textContent='Takım overall ortalaması: '+takimOverall(o.takim);d.append(ozP,ovP);if(buyulu[oi].paraBonusu){const e=document.createElement('p');e.textContent=`💰 Artan ₺${o.para}: her karaktere +${buyulu[oi].paraBonusu} GÜÇ`;d.append(e);}buyulu[oi].olaylar.forEach(item=>{const e=document.createElement('p');e.textContent='🔮 '+item.metin;d.append(e);});const kimya=takimKimyasi(o.takim);if(!kimya.olaylar.length){const e=document.createElement('p');e.textContent='Etkinleşen dostluk veya düşmanlık yok.';d.append(e);}kimya.olaylar.forEach(item=>{const e=document.createElement('p');e.textContent=(item.puan>=0?'🤝 ':'⚔️ ')+item.metin;d.append(e);});alan.append(d);});ekranAc('sonucEkrani');}

/* =========================================
   MEZAT - TEKLIF PANELI EFEKTLERI
   ========================================= */

function teklifPaneliEfektleriniKur() {
    const fiyat = document.getElementById("fiyatYazisi");
    const spiker = document.getElementById("spiker");

    if (fiyat && !fiyat.dataset.efektKuruldu) {
        fiyat.dataset.efektKuruldu = "1";

        const fiyatAnimasyonu = () => {
            fiyat.classList.remove("teklif-pop");
            void fiyat.offsetWidth;
            fiyat.classList.add("teklif-pop");
        };

        const fiyatGozlem = new MutationObserver(fiyatAnimasyonu);

        fiyatGozlem.observe(fiyat, {
            childList: true,
            characterData: true,
            subtree: true
        });
    }

    if (spiker && !spiker.dataset.efektKuruldu) {
        spiker.dataset.efektKuruldu = "1";

        const spikerAnimasyonu = () => {
            const ust = spiker.closest(".teklif-ust");
            if (!ust) return;

            ust.classList.remove("spiker-parla");
            void ust.offsetWidth;
            ust.classList.add("spiker-parla");
        };

        const spikerGozlem = new MutationObserver(spikerAnimasyonu);

        spikerGozlem.observe(spiker, {
            childList: true,
            characterData: true,
            subtree: true
        });
    }
}

function tetikleAllInEfekti(oyuncuAdi = "") {
    const panel = document.querySelector("#mezatEkrani .teklif-panel");
    if (!panel) return;

    panel.classList.remove("all-in-efekt");
    void panel.offsetWidth;
    panel.classList.add("all-in-efekt");

    const eski = panel.querySelector(".allin-badge");
    if (eski) eski.remove();

    const rozet = document.createElement("div");
    rozet.className = "allin-badge";
    rozet.textContent = oyuncuAdi
        ? oyuncuAdi.toLocaleUpperCase("tr-TR") + " • ALL IN!"
        : "ALL IN!";

    panel.appendChild(rozet);

    setTimeout(() => {
        rozet.remove();
    }, 950);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", teklifPaneliEfektleriniKur);
} else {
    teklifPaneliEfektleriniKur();
}

/* ALL IN EFEKTİNİ TEKLİF SİSTEMİNE BAĞLA */

const eskiTeklifVer = teklifVer;

teklifVer = function(artis) {
    if (
        mezatModu === "acik" &&
        !lotBitti &&
        !oyunBitti &&
        teklifVerebilir(sira)
    ) {
        const oyuncu = oyuncular[sira];
        const yeniFiyat = teklif + artis;

        if (yeniFiyat === oyuncu.para) {
            tetikleAllInEfekti(oyuncu.isim);
        }
    }

    return eskiTeklifVer(artis);
};

/* MEZAT SEÇİM BUTONLARINI SADELEŞTİR */

const mezatButonAlani = document.getElementById(
    "teklifButonlari"
);

if (mezatButonAlani) {
    const secimGozlemcisi = new MutationObserver(() => {
        mezatButonAlani.querySelectorAll("button")
            .forEach(buton => {
                const metin = buton.textContent.trim();

                if (metin.includes("TAKIMIMA AL")) {
                    buton.dataset.mezatSecim = "takim";
                }

                if (metin.includes("RAKİBE VER")) {
                    buton.dataset.mezatSecim = "rakip";
                }
            });
    });

    secimGozlemcisi.observe(mezatButonAlani, {
        childList: true
    });
}
