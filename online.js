/* MEZAT ONLINE V1 - Yalnızca ONLINE modunda çalışır.
   Oda sahibi mevcut oyun motorunun tek yetkili yürütücüsüdür.
   İkinci oyuncu hamle isteği gönderir, sahibi doğrular ve ortak durumu yayınlar. */
import {initializeApp} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import {getAuth, signInAnonymously, onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import {getDatabase, ref, get, set, update, onValue, runTransaction, remove, serverTimestamp} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-database.js';
const firebaseConfig={apiKey:'AIzaSyD8vlMADBYEteQp0sqU33EMb4sT8CsCx5c',authDomain:'ilahlarinsavasi-online.firebaseapp.com',databaseURL:'https://ilahlarinsavasi-online-default-rtdb.europe-west1.firebasedatabase.app',projectId:'ilahlarinsavasi-online',storageBucket:'ilahlarinsavasi-online.firebasestorage.app',messagingSenderId:'633894346707',appId:'1:633894346707:web:d5a4ee2b384f4954815926'};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getDatabase(app);
let me=null,code='',role='',room=null,unsubscribe=null,requestStop=null,localSequence='',rendering=false,hosting=false,originals={},requestLock=false,lastRequest='';
const $=id=>document.getElementById(id);
const stateRef=()=>ref(db,'odalar/'+code+'/state');
const roomRef=()=>ref(db,'odalar/'+code);
function notice(s){$('onlineDurum').textContent=s;}
function error(e){console.error('[MEZAT ONLINE]',e);notice('Hata: '+(e?.code||e?.message||String(e)));}
function neatName(s){return String(s||'').trim().slice(0,18);}
function randomCode(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',a=new Uint32Array(8);crypto.getRandomValues(a);return Array.from(a,n=>chars[n%chars.length]).join('');}
function makeUI(){
 const css=document.createElement('style');css.textContent=`
 #onlineEkrani{position:fixed;inset:0;z-index:8500;display:grid;place-items:center;padding:20px;overflow-y:auto;background:radial-gradient(circle at 50% 30%,#173946,#06111b 70%)}
 #onlineEkrani.gizli{display:none!important}#onlineEkrani .online-box{width:min(540px,100%);padding:28px;border:1px solid #b08e54;border-radius:15px;background:#091a27;box-shadow:0 14px 80px #000a;text-align:center;max-height:calc(100dvh - 35px);overflow-y:auto}
 #onlineEkrani h1{font-size:clamp(30px,5vw,48px);margin:10px;color:#eaca8c}#onlineEkrani p{font-size:18px;color:#bed0d9}
 #onlineEkrani input{display:block;width:100%;margin:12px 0;padding:14px;background:#102a39;border:1px solid #7993a0;border-radius:6px;color:#fff;font:inherit;font-size:22px}
 #onlineEkrani button{width:100%;padding:14px;margin:8px 0;font-size:20px}#onlineOdaKodu{font-size:clamp(30px,6vw,44px);font-weight:700;letter-spacing:7px;color:#f2ca83}
 #onlineDurum{min-height:35px;color:#63d3d4!important}#onlineEtiket{position:fixed;top:110px;right:16px;z-index:2000;background:#102734;border:1px solid #d9b16b;border-radius:8px;padding:9px 15px;color:#f1d397;font-weight:bold;font-size:15px}
 #onlineEtiket.gizli{display:none!important}#onlineEkrani .online-small{color:#91abb7;font-size:14px}`;
 document.head.append(css);
 let section=document.createElement('section');section.id='onlineEkrani';section.className='gizli';section.innerHTML=`<div class="online-box"><div class="kucuk-baslik">MEZAT • GERÇEK ZAMANLI</div><h1>ONLINE 1 VS 1</h1><div id="onlineIlk"><input id="onlineIsim" maxlength="18" placeholder="Oyuncu adın" autocomplete="off"><button id="onlineKur" class="altin">ODA OLUŞTUR</button><input id="onlineKodGir" maxlength="8" placeholder="8 karakterli oda kodu" autocomplete="off" style="text-transform:uppercase"><button id="onlineKatil" class="geri">ODAYA KATIL</button></div><div id="onlineBekle" class="gizli"><p>ODA KODUN</p><div id="onlineOdaKodu"></div><button id="onlineKopya" class="geri">KODU KOPYALA</button><p id="onlineRakip"></p><button id="onlineBaslat" class="altin gizli">MEZATI BAŞLAT ⚔</button></div><p id="onlineDurum">Bağlantı hazırlanıyor...</p><button id="onlineGeri" class="geri">GERİ</button><p class="online-small">Her oda 2 kişiliktir. Oda sahibinin bağlantısı açık kalmalıdır.</p></div>`;
 document.body.append(section);
 let label=document.createElement('div');label.id='onlineEtiket';label.className='gizli';document.body.append(label);
 $('onlineKur').onclick=createRoom;$('onlineKatil').onclick=joinRoom;$('onlineKopya').onclick=()=>navigator.clipboard?.writeText(code).then(()=>notice('Oda kodu kopyalandı.')).catch(()=>notice('Kodu elle kopyala.'));
 $('onlineBaslat').onclick=startMatch;$('onlineGeri').onclick=()=>{location.reload();};
 let btn=$('modSecimEkrani')?.querySelector('button[aria-label*="Online"]');
 if(btn){btn.disabled=false;btn.setAttribute('aria-label','Online, oda oluştur veya katıl');btn.querySelector('.mod-durum').textContent='OYNA →';btn.onclick=()=>{openOnline();};}
}
async function ensureAuth(){if(auth.currentUser){me=auth.currentUser;return;}const u=await signInAnonymously(auth);me=u.user;}
async function openOnline(){
 window.MezatBotModu=false;$('onlineEkrani').classList.remove('gizli');
 await ensureAuth().then(async()=>{await verileriYukle();notice('Hazır. Oda kur veya arkadaşının kodunu gir.');}).catch(error);
}
function waiting(){ $('onlineIlk').classList.add('gizli');$('onlineBekle').classList.remove('gizli');$('onlineOdaKodu').textContent=code; }
async function createRoom(){
 try{await ensureAuth();let name=neatName($('onlineIsim').value);if(!name){notice('Önce adını yaz.');return;} $('onlineKur').disabled=true;
 for(let x=0;x<6;x++){let c=randomCode(),r=ref(db,'odalar/'+c);const result=await runTransaction(r,v=>v===null?{hostUid:me.uid,guestUid:'',hostName:name,guestName:'',status:'waiting',createdAt:Date.now()}:undefined,{applyLocally:false});
 if(result.committed){code=c;role='host';waiting();watchRoom();notice('Arkadaşının katılması bekleniyor.');return;}}
 throw Error('Oda kodu üretilemedi.');}catch(e){error(e);$('onlineKur').disabled=false;}
}
async function joinRoom(){
 try{await ensureAuth();let name=neatName($('onlineIsim').value),c=$('onlineKodGir').value.replace(/\s/g,'').toUpperCase();if(!name||!/^[A-Z2-9]{8}$/.test(c)){notice('Adını ve 8 karakterli kodu doğru gir.');return;}
 $('onlineKatil').disabled=true;let r=ref(db,'odalar/'+c),s=(await get(r)).val();if(!s){notice('Oda bulunamadı.');return;}if(s.status!=='waiting'){notice('Bu oda başlamış veya kapanmış.');return;}
 const joined=await runTransaction(ref(db,'odalar/'+c+'/guestUid'),v=>(v===null||v==='')?me.uid:undefined,{applyLocally:false});
 if(!joined.committed){notice('Oda dolu.');return;}
 await set(ref(db,'odalar/'+c+'/guestName'),name);code=c;role='guest';waiting();watchRoom();notice('Bağlandın. Oda sahibinin başlatması bekleniyor.');
 }catch(e){error(e);}finally{$('onlineKatil').disabled=false;}
}
function watchRoom(){
 if(unsubscribe)unsubscribe();unsubscribe=onValue(roomRef(),s=>{
 room=s.val();if(!room){notice('Oda bulunamadı veya silindi.');return;}
 $('onlineRakip').textContent=room.guestName?'Oyuncular: '+room.hostName+' VS '+room.guestName:'İkinci oyuncu bekleniyor...';
 if(role==='host')$('onlineBaslat').classList.toggle('gizli',!room.guestUid||!room.guestName||room.status!=='waiting');
 if(room.status==='playing'&&room.state){if(role==='guest')renderSnapshot(room.state);else if(!hosting){hosting=true;}}
 if(room.status==='finished'&&room.state&&role==='guest')renderSnapshot(room.state);
 },error);
 if(role==='host') watchRequests();
}
async function startMatch(){
 if(role!=='host'||!room?.guestUid||!room.guestName)return;
 try{window.MezatBotModu=false;hosting=true;$('isim1').value=room.hostName;$('isim2').value=room.guestName;
 await oyunuBaslat();if($('mezatEkrani').classList.contains('gizli')){hosting=false;return;}
 $('onlineEkrani').classList.add('gizli');$('onlineEtiket').classList.remove('gizli');
 await update(roomRef(),{status:'playing',state:collectState()});
 startBroadcast();}catch(e){hosting=false;error(e);}
}
function collectState(){
 const result={lot,sira,teklif,teklifSahibi,paslar:[...paslar],lotBitti,oyunBitti,animasyonDevamEdiyor,mezatModu,secimYapan,
 activeId:aktifKarakter?.id??null,poolIds:havuz.map(k=>k.id),players:oyuncular.map(o=>({isim:o.isim,para:o.para,ids:o.takim.map(k=>k.id)})),spiker:$('spiker').textContent};
 if(oyunBitti)result.result={kazanan:$('kazananYazisi').textContent,ozet:$('savasOzeti').textContent,turlar:[...$('turSonuclari').children].map(e=>({title:e.querySelector('strong')?.textContent||'',text:e.querySelector('p')?.textContent||''})),takimlar:[...$('sonucKartlari').children].map(e=>({title:e.querySelector('strong')?.textContent||'',texts:[...e.querySelectorAll('p')].map(p=>p.textContent)}))};
 return result;
}
function startBroadcast(){if(!hosting||!code)return;
 let sent='',inFlight=false;setInterval(async()=>{if(!hosting||!code||inFlight)return;
 const value=collectState(),data=JSON.stringify(value);if(data===sent)return;
 inFlight=true;try{await update(roomRef(),{status:value.oyunBitti?'finished':'playing',state:value});sent=data;}catch(e){console.warn(e);}finally{inFlight=false;}
 },260);
}
function renderSnapshot(s){
 if(!s?.players||s.players.length!==2)return;
 let serial=JSON.stringify(s);if(serial===localSequence)return;localSequence=serial;
 try{rendering=true;const byId=new Map(tumKarakterler.map(k=>[String(k.id),k]));
 oyuncular=s.players.map(p=>({isim:p.isim,para:p.para,takim:(p.ids||[]).map(id=>byId.get(String(id))).filter(Boolean)}));
 havuz=(s.poolIds||[]).map(id=>byId.get(String(id))).filter(Boolean);
 aktifKarakter=byId.get(String(s.activeId));lot=s.lot;sira=s.sira;teklif=s.teklif;teklifSahibi=s.teklifSahibi;
 paslar=new Set(s.paslar||[]);lotBitti=s.lotBitti;oyunBitti=s.oyunBitti;animasyonDevamEdiyor=s.animasyonDevamEdiyor;
 mezatModu=s.mezatModu;secimYapan=s.secimYapan;
 $('onlineEkrani').classList.add('gizli');$('onlineEtiket').classList.remove('gizli');
 if(s.oyunBitti&&s.result){const r=s.result;$('kazananYazisi').textContent=r.kazanan;$('savasOzeti').textContent=r.ozet;
 const t=$('turSonuclari');t.replaceChildren();for(const obj of r.turlar){let d=document.createElement('div');d.className='tur-kart';let b=document.createElement('strong'),p=document.createElement('p');b.textContent=obj.title;p.textContent=obj.text;d.append(b,p);t.append(d);}
 const a=$('sonucKartlari');a.replaceChildren();for(const obj of r.takimlar){let d=document.createElement('div');d.className='sonuc-kart';let b=document.createElement('strong');b.textContent=obj.title;d.append(b);for(const tx of obj.texts){let p=document.createElement('p');p.textContent=tx;d.append(p);}a.append(d);}ekranAc('sonucEkrani');}
 else if(aktifKarakter){ekranAc('mezatEkrani');$('spiker').textContent=s.spiker||'';arayuzuGuncelle();if(s.lotBitti){sonrakiLotButonuGoster();}else{butonlariYenile();}
 // Misafir ekranında butonlar yerel durumu değiştiremez, sadece istek üretir.
 for(const b of $('teklifButonlari').querySelectorAll('button'))b.disabled=false;
 }
 $('onlineEtiket').textContent='ONLINE • '+code+' • '+(role==='guest'?'MİSAFİR':'ODA SAHİBİ');
 }catch(e){console.error('Online görünüm hatası',e);}finally{rendering=false;}
}
function guestAction(kind,n){if(role!=='guest'||!room||room.status!=='playing'||!room.state||requestLock)return;
 if(room.state.lotBitti&&kind!=='next')return;
 let allowed=room.state.lotBitti|| (room.state.mezatModu==='acik'&&room.state.sira===1) || (room.state.mezatModu==='secim'&&room.state.secimYapan===1);
 if(!allowed)return;
 requestLock=true;const request={kind,n:Number(n)||0,lot:room.state.lot,turn:room.state.teklif,stamp:Date.now()};
 set(ref(db,'odalar/'+code+'/requests/'+me.uid),request).catch(error).finally(()=>setTimeout(()=>requestLock=false,450));
}
function watchRequests(){if(requestStop)requestStop();requestStop=onValue(ref(db,'odalar/'+code+'/requests'),s=>{
 if(!hosting||!room?.guestUid||!s.exists())return;
 const r=s.child(room.guestUid).val();if(!r||JSON.stringify(r)===lastRequest)return;lastRequest=JSON.stringify(r);
 if(r.lot!==lot||r.turn!==teklif||oyunBitti)return;
 if(r.kind==='bid'&&mezatModu==='acik'&&sira===1&&[1,2,5].includes(r.n)&&teklifVerebilir(1))teklifVer(r.n);
 else if(r.kind==='all'&&mezatModu==='acik'&&sira===1&&teklifVerebilir(1))hepsiniVer();
 else if(r.kind==='pass'&&mezatModu==='acik'&&sira===1&&teklifSahibi!==-1)pasGec();
 else if(r.kind==='choose'&&mezatModu==='secim'&&secimYapan===1&&[0,1].includes(r.n))karakterSec(r.n);
 else if(r.kind==='next'&&lotBitti&&!animasyonDevamEdiyor){if(takimlarTamam())savasiBaslat();else yeniLot();}
 },error);}
function attachGuestControls(){
 // Yakalama aşamasında gerçek buton olayını durduruyoruz.
 $('mezatEkrani').addEventListener('click',e=>{
 let b=e.target.closest('#teklifButonlari button');if(!b||!code)return;
 if(role==='host'){const guestTurn=!lotBitti&&((mezatModu==='acik'&&sira===1)||(mezatModu==='secim'&&secimYapan===1));if(guestTurn){e.preventDefault();e.stopImmediatePropagation();}return;}
 if(role!=='guest')return;
 e.preventDefault();e.stopImmediatePropagation();
 let label=b.textContent;if(lotBitti){guestAction('next');return;}
 if(label.includes('TAKIMIMA AL'))guestAction('choose',1);
 else if(label.includes('RAKİBE VER'))guestAction('choose',0);
 else if(label.includes('HEPSİ'))guestAction('all');
 else if(label.includes('BIRAK'))guestAction('pass');
 else {let m=label.match(/\+(\d+)/);if(m)guestAction('bid',Number(m[1]));}
 },true);
}
function init(){makeUI();attachGuestControls();signInAnonymously(auth).then(u=>{me=u.user;notice('Bağlantı hazır.');}).catch(error);}
// Online mod, oyun-modlari.js tarafindan DOMContentLoaded'da olusturulur.
// window.load sonrasinda baslatmak DOM kurulma yarisi sorununu onler.
if(document.readyState==='complete') init();
else window.addEventListener('load',init,{once:true});
