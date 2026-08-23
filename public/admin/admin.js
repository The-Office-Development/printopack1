/* Printopack System - Admin dashboard (v2).
   Self-service CMS covering every section the client requested. Data persists in
   the browser for this build; in production the same read/write layer points at
   api.printopack.com.sa. */
(function(){
"use strict";
var $=function(s,c){return (c||document).querySelector(s);};
var root=document.getElementById('root');
function esc(s){var d=document.createElement('div');d.textContent=s==null?'':String(s);
 /* textContent escapes &, < and >, but not quotes, and almost every use of this is inside a
    double-quoted HTML attribute. A product called 24" Reel used to truncate the field at the
    quote and save the truncated text back over the record. */
 return d.innerHTML.replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function uid(){return 'x'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function today(){return new Date().toISOString().slice(0,10);}
function fmtDate(d){if(!d)return '';var p=new Date(d);if(isNaN(p))return d;return p.toLocaleDateString(LANG==='ar'?'ar':'en-GB',{day:'numeric',month:'short',year:'numeric'});}
/* ---------------- language ----------------
   The dashboard itself speaks English or Arabic. The CONTENT it edits always has both, in
   its own paired fields, and nothing here touches it: switching the interface to Arabic does
   not change a single word of the website.
   T() looks the English string up in the dictionary and falls back to the English itself, so
   a screen that has never been translated degrades to English rather than to blanks. The
   {x} placeholders are filled here rather than by concatenation, because Arabic assembles
   the pieces in a different order to English. */
var LKEY='ppk_admin_lang';
var LANG=(function(){try{return localStorage.getItem(LKEY)==='ar'?'ar':'en';}catch(e){return 'en';}})();
function T(s,v){
 var d=(LANG==='ar'&&window.PPK_AR)?window.PPK_AR:null;
 var out=(d&&Object.prototype.hasOwnProperty.call(d,s))?d[s]:s;
 /* An entry is a function when the phrase has to agree with a number: Arabic has a dual and
    two plural bands where English has one plural, so those are written out rather than
    interpolated. It builds the finished string itself and needs no placeholder pass. */
 if(typeof out==='function')return out(v||{});
 if(v)for(var k in v)out=String(out).split('{'+k+'}').join(v[k]);
 return out;
}
/* A section's singular as a button reads it. English lowercases it mid-sentence ("New post");
   Arabic has no case, so lowercasing there would only mangle the word. */
function sing(mdl){return LANG==='ar'?T(mdl.singular):String(mdl.singular).toLowerCase();}
/* Set on <html> rather than on the app element, so the mirroring reaches the scrollbar and
   the drawers and dialogs, which are appended to <body> outside the app. */
function applyLang(){
 var h=document.documentElement;
 h.lang=LANG; h.dir=(LANG==='ar')?'rtl':'ltr';
 h.classList.toggle('ar',LANG==='ar');
}
function setLang(l){
 LANG=(l==='ar')?'ar':'en';
 try{localStorage.setItem(LKEY,LANG);}catch(e){}
 applyLang();
 render();
}
function langToggleHTML(cls){
 return '<button class="'+(cls||'lang-sw')+'" data-lang="'+(LANG==='ar'?'en':'ar')+'" type="button">'+
  (LANG==='ar'?'English':'العربية')+'</button>';
}
function bindLang(scope){
 (scope||document).querySelectorAll('[data-lang]').forEach(function(el){
  el.addEventListener('click',function(){setLang(el.getAttribute('data-lang'));});
 });
}
applyLang();

function toast(m,t){var e=$('#toast');$('#toastText').textContent=m;e.className='toast show '+(t||'');clearTimeout(toast._t);toast._t=setTimeout(function(){e.className='toast';},2600);}

var ICON={
 dash:'<path d="M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z"/>',
 news:'<path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/>',
 products:'<path d="M3 8l9-5 9 5-9 5-9-5z"/><path d="M3 8v8l9 5 9-5V8"/>',
 team:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><circle cx="17.5" cy="8.5" r="2.6"/><path d="M15.5 14.4c2.6.3 4.5 2.2 4.5 5"/>',
 careers:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
 partners:'<circle cx="7" cy="12" r="4"/><circle cx="17" cy="12" r="4"/><path d="M7 16h10"/>',
 factory:'<path d="M3 21V9l6 4V9l6 4V5l6 3v13z"/><path d="M3 21h18"/>',
 quality:'<path d="M12 2l2.5 6.5H21l-5.2 4 2 6.5L12 15l-5.8 4 2-6.5L3 8.5h6.5z"/>',
 responsibility:'<path d="M12 21C7 17 3 13 3 8.5 3 5.5 5.5 3 8.5 3c1.7 0 3.2.9 4 2 .8-1.1 2.3-2 4-2C19.5 3 22 5.5 22 8.5c0 .8-.1 1.5-.4 2.3"/>',
 gallery:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.8"/><path d="M21 15l-5-5L6 20"/>',
 about:'<circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 8h.01"/>',
 offices:'<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
 settings:'<circle cx="12" cy="12" r="3.2"/><path d="M19 12a7 7 0 0 0-.1-1.3l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2.2-1.3L14 2h-4l-.4 2.1a7 7 0 0 0-2.2 1.3l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .9.1 1.3l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2.2 1.3L10 22h4l.4-2.1a7 7 0 0 0 2.2-1.3l2.3.9 2-3.4-2-1.5c.1-.4.1-.9.1-1.3z"/>',
 edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
 trash:'<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
 logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
 image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.8"/><path d="M21 15l-5-5L5 21"/>',
 link:'<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
 publish:'<path d="M12 19V5"/><path d="M6 11l6-6 6 6"/><path d="M4 21h16"/>',
 up:'<path d="M18 15l-6-6-6 6"/>',
 down:'<path d="M6 9l6 6 6-6"/>',
 external:'<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/>',
 inbox:'<path d="M3 13h5l2 3h4l2-3h5"/><path d="M4.5 6.5h15L21 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5z"/>',
 archive:'<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
 attach:'<path d="M21 12.5l-8.5 8.5a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
 cover:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15l5-5 4 4 3-3 6 6"/>',
 contain:'<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="6" y="8" width="12" height="8" rx="1"/>'
};
function svg(n){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+(ICON[n]||'')+'</svg>';}

/* ---------------- image intake ----------------
   Pictures are resized and re-encoded in this browser before they are ever sent, so an
   untouched phone photo (4-6 MB) cannot reach the site or eat into free storage. The
   recommended size printed on the field is the target box; anything bigger is scaled to
   fit it, encoded as WebP, and stepped down in quality until it is under the picture-size
   limit the client sets in Settings.
   Nothing but a picture gets through: video belongs on YouTube or Vimeo as a link. */
/* The ceiling for an uploaded picture, in KB. It is a Setting rather than a constant so the
   client can tighten it themselves if the storage meter ever climbs: pictures live in the
   500 MB database, and halving this halves what every future upload costs. The compressor
   steps quality down until a picture fits; anything that still will not fit is refused with
   its actual size, rather than silently sailing past the limit. */
var IMG_MAX_KB_DEFAULT=400,IMG_MAX_KB_FLOOR=40,IMG_MAX_KB_CEIL=600,IMG_BOX=1800;
function imgMaxKB(){
 var v=parseInt((CACHE.singletons.settings||{}).maxImageKb,10);
 if(!isFinite(v)||v<=0)return IMG_MAX_KB_DEFAULT;
 return Math.min(IMG_MAX_KB_CEIL,Math.max(IMG_MAX_KB_FLOOR,v));
}
function recBox(rec){var m=/(\d{3,4})\s*[x×]\s*(\d{3,4})/.exec(rec||'');return m?Math.max(+m[1],+m[2]):IMG_BOX;}
function dataKB(d){return Math.round((d.length-d.indexOf(',')-1)*0.75/1024);}
/* Accepted upload formats, kept to the three the whole web decodes fast and losslessly enough:
   JPG for photos, PNG for logos with transparency, WebP for either. Everything is re-encoded to
   WebP (or JPEG) below regardless, so the stored site never carries more than those two, but the
   input is fenced too: HEIC/TIFF/BMP/AVIF decode inconsistently across browsers and would fail
   confusingly, GIF is animated (against the no-motion brief), and SVG can carry script. */
var OK_UPLOAD_TYPES={'image/jpeg':1,'image/png':1,'image/webp':1};
/* True when any pixel is not fully opaque. Sampling the alpha channel is what decides whether
   a picture may be flattened to JPEG; a photograph never trips it, a cut-out logo always does. */
function hasAlpha(c){
 try{
  var d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
  /* Every 40th pixel: a transparent background is thousands of pixels, never a lone one. */
  for(var i=3;i<d.length;i+=4*40){if(d[i]<250)return true;}
  return false;
 }catch(e){return true;} /* unreadable canvas: assume alpha and keep PNG, never flatten */
}
function prepImage(f,box,cb){
 if(!OK_UPLOAD_TYPES[f.type]){toast('Only JPG, PNG or WebP images are accepted (they load fastest). Save or export other formats as one of these first. A video goes in as a YouTube or Vimeo link.','err');return;}
 var url=URL.createObjectURL(f),im=new Image();
 im.onerror=function(){URL.revokeObjectURL(url);toast('That image could not be read','err');};
 im.onload=function(){
  URL.revokeObjectURL(url);
  var s=Math.min(1,box/Math.max(im.width,im.height));
  var c=document.createElement('canvas');c.width=Math.round(im.width*s)||1;c.height=Math.round(im.height*s)||1;
  c.getContext('2d').drawImage(im,0,0,c.width,c.height);
  /* WebP keeps transparency, so logos on a transparent background survive. A browser that
     cannot encode WebP silently returns a PNG data URL, in which case fall back to JPEG. */
  var cap=imgMaxKB();
  /* WebP keeps transparency and is what every modern browser encodes. Safari's canvas cannot
     export WebP and silently hands back a PNG data URL instead. The old fallback then re-encoded
     to JPEG, which has no alpha, so on a Mac or an iPhone every transparent partner logo and
     product cut-out was saved onto a black background. Now the fallback keeps the alpha: a
     picture that needs transparency stays PNG and is fitted under the limit by size rather
     than by quality, and only a photograph (no alpha) falls back to JPEG. */
  var q=0.82,out=c.toDataURL('image/webp',q);
  var isWebp=out.slice(0,15)==='data:image/webp';
  if(isWebp){
   while(dataKB(out)>cap&&q>0.4){q=Math.round((q-0.1)*100)/100;out=c.toDataURL('image/webp',q);}
  }else if(hasAlpha(c)){
   out=c.toDataURL('image/png');
   /* PNG has no quality dial, so shrink the picture itself until it fits. 900px on the long
      edge is the floor: below that a logo starts to look soft on a retina screen. */
   var w=c.width,h=c.height;
   while(dataKB(out)>cap&&Math.max(w,h)>900){
    w=Math.round(w*0.85);h=Math.round(h*0.85);
    var c2=document.createElement('canvas');c2.width=w;c2.height=h;
    c2.getContext('2d').drawImage(im,0,0,w,h);
    c=c2;out=c.toDataURL('image/png');
   }
  }else{
   out=c.toDataURL('image/jpeg',q);
   while(dataKB(out)>cap&&q>0.4){q=Math.round((q-0.1)*100)/100;out=c.toDataURL('image/jpeg',q);}
  }
  if(dataKB(out)>cap){toast('That picture is '+dataKB(out)+' KB and will not compress under the '+cap+' KB limit. Crop it or use a smaller one.','err');return;}
  cb(out,dataKB(out));
 };
 im.src=url;
}

/* ---------------- data layer ---------------- */
var KEY='pp_admin_v18'; /* v11: office manager photo; Measurements kind on groups and sub-items */
/* How many partners the home page shows. The client's rule: always exactly 20. */
var MAIN_PARTNERS=20;
/* How many records each section may hold. The reasoning behind every number, and the storage
   maths behind them, is in db/CAPS.md. Pictures live in the 500 MB D1 database, so a list
   that grows without limit is a real risk rather than a tidiness question. When a section is
   full the client deletes something before adding more, which is what the client asked for. */
var CAPS={news:500,products:300,gallery:500,partners:1000,team:60,offices:40,productGroups:40,
 quality:40,responsibility:40,careers:40,factory:30,formats:20,values:12,standard:10};
function capOf(k){return CAPS[k]||null;}
function capLeft(k){var c=capOf(k);return c==null?null:Math.max(0,c-coll(k).length);}

/* Every Arab country the map can draw, and the Arabic name that goes with it. Switching one
   ON in the Countries panel creates its office record; switching it OFF removes it. The site
   draws a country if, and only if, an office exists for it, so this panel is the map's
   on/off switch as well as the office list's. `int` is not here: International Sales is a
   market, not a territory, and never appears on the map. */
var COUNTRIES=[
 {cc:'sa',en:'Saudi Arabia',ar:'المملكة العربية السعودية'},
 {cc:'ae',en:'United Arab Emirates',ar:'الإمارات العربية المتحدة'},
 {cc:'bh',en:'Bahrain',ar:'البحرين'},
 {cc:'kw',en:'Kuwait',ar:'الكويت'},
 {cc:'om',en:'Oman',ar:'عُمان'},
 {cc:'qa',en:'Qatar',ar:'قطر'},
 {cc:'iq',en:'Iraq',ar:'العراق'},
 {cc:'jo',en:'Jordan',ar:'الأردن'},
 {cc:'lb',en:'Lebanon',ar:'لبنان'},
 {cc:'ps',en:'Palestine',ar:'فلسطين'},
 {cc:'sy',en:'Syria',ar:'سوريا'},
 {cc:'ye',en:'Yemen',ar:'اليمن'},
 {cc:'eg',en:'Egypt',ar:'مصر'},
 {cc:'sd',en:'Sudan',ar:'السودان'},
 {cc:'ly',en:'Libya',ar:'ليبيا'},
 {cc:'tn',en:'Tunisia',ar:'تونس'},
 {cc:'dz',en:'Algeria',ar:'الجزائر'},
 {cc:'ma',en:'Morocco',ar:'المغرب'},
 {cc:'mr',en:'Mauritania',ar:'موريتانيا'},
 {cc:'dj',en:'Djibouti',ar:'جيبوتي'}
];

/* The options for an office's "Country on the map". Built from COUNTRIES rather than typed
   out a second time: the hand-written list had only 13 of the 20 codes, so switching on any
   of UAE, Bahrain, Oman, Qatar, Lebanon, Palestine, Mauritania or Djibouti produced an office
   whose stored cc matched no option. The select then rendered blank and the first save wrote
   that blank back, silently unlinking the country from the map. Labels are shown instead of
   codes because "sa" means nothing to the person choosing. */
var CC_OPTIONS=[{v:'',l:'Not on the map (a branch inside a country that already has an office)'}]
 .concat(COUNTRIES.map(function(c){return {v:c.cc,l:c.en};}))
 .concat([{v:'int',l:'International Sales (no country to colour)'}]);

var IMG={cat:function(i){return '/images/cat-'+i+'.png';},dept:function(i){return '/images/dept-'+i+'.jpg';},client:function(i){return '/images/clients/client-'+i+'.png';}};
var SEED={
 news:[
  {id:uid(),title:"Pioneering Exceptional Packaging Solutions Since 1997",titleAr:"ريادة في حلول التغليف منذ عام 1997",category:"General",date:"2023-08-27",image:"/images/lineup.jpg",body:"Your path to elevated product presentation with flexible packaging built for the region.",bodyAr:"طريقكم إلى عرضٍ أرقى لمنتجاتكم عبر تغليفٍ مرن مصمّم للمنطقة.",status:"published"},
  {id:uid(),title:"Elevate Your Beverage Brand with Our Expertise",titleAr:"ارتقوا بعلامتكم في قطاع المشروبات مع خبرتنا",category:"General",date:"2023-08-14",image:"/images/dept-2.jpg",body:"Labels, sleeves and hot-fill packaging engineered for filling lines.",bodyAr:"ملصقات وأكمام وتغليف للتعبئة الساخنة مصمّم لخطوط التعبئة.",status:"published"},
  {id:uid(),title:"The Benefits of Flexible Packaging",titleAr:"فوائد التغليف المرن",category:"General",date:"2023-05-06",image:"/images/factory.jpg",body:"Durability, versatility and eco-friendliness for modern products.",bodyAr:"المتانة والمرونة والاستدامة للمنتجات الحديثة.",status:"published"},
  {id:uid(),title:"The Future of Packaging in Saudi Arabia",titleAr:"مستقبل التغليف في المملكة العربية السعودية",category:"General",date:"2023-02-10",image:"/images/dept-1.jpg",body:"How local manufacturing and print are shaping the next decade.",bodyAr:"كيف يشكّل التصنيع والطباعة المحليان العقد المقبل.",status:"published"},
  {id:uid(),title:"PVC vs PET-G Shrink Films",titleAr:"أفلام الانكماش: PVC مقابل PET-G",category:"General",date:"2022-06-20",image:"/images/dept-5.jpg",body:"A practical comparison for brand owners choosing shrink sleeves.",bodyAr:"مقارنة عملية لأصحاب العلامات عند اختيار أكمام الانكماش.",status:"published"},
  {id:uid(),title:"In-house Cylinder Engraving",titleAr:"حفر الأسطوانات داخلياً",category:"General",date:"2022-04-04",image:"/images/dept-4.jpg",body:"From artwork to press, faster, with engraving done under our own roof.",bodyAr:"من التصميم إلى الطباعة، وبسرعة أكبر، عبر الحفر داخل مصنعنا.",status:"draft"}
 ],
 productGroups:[
  {id:uid(),name:"Snacks",nameAr:"الوجبات الخفيفة",image:IMG.cat(1),description:"Chips, nuts and savoury snack ranges.",descriptionAr:"الشيبس والمكسّرات والوجبات الخفيفة المالحة."},
  {id:uid(),name:"Confectionery",nameAr:"الحلويات",image:IMG.cat(2),description:"Chocolate, wafers and candy.",descriptionAr:"الشوكولاتة والويفر والحلوى."},
  {id:uid(),name:"Bakery",nameAr:"المخابز",image:IMG.cat(3),description:"Bread, biscuits and cakes.",descriptionAr:"الخبز والبسكويت والكيك."},
  {id:uid(),name:"Beverage",nameAr:"المشروبات",image:IMG.cat(6),description:"Bottles, sleeves and liquid packs.",descriptionAr:"القوارير والأكمام وعبوات السوائل."},
  {id:uid(),name:"Dairy",nameAr:"الألبان",image:IMG.cat(7),description:"Lidding and packs for dairy and desserts.",descriptionAr:"أغطية وعبوات لمنتجات الألبان والحلويات."},
  {id:uid(),name:"Frozen",nameAr:"المجمّدات",image:IMG.cat(8),description:"Cold-chain wraps and packaging.",descriptionAr:"أغلفة وتغليف لسلسلة التبريد."}
 ],
 products:[
  {id:uid(),name:"Chips & Snacks Packaging",nameAr:"تغليف الشيبس والوجبات الخفيفة",category:"Snacks",image:IMG.cat(1),description:"High-barrier printed films and bags that keep snacks fresh and crisp.",descriptionAr:"أفلام وأكياس مطبوعة عالية الحاجز تحافظ على نضارة الوجبات الخفيفة.",active:true},
  {id:uid(),name:"Chocolate & Wafer Packaging",nameAr:"تغليف الشوكولاتة والويفر",category:"Confectionery",image:IMG.cat(2),description:"Vivid rotogravure wraps and flow-pack for chocolate and wafers.",descriptionAr:"أغلفة روتوغرافيّة زاهية وتغليف انسيابي للشوكولاتة والويفر.",active:true},
  {id:uid(),name:"Bakery Packaging",nameAr:"تغليف المخبوزات",category:"Bakery",image:IMG.cat(3),description:"Breathable, printed packaging for bread, biscuits and cakes.",descriptionAr:"تغليف مطبوع يسمح بالتهوية للخبز والبسكويت والكيك.",active:true},
  {id:uid(),name:"Candy Wrappers",nameAr:"أغلفة الحلويات",category:"Confectionery",image:IMG.cat(4),description:"Twist and flow wrappers with shelf-standout print.",descriptionAr:"أغلفة لفّ وانسياب بطباعة تبرز على الرفوف.",active:true},
  {id:uid(),name:"Bread Bags",nameAr:"أكياس الخبز",category:"Bakery",image:IMG.cat(5),description:"Durable printed bags for fresh and packaged breads.",descriptionAr:"أكياس مطبوعة متينة للخبز الطازج والمعبّأ.",active:true},
  {id:uid(),name:"Bottle Labels",nameAr:"ملصقات القوارير",category:"Beverage",image:IMG.cat(6),description:"PET and glass bottle labels with tight registration.",descriptionAr:"ملصقات لقوارير PET والزجاج بدقّة تسجيل عالية.",active:true},
  {id:uid(),name:"Lids & Sleeves",nameAr:"الأغطية والأكمام",category:"Dairy",image:IMG.cat(7),description:"Lidding films and shrink sleeves for dairy and desserts.",descriptionAr:"أفلام أغطية وأكمام انكماش لمنتجات الألبان والحلويات.",active:true},
  {id:uid(),name:"Ice Cream Packaging",nameAr:"تغليف الآيس كريم",category:"Frozen",image:IMG.cat(8),description:"Freezer-grade printed wraps and tubs packaging.",descriptionAr:"أغلفة مطبوعة وتغليف عبوات مقاومة للتجميد.",active:false}
 ],
 team:[
  {id:uid(),name:"Nasser Nabil",nameAr:"ناصر نبيل",role:"General Manager",roleAr:"المدير العام",email:"gm@printopack.com.sa",experience:0,bio:"",bioAr:""},
  {id:uid(),name:"",nameAr:"",role:"Head of Quality",roleAr:"رئيس الجودة",email:"quality@printopack.com.sa",experience:0,bio:"",bioAr:""},
  {id:uid(),name:"",nameAr:"",role:"Production Director",roleAr:"مدير الإنتاج",email:"production@printopack.com.sa",experience:0,bio:"",bioAr:""},
  {id:uid(),name:"",nameAr:"",role:"Head of Sales",roleAr:"رئيس المبيعات",email:"sales@printopack.com.sa",experience:0,bio:"",bioAr:""},
  {id:uid(),name:"",nameAr:"",role:"IT Specialist",roleAr:"أخصائي تقنية المعلومات",email:"it@printopack.com.sa",experience:0,bio:"",bioAr:""}
 ],
 careers:[
  {id:uid(),title:"Production Engineer",titleAr:"مهندس إنتاج",dept:"Production",deptAr:"الإنتاج",type:"Full-time",typeAr:"دوام كامل",location:"Jeddah, KSA",locationAr:"جدة، السعودية",email:"production.jobs@printopack.com.sa",summary:"Run and improve our rotogravure and lamination lines, keeping output on-spec and on-time.",summaryAr:"تشغيل وتحسين خطوط الطباعة الروتوغرافية والتصفيح، مع الحفاظ على مطابقة الإنتاج للمواصفات وتسليمه في وقته.",requirements:"BSc in mechanical or industrial engineering.\n3+ years on rotogravure or flexible-packaging lines.\nA strong grasp of print quality and process control.",requirementsAr:"بكالوريوس في الهندسة الميكانيكية أو الصناعية.\nخبرة 3 سنوات فأكثر على خطوط الطباعة الروتوغرافية أو التغليف المرن.\nإلمام قوي بجودة الطباعة وضبط العمليات.",status:"published"},
  {id:uid(),title:"Quality Control Specialist",titleAr:"أخصائي مراقبة الجودة",dept:"Quality",deptAr:"الجودة",type:"Full-time",typeAr:"دوام كامل",location:"Jeddah, KSA",locationAr:"جدة، السعودية",email:"quality.jobs@printopack.com.sa",summary:"Check every run against our food-safety and print standards before it ships.",summaryAr:"فحص كل تشغيلة وفق معايير سلامة الغذاء والطباعة قبل شحنها.",requirements:"Background in food-contact materials and lab testing.\nFamiliarity with BRCGS or similar standards.\nA meticulous, documentation-driven approach.",requirementsAr:"خلفية في المواد الملامِسة للأغذية والفحص المخبري.\nمعرفة بمعيار BRCGS أو ما يماثله.\nمنهجية دقيقة قائمة على التوثيق.",status:"published"},
  {id:uid(),title:"Sales Account Manager",titleAr:"مدير حسابات مبيعات",dept:"Sales",deptAr:"المبيعات",type:"Full-time",typeAr:"دوام كامل",location:"Regional",locationAr:"إقليمي",email:"sales.jobs@printopack.com.sa",summary:"Grow relationships with food, beverage and consumer brands across the region.",summaryAr:"تنمية العلاقات مع علامات الأغذية والمشروبات والمنتجات الاستهلاكية في المنطقة.",requirements:"5+ years of B2B packaging or FMCG sales.\nExisting brand relationships are a plus.\nFluent Arabic and English.",requirementsAr:"خبرة 5 سنوات فأكثر في مبيعات التغليف أو السلع الاستهلاكية (B2B).\nوجود علاقات قائمة مع العلامات ميزة إضافية.\nإتقان العربية والإنجليزية.",status:"draft"}
 ],
 partners:[
  {id:uid(),name:"",country:"Saudi Arabia",image:IMG.client(1),featured:"true",link:""},
  {id:uid(),name:"",country:"United Arab Emirates",image:IMG.client(2),featured:"true",link:""},
  {id:uid(),name:"",country:"Kuwait",image:IMG.client(3),featured:"true",link:""},
  {id:uid(),name:"",country:"Egypt",image:IMG.client(4),featured:"true",link:""},
  {id:uid(),name:"",country:"Jordan",image:IMG.client(5),featured:"true",link:""},
  {id:uid(),name:"",country:"Qatar",image:IMG.client(6),featured:"true",link:""},
  {id:uid(),name:"",country:"Bahrain",image:IMG.client(7),featured:"true",link:""},
  {id:uid(),name:"",country:"Sudan",image:IMG.client(8),featured:"true",link:""}
 ],
 factory:[
  {id:uid(),name:"Rotogravure Printing",nameAr:"الطباعة بالروتوغرافير",kind:"Department",image:IMG.dept(1),description:"Photographic-quality, multi-colour print with tight registration at production speed.",descriptionAr:"طباعة متعددة الألوان بجودة فوتوغرافية ودقّة تسجيل عالية وبسرعة إنتاجية."},
  {id:uid(),name:"Bagging & Converting",nameAr:"صناعة الأكياس والتحويل",kind:"Department",image:IMG.dept(2),description:"Converted bags and pouches in every format your line requires.",descriptionAr:"أكياس وأكياس واقفة محوّلة بكل المقاسات التي يتطلبها خطكم."},
  {id:uid(),name:"Punching & Finishing",nameAr:"التخريم والتشطيب",kind:"Department",image:IMG.dept(3),description:"Precision punching and finishing with solvent recovery.",descriptionAr:"تخريم وتشطيب دقيق مع استرجاع المذيبات."},
  {id:uid(),name:"Cylinder Engraving",nameAr:"حفر الأسطوانات",kind:"Department",image:IMG.dept(4),description:"In-house engraved cylinders, from artwork to press.",descriptionAr:"حفر الأسطوانات داخلياً، من التصميم إلى الطباعة."},
  {id:uid(),name:"Solvent Recovery",nameAr:"استرجاع المذيبات",kind:"Department",image:IMG.dept(5),description:"Responsible production with in-line solvent recovery.",descriptionAr:"إنتاج مسؤول مع استرجاع المذيبات ضمن الخط."},
  {id:uid(),name:"Warehouses",nameAr:"المستودعات",kind:"Warehouse",image:"/images/factory.jpg",description:"Climate-considered storage for raw material and finished goods.",descriptionAr:"تخزين يراعي الظروف المناخية للمواد الخام والمنتجات النهائية."}
 ],
 quality:[
  {id:uid(),title:"ISO 22000 Food Safety",titleAr:"الأيزو 22000 لسلامة الغذاء",kind:"Certificate",image:"",description:"Certified food-safety management for food-contact packaging.",descriptionAr:"إدارة معتمدة لسلامة الغذاء للتغليف الملامس للأغذية."},
  {id:uid(),title:"Quality Assurance Programme",titleAr:"برنامج ضمان الجودة",kind:"Assurance",image:"",description:"Quality built into every run, not inspected in at the end.",descriptionAr:"الجودة مدمجة في كل تشغيلة، لا تُفحص في النهاية فقط."},
  {id:uid(),title:"Laboratory & Testing",titleAr:"المختبر والفحص",kind:"Lab",image:"",description:"In-house lab for barrier, migration and print-quality testing.",descriptionAr:"مختبر داخلي لفحص الحاجز والانتقال وجودة الطباعة."}
 ],
 responsibility:[
  {id:uid(),title:"ISO 14000 Environmental",titleAr:"الأيزو 14000 البيئي",category:"Environment",image:"",description:"Environmental management across the plant and its processes.",descriptionAr:"إدارة بيئية تشمل المصنع وعملياته."},
  {id:uid(),title:"Safety & Anti-pollution Systems",titleAr:"أنظمة السلامة والحماية من التلوث",category:"Environment",image:"",description:"Safety management and pollution-control systems on site.",descriptionAr:"أنظمة إدارة السلامة والحماية من التلوث في الموقع."},
  {id:uid(),title:"Saudization Certificate",titleAr:"شهادة السعودة",category:"Local Community",image:"",description:"Commitment to local employment and the community.",descriptionAr:"التزام بالتوظيف المحلي وخدمة المجتمع."},
  {id:uid(),title:"Certified Global Shipping",titleAr:"الشحن العالمي المعتمد",category:"International",image:"",description:"Certified shipping and a safe product for global trade.",descriptionAr:"شحن معتمد ومنتج آمن للتجارة العالمية."}
 ],
 gallery:[
  {id:uid(),title:"On the print floor",titleAr:"داخل صالة الطباعة",kind:"Photo",image:IMG.dept(1),url:""},
  {id:uid(),title:"Finished product lineup",titleAr:"تشكيلة المنتجات النهائية",kind:"Photo",image:"/images/lineup.jpg",url:""},
  {id:uid(),title:"Printopack corporate film",titleAr:"الفيلم التعريفي لبرينتوباك",kind:"Video",image:"/images/factory.jpg",url:"https://"}
 ],
 formats:[
  {id:uid(),title:"Pillow Bags",titleAr:"أكياس وسادية"},{id:uid(),title:"Gusseted Bags",titleAr:"أكياس بجوانب مطويّة"},
  {id:uid(),title:"Center Seal Bags",titleAr:"أكياس بلحام مركزي"},{id:uid(),title:"Zipper Bags",titleAr:"أكياس بسحّاب"},
  {id:uid(),title:"Stand-up Pouches",titleAr:"عبوات واقفة"},{id:uid(),title:"Handle Bags",titleAr:"أكياس بمقبض"}
 ],
 standard:[
  {id:uid(),title:"Developed for your line",titleAr:"مطوّر لخطكم",text:"Structure, barrier and seal engineered around your product.",textAr:"يُهندَس التركيب والحاجز والغلق حول منتجكم."},
  {id:uid(),title:"Printed in-house",titleAr:"مطبوع داخلياً",text:"Rotogravure print with cylinders engraved under our own roof.",textAr:"طباعة روتوغرافير بأسطوانات تُحفر تحت سقفنا."},
  {id:uid(),title:"Food-safe by default",titleAr:"آمن غذائياً بطبيعته",text:"Food-grade materials and a quality system on every order.",textAr:"مواد ملائمة للأغذية ونظام جودة يرافق كل طلب."}
 ],
 values:[
  {id:uid(),title:"Quality without compromise",titleAr:"جودةٌ بلا تنازل",text:"Every reel is held to the Printopack standard, from incoming substrate to final dispatch.",textAr:"كل لفّةٍ تخضع لمعيار برنتوباك، من استلام المواد حتى التسليم النهائي."},
  {id:uid(),title:"Responsible by design",titleAr:"المسؤولية بالتصميم",text:"Food-safe materials, solvent recovery and efficient production run through everything we make.",textAr:"موادٌ آمنة غذائياً واسترجاعٌ للمذيبات وإنتاجٌ كفؤ في كل ما نصنع."},
  {id:uid(),title:"Partnership, not supply",titleAr:"شراكةٌ لا مجرّد توريد",text:"We advise on structure and print from the first brief, so the packaging fits the product and the line.",textAr:"نقدّم المشورة في البنية والطباعة منذ أول موجز، ليناسب التغليف المنتج وخط الإنتاج."},
  {id:uid(),title:"Built to deliver",titleAr:"التزامٌ بالتسليم",text:"Planned materials and export logistics mean orders land on time, run after run.",textAr:"تخطيطٌ للمواد ولوجستيات التصدير يضمن وصول الطلبات في وقتها، تشغيلةً بعد أخرى."}
 ],
 offices:[
  {id:uid(),city:"Head Office, Jeddah",cityAr:"المقر الرئيسي، جدة",group:"Saudi Arabia",cc:"sa",country:"Western Area",countryAr:"المنطقة الغربية",staffName:"Name Name",staffNameAr:"الاسم الاسم",staffRole:"Office manager",staffRoleAr:"مدير المكتب",phone:"+966 12 608 1074",email:"info@printopack.com.sa"},
  {id:uid(),city:"Riyadh Office",cityAr:"مكتب الرياض",group:"Saudi Arabia",cc:"",country:"Central Area",countryAr:"المنطقة الوسطى",staffName:"Name Name",staffNameAr:"الاسم الاسم",staffRole:"Office manager",staffRoleAr:"مدير المكتب",phone:"+966 57 675 8589",email:"riyadoffice@printopack.com.sa"},
  {id:uid(),city:"Jeddah Office",cityAr:"مكتب جدة",group:"Saudi Arabia",cc:"",country:"Western Area",countryAr:"المنطقة الغربية",staffName:"Name Name",staffNameAr:"الاسم الاسم",staffRole:"Office manager",staffRoleAr:"مدير المكتب",phone:"+966 566197783",email:"localsales@printopack.com.sa"},
  {id:uid(),city:"Dammam Office",cityAr:"مكتب الدمام",group:"Saudi Arabia",cc:"",country:"Eastern Area",countryAr:"المنطقة الشرقية",staffName:"Name Name",staffNameAr:"الاسم الاسم",staffRole:"Office manager",staffRoleAr:"مدير المكتب",phone:"+966 559226498",email:"wak@printopack.com.sa"},
  {id:uid(),city:"Key Accounts",cityAr:"الحسابات الرئيسية",group:"Saudi Arabia",cc:"",country:"Kingdom-wide",countryAr:"على مستوى المملكة",staffName:"Name Name",staffNameAr:"الاسم الاسم",staffRole:"Office manager",staffRoleAr:"مدير المكتب",phone:"+966 50 008 0791",email:"a.riaz@printopack.com.sa"},
  {id:uid(),city:"Yemen",cityAr:"اليمن",group:"Regional & Export",cc:"ye",country:"Yemen",countryAr:"اليمن",staffName:"Name Name",staffNameAr:"الاسم الاسم",staffRole:"Office manager",staffRoleAr:"مدير المكتب",phone:"+967 775299991",email:"yemen@printopack.com.sa"},
  {id:uid(),city:"Tunisia",cityAr:"تونس",group:"Regional & Export",cc:"tn",country:"Tunisia",countryAr:"تونس",staffName:"Sami Monser",staffNameAr:"سامي منصر",staffRole:"Regional Sales Manager",staffRoleAr:"مدير المبيعات الإقليمي",phone:"+216 28534504",email:"tunisia@printopack.com.sa"},
  {id:uid(),city:"Libya",cityAr:"ليبيا",group:"Regional & Export",cc:"ly",country:"Libya",countryAr:"ليبيا",staffName:"Sami Monser",staffNameAr:"سامي منصر",staffRole:"Regional Sales Manager",staffRoleAr:"مدير المبيعات الإقليمي",phone:"+216 28534504",email:"tunisia@printopack.com.sa"},
  {id:uid(),city:"Kuwait",cityAr:"الكويت",group:"Regional & Export",cc:"kw",country:"Kuwait",countryAr:"الكويت",staffName:"Nader Bilal",staffNameAr:"نادر بلال",staffRole:"Regional Sales Leader",staffRoleAr:"قائد المبيعات الإقليمي",phone:"+965 97707578",email:"kuwait@printopack.com.sa"},
  {id:uid(),city:"Morocco",cityAr:"المغرب",group:"Regional & Export",cc:"ma",country:"Morocco",countryAr:"المغرب",staffName:"Name Name",staffNameAr:"الاسم الاسم",staffRole:"Office manager",staffRoleAr:"مدير المكتب",phone:"+966 55 421 9918",email:"moroccooffice@printopack.com.sa"},
  {id:uid(),city:"International Sales",cityAr:"المبيعات الدولية",group:"Regional & Export",cc:"int",country:"International",countryAr:"دولي",staffName:"Name Name",staffNameAr:"الاسم الاسم",staffRole:"Office manager",staffRoleAr:"مدير المكتب",phone:"+966 50 873 9828",email:"ibrahim.ismail@printopack.com.sa"},
  {id:uid(),city:"Algeria",cityAr:"الجزائر",group:"Regional & Export",cc:"dz",country:"Algeria",countryAr:"الجزائر",staffName:"Elhaoues Chemseddine",staffNameAr:"الهواس شمس الدين",staffRole:"Regional Sales Leader",staffRoleAr:"قائد المبيعات الإقليمي",phone:"+213 553038979",email:"info-algeria@printopack.com.sa"},
  {id:uid(),city:"Egypt",cityAr:"مصر",group:"Regional & Export",cc:"eg",country:"Egypt",countryAr:"مصر",staffName:"Name Name",staffNameAr:"الاسم الاسم",staffRole:"Office manager",staffRoleAr:"مدير المكتب",phone:"+20 111 171 2221",email:"egypt@printopack.com.sa"},
  {id:uid(),city:"Sudan",cityAr:"السودان",group:"Regional & Export",cc:"sd",country:"Sudan",countryAr:"السودان",staffName:"Name Name",staffNameAr:"الاسم الاسم",staffRole:"Office manager",staffRoleAr:"مدير المكتب",phone:"+966 55 421 9918",email:"sudan@printopack.com.sa"},
  {id:uid(),city:"Jordan",cityAr:"الأردن",group:"Regional & Export",cc:"jo",country:"Jordan",countryAr:"الأردن",staffName:"Name Name",staffNameAr:"الاسم الاسم",staffRole:"Office manager",staffRoleAr:"مدير المكتب",phone:"+962 7 8570 6299",email:"jordan@printopack.com.sa"},
  {id:uid(),city:"Iraq",cityAr:"العراق",group:"Regional & Export",cc:"iq",country:"Iraq",countryAr:"العراق",staffName:"Name Name",staffNameAr:"الاسم الاسم",staffRole:"Office manager",staffRoleAr:"مدير المكتب",phone:"+962 7 8570 6299",email:"jordan@printopack.com.sa"},
  {id:uid(),city:"Syria",cityAr:"سوريا",group:"Regional & Export",cc:"sy",country:"Syria",countryAr:"سوريا",staffName:"Name Name",staffNameAr:"الاسم الاسم",staffRole:"Office manager",staffRoleAr:"مدير المكتب",phone:"+963 933431615",email:"bsh_moneer@hotmail.com"}
 ],
 about:{
  heroTitle:"Where technology meets vision.",heroTitleAr:"حيث تلتقي التقنية بالرؤية.",
  heroSub:"A global leader in developing and producing responsible packaging.",heroSubAr:"رائدون عالمياً في تطوير وإنتاج تغليف مسؤول.",
  history:"Packaging pioneers since 1997, printing from our Jeddah facility for the region and beyond.",historyAr:"روّاد في التغليف منذ عام 1997، نطبع من منشأتنا في جدة للمنطقة وخارجها.",
  ownership:"Saudi Modern Packaging Factory Co. Ltd.",ownershipAr:"شركة السعودية الحديثة للتغليف المحدودة.",
  mission:"To be the driving force behind brands' packaging evolution.",missionAr:"أن نكون القوة الدافعة وراء تطوّر تغليف العلامات التجارية.",
  vision:"Empowering brands through creative packaging excellence.",visionAr:"تمكين العلامات التجارية عبر التميّز في التغليف الإبداعي.",
  historyTitle:"From one line in 1997 to brands across 35 countries.",historyTitleAr:"من خطٍّ واحد عام 1997 إلى علاماتٍ في 35 دولة.",
  visionBody:"Printopack's vision is to redefine packaging as a transformative brand experience, fostering a sustainable and captivating future for industries worldwide.",visionBodyAr:"تسعى رؤية برنتوباك إلى إعادة تعريف التغليف بوصفه تجربةً تُحوِّل العلامة التجارية، وترسم مستقبلاً مستداماً وجاذباً للصناعات حول العالم.",
  missionBody:"At Printopack, our mission is to be the driving force behind brands' packaging evolution. With a legacy of expertise in flexible packaging solutions since 1997, we are dedicated to designing, developing, and producing responsible packaging that transcends mere functionality.",missionBodyAr:"رسالتنا في برنتوباك أن نكون القوة الدافعة وراء تطوّر تغليف العلامات التجارية. وبإرثٍ من الخبرة في حلول التغليف المرن منذ عام 1997، نلتزم بتصميم تغليفٍ مسؤول وتطويره وإنتاجه بما يتجاوز مجرّد الوظيفة.",
  statOffices:"10",statCountries:"35",statFounded:"1997",statEmployees:"400",statAvgExp:"14.5",statCustomers:"1000"
 },
 settings:{
  company:"Printopack - Saudi Modern Packaging Factory Co. Ltd.",companyAr:"برنتوباك - مصنع التغليف السعودي الحديث المحدود",
  phone:"+966 12 608 1074",fax:"+966 12 608 1082",email:"info@printopack.com.sa",
  hours:"9:00 AM to 5:00 PM",maxImageKb:"400",address:"Industrial Area 5, Unit 10, 8508, Jeddah 22428, Saudi Arabia",
  addressAr:"المنطقة الصناعية 5، وحدة 10، 8508، جدة 22428، المملكة العربية السعودية",
  addressShort:"Industrial Area 5, Jeddah, Saudi Arabia",addressShortAr:"المنطقة الصناعية 5، جدة، السعودية"
 }
};
/* Dual-mode data layer. When the Cloudflare backend is reachable (deployed), reads/writes
   go to /api. When it is not (local preview, or before the backend is provisioned), it falls
   back to localStorage so the admin keeps working. Reads are synchronous from an in-memory
   CACHE; writes update the CACHE immediately (snappy UI) and persist in the background. */
var API='/api';
var MODE='local';

/* A picture the client just uploaded lives in the database and only becomes the static file
   /uploads/<key> at the next Publish, so until then previews are read back from /media/<key>.
   Everywhere else (the live site) uses the /uploads path unchanged. */
function imgSrc(v){
 v=v||'';
 return MODE==='api'&&v.slice(0,9)==='/uploads/'?'/media/'+v.slice(9):v;
}
var COLLECTIONS=['news','productGroups','products','team','careers','partners','factory','quality','responsibility','gallery','offices','values','formats','standard'];
var CACHE={entries:{},singletons:{}};

function coll(k){return CACHE.entries[k]||(CACHE.entries[k]=[]);}
function obj(k){return CACHE.singletons[k]||(CACHE.singletons[k]={});}
function ensure(){} /* boot() loads the CACHE; kept as a no-op so render() stays unchanged */

/* local fallback persistence (flat shape, unchanged localStorage format) */
function flatDb(){var d={};COLLECTIONS.forEach(function(k){d[k]=CACHE.entries[k]||[];});d.about=CACHE.singletons.about||{};d.settings=CACHE.singletons.settings||{};return d;}
function persistLocal(){try{localStorage.setItem(KEY,JSON.stringify(flatDb()));}catch(e){}}
function loadLocal(){
 var d=null;try{d=JSON.parse(localStorage.getItem(KEY));}catch(e){}
 if(!d)d=SEED;
 /* A section added after this browser last saved falls back to its seed, so a new
    collection is not silently empty for someone with an older saved copy. */
 CACHE.entries={};COLLECTIONS.forEach(function(k){CACHE.entries[k]=(d[k]||SEED[k]||[]).slice();});
 CACHE.singletons={about:Object.assign({},SEED.about,d.about),settings:Object.assign({},SEED.settings,d.settings)};
 if(!localStorage.getItem(KEY))persistLocal();
}

/* api backend calls */
/* A picture is sent to /api/upload first and the record then stores the path it came back
   with. An upload that fails must fail the whole save: letting it through left the raw
   base64 picture sitting inside the record, which the server stores as ordinary text, so a
   400 KB photograph quietly became a 400 KB row that no page could ever display. */
function apiUploadDataUrls(rec){
 var jobs=[];
 Object.keys(rec).forEach(function(k){
  var v=rec[k];
  if(typeof v==='string'&&v.slice(0,5)==='data:'){
   jobs.push(apiSend(API+'/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({field:k,dataUrl:v})})
    .then(function(r){return r.json();})
    .then(function(o){
     if(!o||!o.url)throw new Error('upload returned no address');
     rec[k]=o.url;
    }));
  }
 });
 return Promise.all(jobs).then(function(){return rec;});
}
function apiSaveRecord(collection,rec){return apiUploadDataUrls(rec).then(function(r){return apiSend(API+'/'+collection,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(r)});});}
function apiDeleteRecord(collection,id){return apiSend(API+'/'+collection+'/'+encodeURIComponent(id),{method:'DELETE'});}
function apiSaveOrder(collection,ids){return apiSend(API+'/order/'+collection,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:ids})});}
function apiSaveSingleton(key,o){return apiSend(API+'/singleton/'+key,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(o)});}

/* unified writes (optimistic: update CACHE now, persist in the background) */
function labelOf(collection,rec){
 var m=MODELS[collection];var nm=rec&&(rec.name||rec.title||rec.city);
 return (m?m.singular:collection)+(nm?' \u201c'+String(nm).slice(0,40)+'\u201d':'');
}
function saveRecord(collection,rec){
 var arr=coll(collection);var i=arr.findIndex(function(x){return x.id===rec.id;});
 if(i>-1)arr[i]=rec;else arr.unshift(rec);
 pubTouch();
 if(MODE!=='api'){persistLocal();return;}
 /* A snapshot, so a replay sends the record as it was when it was saved rather than as the
    screen happens to be now. The SAME snapshot is reused on every retry: apiSaveRecord
    swaps a picture's base64 for the address it was stored at, and starting from a fresh
    copy each time would upload the same picture again on every attempt. */
 var copy=JSON.parse(JSON.stringify(rec));
 runWrite(labelOf(collection,rec),function(){
  return apiSaveRecord(collection,copy).then(function(){
   /* Put the stored addresses back into the record on screen, so editing it again does not
      re-upload a picture that is already on the server. */
   var live=coll(collection).filter(function(x){return x.id===copy.id;})[0];
   if(live)Object.keys(copy).forEach(function(k){
    if(typeof copy[k]==='string'&&copy[k].slice(0,9)==='/uploads/')live[k]=copy[k];
   });
  });
 });
}
function deleteRecord(collection,id){
 var gone=coll(collection).filter(function(x){return x.id===id;})[0];
 CACHE.entries[collection]=coll(collection).filter(function(x){return x.id!==id;});
 pubTouch();
 if(MODE!=='api'){persistLocal();return;}
 runWrite('Deleting '+labelOf(collection,gone),function(){return apiDeleteRecord(collection,id);});
}
/* Every page renders its collection in stored order and none of them re-sort, so this is
   what decides what comes first on the public site. Swapping with the neighbour keeps it
   predictable on a touch screen, where dragging a table row is unreliable. */
function moveRecord(collection,id,dir){
 var arr=coll(collection);
 var i=arr.findIndex(function(x){return x.id===id;});var j=i+dir;
 if(i<0||j<0||j>=arr.length)return false;
 var t=arr[i];arr[i]=arr[j];arr[j]=t;
 pubTouch();
 if(MODE!=='api'){persistLocal();return true;}
 var ids=arr.map(function(x){return x.id;});
 runWrite('New order in '+((MODELS[collection]||{}).label||collection),function(){return apiSaveOrder(collection,ids);});
 return true;
}
function setObj(k,o){
 CACHE.singletons[k]=o;pubTouch();
 if(MODE!=='api'){persistLocal();return;}
 var copy=JSON.parse(JSON.stringify(o));
 runWrite(k==='about'?'About & Home':'Settings',function(){return apiSaveSingleton(k,copy);});
}

/* Cloudflare Turnstile, mounted on demand. Both places that ask for the password (the login
   screen and the re-authentication dialog) need the same widget under the same rules, and the
   bot wall is server-driven: /api/config decides whether there is one at all. */
function tsMount(host){
 var st={on:false,token:null,widget:null,reset:function(){}};
 fetch(API+'/config').then(function(r){return r.json();}).then(function(c){
  if(!c||!c.turnstile)return;                                       /* no key configured: skip the wall */
  st.on=true;
  function draw(){st.widget=window.turnstile.render(host,{sitekey:c.turnstile,
   callback:function(t){st.token=t;},
   'expired-callback':function(){st.token=null;},
   'error-callback':function(){st.token=null;}});}
  if(window.turnstile&&window.turnstile.render){draw();return;}
  var s=document.createElement('script');
  s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  s.async=true;s.defer=true;s.onload=draw;document.head.appendChild(s);
 }).catch(function(){});                                            /* config unreachable: submit will fail cleanly */
 st.reset=function(){if(st.on&&window.turnstile&&st.widget!=null){window.turnstile.reset(st.widget);st.token=null;}};
 return st;
}

/* ---------------- writes that cannot be lost quietly ----------------
   Every edit updates the screen first and is sent to the server behind it, which is what
   makes the dashboard feel instant. The cost is that a failed send is invisible unless
   something says so, and the sign-in lasts 12 hours: an afternoon of work after it expired
   used to look completely saved, show a 2.6-second "check your connection", and be gone on
   the next reload.
   So a failed write is kept, named, and shown in a bar that stays until it is dealt with;
   an expired sign-in opens the password dialog and replays the work the moment it is back. */
var FAILED=[];
function apiSend(url,opts){
 return fetch(url,opts||{}).then(function(r){
  if(r.ok)return r;
  var e=new Error('http '+r.status);e.status=r.status;throw e;
 });
}
/* label: what the client would call the thing they just did, so the bar can name it. */
function runWrite(label,fn){
 fn().catch(function(e){
  var expired=!!(e&&e.status===401);
  FAILED.push({label:label,run:fn,expired:expired});
  renderFailBar();
  if(expired)openReauth();
 });
}
function failBarEl(){
 var el=document.getElementById('failbar');
 if(!el){el=document.createElement('div');el.id='failbar';el.className='failbar';document.body.appendChild(el);}
 return el;
}
function renderFailBar(){
 var el=failBarEl();
 if(!FAILED.length){el.className='failbar';el.innerHTML='';return;}
 var expired=FAILED.some(function(f){return f.expired;});
 var names=FAILED.map(function(f){return f.label;}).filter(function(v,i,a){return a.indexOf(v)===i;}).slice(0,3).join(', ');
 el.className='failbar show'+(expired?' expired':'');
 el.innerHTML='<div class="fb-text"><b>'+FAILED.length+' change'+(FAILED.length===1?'':'s')+' not saved on the server.</b> '+
  esc(names)+(FAILED.length>3?' and more':'')+'. '+
  (expired?'Your sign-in expired while you were working. Sign in again and they will be saved.'
          :'The server could not be reached. Keep this page open and try again.')+'</div>'+
  '<div class="fb-acts">'+(expired
   ?'<button class="btn btn-ok btn-sm" id="fbAuth">Sign in and save</button>'
   :'<button class="btn btn-ok btn-sm" id="fbRetry">Try again</button>')+
  '<button class="btn btn-ghost btn-sm" id="fbReload">Discard and reload</button></div>';
 var a=document.getElementById('fbAuth');if(a)a.addEventListener('click',openReauth);
 var r=document.getElementById('fbRetry');if(r)r.addEventListener('click',function(){retryFailed();});
 var d=document.getElementById('fbReload');
 if(d)d.addEventListener('click',function(){
  if(!confirm('Discard the '+FAILED.length+' unsaved change'+(FAILED.length===1?'':'s')+' and reload what is on the server?'))return;
  FAILED=[];renderFailBar();boot();
 });
}
/* Replays every failed write in the order it was made, so a create followed by an edit of the
   same record cannot land the wrong way round. Anything that fails again stays in the list. */
function retryFailed(){
 var queue=FAILED.slice();FAILED=[];renderFailBar();
 var still=[];
 return queue.reduce(function(chain,item){
  return chain.then(function(){
   return item.run().catch(function(e){item.expired=!!(e&&e.status===401);still.push(item);});
  });
 },Promise.resolve()).then(function(){
  FAILED=still;renderFailBar();
  if(!still.length)toast('All changes saved','ok');
  else if(still.some(function(f){return f.expired;}))openReauth();
  else toast('Still could not save. Please check your connection.','err');
  pubRefresh();
 });
}
/* Sign in again without losing the page. The dashboard stays exactly as it is behind this. */
function openReauth(){
 if(document.getElementById('reauthHost'))return;                    /* one dialog at a time */
 var host=document.createElement('div');host.id='reauthHost';
 host.innerHTML='<div class="overlay show"></div>'+
  '<div class="pubm" role="dialog" aria-modal="true">'+
   '<div class="pubm-head"><h2>Please sign in again</h2></div>'+
   '<div class="pubm-body">'+
    '<p class="pubm-intro">Your sign-in lasts 12 hours and has expired. Nothing you typed is lost: sign in and the changes waiting here are saved straight away.</p>'+
    '<div class="field"><label>Password</label><input type="password" id="rapw" autocomplete="current-password" autofocus></div>'+
    '<div id="rats" style="margin:8px 0 0"></div>'+
    '<p class="pubm-err" id="raerr" hidden></p>'+
   '</div>'+
   '<div class="pubm-foot"><button class="btn btn-ghost" id="raCancel">Not now</button>'+
    '<button class="btn btn-ok" id="raGo">Sign in and save</button></div>'+
  '</div>';
 document.body.appendChild(host);
 var ts=tsMount('#rats');
 var err=host.querySelector('#raerr'),go=host.querySelector('#raGo');
 function fail(m){go.disabled=false;go.textContent='Sign in and save';err.textContent=m;err.hidden=false;ts.reset();}
 host.querySelector('#raCancel').addEventListener('click',function(){host.remove();});
 function submit(){
  var pw=host.querySelector('#rapw').value;err.hidden=true;
  if(ts.on&&!ts.token){fail('Please complete the verification.');return;}
  go.disabled=true;go.textContent='Signing in...';
  fetch(API+'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw,turnstileToken:ts.token})})
   .then(function(r){
    if(r.ok){try{localStorage.setItem(SKEY,'1');}catch(e){}host.remove();retryFailed();return;}
    return r.json().catch(function(){return {};}).then(function(o){
     fail(r.status===401?'Wrong password. Please try again.':((o&&o.error)||'Sign in failed. Please try again.'));
    });
   }).catch(function(){fail('Network error. Please check your connection and try again.');});
 }
 go.addEventListener('click',submit);
 host.querySelector('#rapw').addEventListener('keydown',function(e){if(e.key==='Enter')submit();});
}

/* boot: ask the backend for content. Three outcomes:
   - 200  -> deployed and the session cookie is valid: load content, show the dashboard.
   - 401  -> deployed but not signed in: show the real login screen (the API stays closed).
   - error  -> backend unreachable: show the login screen with a notice. There is no offline
               demo sign-in: the admin only ever admits against a valid server session. */
function boot(){
 fetch(API+'/bootstrap',{headers:{'Accept':'application/json'}}).then(function(r){
  if(r.status===401){MODE='api';renderLogin();return null;}
  if(!r.ok)throw 0;
  return r.json();
 }).then(function(d){
  if(!d)return;
  MODE='api';CACHE.entries=d.entries||{};CACHE.singletons=d.singletons||{};
  COLLECTIONS.forEach(function(k){if(!CACHE.entries[k])CACHE.entries[k]=[];});
  try{localStorage.setItem(SKEY,'1');}catch(e){}
  render();pubRefresh();
  enqLoad(function(){syncSidebar();if(view==='dashboard')renderView();});
 }).catch(function(){renderLogin('Cannot reach the backend. The admin requires the live backend to sign in.');});
}

/* ---------------- models ---------------- */
var sel=function(a){return a;};
var MODELS={
 news:{label:"News & Events",singular:"Post",icon:"news",group:"Content",hasImport:true,hasCalendar:true,
  columns:[{type:"thumb",field:"image"},{type:"title",field:"title",sub:"category"},{type:"pill",field:"status"},{type:"date",field:"date"}],
  fields:[{name:"image",type:"image",label:"Cover image",frame:"3/2",rec:"1200 × 800px (landscape, JPG)"},{name:"category",type:"select",label:"Category",half:true,options:["General","Company News","Sustainability","Certifications","Events","Products"]},{name:"date",type:"date",label:"Date",half:true},{name:"status",type:"select",label:"Status",half:true,options:["draft","published"]},{name:"title",type:"text",label:"Title (English)"},{name:"body",type:"textarea",label:"Body (English)"},{name:"titleAr",type:"text",label:"Title",ar:"Arabic",rtl:true},{name:"bodyAr",type:"textarea",label:"Body",ar:"Arabic (review before publishing)",rtl:true}]},
 productGroups:{label:"Product Groups",singular:"Group",icon:"products",group:"Content",
  columns:[{type:"thumb",field:"image",contain:true},{type:"title",field:"name",sub:"description"},{type:"text",field:"nameAr"}],
  fields:[{name:"image",type:"image",label:"Group image",contain:true,frame:"4/3",rec:"1000 × 750px (transparent PNG)"},{name:"name",type:"text",label:"Name (English)",half:true},{name:"nameAr",type:"text",label:"Name",ar:"Arabic",rtl:true,half:true},{name:"kind",type:"select",label:"Type",half:true,options:["Group","Measurements"],rec:"A Measurements group is a size chart rather than a product range: its page shows the drawing at full page width."},{name:"filter",type:"select",label:"Browse family",half:true,options:["snacks","confectionery","bakery","staples","beverage","chilled","specialty"],rec:"Which heading this group sits under in the Browse list on the products page. Snacks · Confectionery · Bakery & Breads · Pantry Staples · Bottles & Liquids · Frozen & Chilled · Specialty."},{name:"description",type:"textarea",label:"Description (English)"},{name:"descriptionAr",type:"textarea",label:"Description",ar:"Arabic",rtl:true}]},
 products:{label:"Products",singular:"Product",icon:"products",group:"Content",
  columns:[{type:"thumb",field:"image",contain:true},{type:"title",field:"name",sub:"category"},{type:"active",field:"active"}],
  fields:[{name:"image",type:"image",label:"Product image",frame:"4/3",rec:"1000 × 750px (landscape photo, JPG)"},{name:"name",type:"text",label:"Name (English)",half:true},{name:"category",type:"select",label:"Group",half:true,optionsFrom:"productGroups"},{name:"kind",type:"select",label:"Type",half:true,options:["Product","Measurements"],rec:"A Measurements section is shown differently: full width, the chart uncropped, and openable at full size, because the sizes printed on it have to be readable."},{name:"description",type:"textarea",label:"Description (English)"},{name:"nameAr",type:"text",label:"Name",ar:"Arabic",rtl:true,half:true},{name:"active",type:"select",label:"Visible on site",half:true,options:["true","false"]},{name:"descriptionAr",type:"textarea",label:"Description",ar:"Arabic",rtl:true}]},
 team:{label:"Our Team",singular:"Member",icon:"team",group:"Content",
  columns:[{type:"thumb",field:"photo",round:true},{type:"title",field:"name",sub:"role"},{type:"text",field:"experience",prefix:"",suffix:" yrs"},{type:"text",field:"email"}],
  fields:[{name:"photo",type:"image",label:"Photo",frame:"1/1",rec:"600 × 600px (square, JPG)"},{name:"mono",type:"text",label:"Monogram (initials, shown until a photo is added)",half:true},{name:"name",type:"text",label:"Name (English)",half:true},{name:"role",type:"text",label:"Role (English)",half:true},{name:"nameAr",type:"text",label:"Name",ar:"Arabic",rtl:true,half:true},{name:"roleAr",type:"text",label:"Role",ar:"Arabic",rtl:true,half:true},{name:"email",type:"text",label:"Email",half:true},{name:"experience",type:"number",label:"Years of experience",half:true},{name:"bio",type:"textarea",label:"Short note (English)"},{name:"bioAr",type:"textarea",label:"Short note",ar:"Arabic",rtl:true}]},
 careers:{label:"Careers",singular:"Job",icon:"careers",group:"Content",
  columns:[{type:"title",field:"title",sub:"dept"},{type:"text",field:"type"},{type:"text",field:"location"},{type:"pill",field:"status"}],
  fields:[{name:"title",type:"text",label:"Title (English)",half:true},{name:"titleAr",type:"text",label:"Title",ar:"Arabic",rtl:true,half:true},{name:"dept",type:"select",label:"Department",half:true,options:["Production","Quality","Sales","Engineering","Admin","Logistics","IT"]},{name:"deptAr",type:"text",label:"Department",ar:"Arabic",rtl:true,half:true},{name:"type",type:"select",label:"Type",half:true,options:["Full-time","Part-time","Contract","Internship"]},{name:"typeAr",type:"text",label:"Type",ar:"Arabic",rtl:true,half:true},{name:"location",type:"text",label:"Location",half:true},{name:"locationAr",type:"text",label:"Location",ar:"Arabic",rtl:true,half:true},{name:"status",type:"select",label:"Status",half:true,options:["draft","published"]},{name:"email",type:"text",label:"Application email",half:true,rec:"Applications for THIS role go here. Send a manager vacancy to that manager rather than to one shared inbox."},{name:"summary",type:"textarea",label:"Summary (English)",rec:"One or two lines, shown under the job title."},{name:"summaryAr",type:"textarea",label:"Summary",ar:"Arabic",rtl:true},{name:"requirements",type:"textarea",label:"Requirements (English)",rec:"One requirement per line. Each line becomes a bullet on the site."},{name:"requirementsAr",type:"textarea",label:"Requirements",ar:"Arabic",rtl:true}]},
 partners:{label:"Success Partners",singular:"Partner",icon:"partners",group:"Content",
  columns:[{type:"thumb",field:"image",contain:true},{type:"title",field:"name",sub:"country",fallback:"country"},{type:"text",field:"country"}],
  fields:[{name:"image",type:"image",label:"Logo",contain:true,frame:"8/5",rec:"480 × 300px (transparent PNG)"},{name:"name",type:"text",label:"Client name (English)",half:true},{name:"nameAr",type:"text",label:"Client name",ar:"Arabic",rtl:true,half:true},{name:"country",type:"text",label:"Country (English)",half:true},{name:"countryAr",type:"text",label:"Country",ar:"Arabic",rtl:true,half:true},{name:"featured",type:"select",label:"Main partner",half:true,options:["false","true"],rec:"Main partners are the ones shown on the home page. There are always exactly "+MAIN_PARTNERS+" of them, so turn one off before turning another on."},{name:"link",type:"url",label:"Website (optional)"}]},
 factory:{label:"Factory Departments",singular:"Department",icon:"factory",group:"Company",
  columns:[{type:"thumb",field:"image"},{type:"title",field:"name",sub:"kind"},{type:"tag",field:"kind"}],
  fields:[{name:"image",type:"image",label:"Photo",frame:"4/3",rec:"1200 × 900px (landscape, JPG)"},{name:"name",type:"text",label:"Name (English)",half:true},{name:"kind",type:"select",label:"Type",half:true,options:["Department","Warehouse"]},{name:"nameAr",type:"text",label:"Name",ar:"Arabic",rtl:true},{name:"description",type:"textarea",label:"Description (English)"},{name:"descriptionAr",type:"textarea",label:"Description",ar:"Arabic",rtl:true}]},
 quality:{label:"Quality System",singular:"Item",icon:"quality",group:"Company",
  columns:[{type:"thumb",field:"image"},{type:"title",field:"title",sub:"kind"},{type:"tag",field:"kind"}],
  fields:[{name:"image",type:"image",label:"Certificate / image",contain:true,frame:"3/4",rec:"1050 × 1400px (portrait, JPG or PNG)"},{name:"title",type:"text",label:"Title (English)",half:true},{name:"kind",type:"select",label:"Type",half:true,options:["Certificate","Assurance","Lab"]},{name:"titleAr",type:"text",label:"Title",ar:"Arabic",rtl:true},{name:"description",type:"textarea",label:"Description (English)"},{name:"descriptionAr",type:"textarea",label:"Description",ar:"Arabic",rtl:true}]},
 responsibility:{label:"Social Responsibility",singular:"Item",icon:"responsibility",group:"Company",
  columns:[{type:"thumb",field:"image"},{type:"title",field:"title",sub:"category"},{type:"tag",field:"category"}],
  fields:[{name:"image",type:"image",label:"Certificate / image",contain:true,frame:"3/4",rec:"1050 × 1400px (portrait, JPG or PNG)"},{name:"title",type:"text",label:"Title (English)",half:true},{name:"category",type:"select",label:"Area",half:true,options:["Environment","Local Community","International"]},{name:"titleAr",type:"text",label:"Title",ar:"Arabic",rtl:true},{name:"description",type:"textarea",label:"Description (English)"},{name:"descriptionAr",type:"textarea",label:"Description",ar:"Arabic",rtl:true}]},
 gallery:{label:"Gallery",singular:"Item",icon:"gallery",group:"Company",
  columns:[{type:"thumb",field:"image"},{type:"title",field:"title",sub:"kind"},{type:"tag",field:"kind"}],
  fields:[{name:"kind",type:"select",label:"Type",half:true,options:["Photo","Video","Advertisement"]},{name:"span",type:"select",label:"Size (photos & ads)",half:true,options:["normal","wide","tall"]},{name:"title",type:"text",label:"Title (English)",half:true},{name:"image",type:"image",label:"Image / thumbnail",frame:"8/5",rec:"1600 × 1000px JPG/WebP. Wide and tall tiles crop more; use Focus point. For videos, upload only a poster image."},{name:"titleAr",type:"text",label:"Title",ar:"Arabic",rtl:true},{name:"url",type:"url",label:"External video / campaign link",rec:"Paste a YouTube or Vimeo link. Do not upload video files."}]},
 values:{label:"Our Values",singular:"Value",icon:"about",group:"Company",
  columns:[{type:"title",field:"title",sub:"text"},{type:"text",field:"titleAr"}],
  fields:[{name:"title",type:"text",label:"Value (English)",half:true},{name:"titleAr",type:"text",label:"Value",ar:"Arabic",rtl:true,half:true},{name:"text",type:"textarea",label:"Description (English)"},{name:"textAr",type:"textarea",label:"Description",ar:"Arabic",rtl:true}]},
 formats:{label:"Bag Formats",singular:"Format",icon:"products",group:"Content",
  columns:[{field:"title"},{field:"titleAr"}],
  fields:[{name:"title",type:"text",label:"Format (English)",half:true},{name:"titleAr",type:"text",label:"Format",ar:"Arabic",rtl:true,half:true}]},
 standard:{label:"The Printopack Standard",singular:"Point",icon:"quality",group:"Content",
  columns:[{field:"title"},{field:"text"}],
  fields:[{name:"title",type:"text",label:"Point (English)",half:true},{name:"titleAr",type:"text",label:"Point",ar:"Arabic",rtl:true,half:true},{name:"text",type:"textarea",label:"Text (English)"},{name:"textAr",type:"textarea",label:"Text",ar:"Arabic",rtl:true}],
  note:"Shown on every product group page under \"What every order includes\"."},
 offices:{label:"Offices & Contact",singular:"Office",icon:"offices",group:"Site",
  columns:[{type:"title",field:"city",sub:"staffName"},{type:"text",field:"phone"},{type:"text",field:"email"}],
  fields:[{name:"photo",type:"image",label:"Office manager's photo",frame:"1/1",rec:"420 × 420px, square. Shown beside the office on the contact page; initials stand in until one is added."},{name:"city",type:"text",label:"Office (English)",half:true},{name:"cityAr",type:"text",label:"Office",ar:"Arabic",rtl:true,half:true},{name:"group",type:"select",label:"Group",half:true,options:["Saudi Arabia","Regional & Export"]},{name:"cc",type:"select",label:"Country on the map",half:true,options:CC_OPTIONS,rec:"Which country this office lights up on the map, and whose details the map shows. Leave blank for a branch inside a country that already has an office (Riyadh, Dammam). 'int' is International Sales, which appears in the selector but has no country to colour."},{name:"country",type:"text",label:"Country / area (English)",half:true},{name:"countryAr",type:"text",label:"Country / area",ar:"Arabic",rtl:true,half:true},{name:"staffName",type:"text",label:"Manager name (English)",half:true},{name:"staffNameAr",type:"text",label:"Manager name",ar:"Arabic",rtl:true,half:true},{name:"staffRole",type:"text",label:"Manager title (English)",half:true},{name:"staffRoleAr",type:"text",label:"Manager title",ar:"Arabic",rtl:true,half:true},{name:"phone",type:"text",label:"Phone",half:true},{name:"email",type:"text",label:"Email",half:true}]}
};
/* The fields that MUST be filled before a record can be saved, per model. These are the
   identifying names/titles, the visual-anchor images, and the categorisation each record needs
   to slot into the site; leaving them blank breaks the card and list layouts. Arabic and
   genuinely optional fields stay free. Applied to the MODELS field objects as f.req below. */
var REQUIRED={
 news:["image","title","category","date","body"],
 productGroups:["image","name","filter"],
 products:["image","name","category"],
 team:["name","role","experience"],
 careers:["title","dept","type","location","email","requirements"],
 partners:["image","name","country"],
 factory:["image","name","kind","description"],
 quality:["image","title","kind"],
 responsibility:["image","title","category"],
 gallery:["kind","title","image"],
 values:["title","text"],
 formats:["title"],
 standard:["title","text"],
 // An office is bilingual contact data shown on the contact page and both maps; a blank English
 // OR Arabic field leaves a gap in the RTL layout, so every naming/contact field is required.
 // 'cc' stays optional on purpose: branch offices inside an existing country (Riyadh, Dammam)
 // deliberately leave it blank, and the map-country toggle always sets it itself.
 offices:["city","cityAr","country","countryAr","staffName","staffNameAr","staffRole","staffRoleAr","phone","email"]
};
Object.keys(REQUIRED).forEach(function(k){var s=REQUIRED[k];((MODELS[k]||{}).fields||[]).forEach(function(f){if(s.indexOf(f.name)>-1)f.req=true;});});

/* ---------------- auth ---------------- */
var SKEY='pp_admin_session';
function loggedIn(){return localStorage.getItem(SKEY)==='1';}
/* Sign in against the real backend (/api/login). The one account belongs to the marketing
   department. There is no offline demo sign-in: if the backend cannot be reached, the login
   fails rather than admitting anyone. To preview the admin locally, run it against the real
   backend with `wrangler pages dev` (which serves /api and enforces the password). */
/* LOCAL TESTING ONLY -- REMOVE BEFORE LAUNCH. A one-click sign in that skips the password and
   the bot wall, so the admin can be reviewed on a local `wrangler pages dev` server without the
   real bootstrap password. Only ever rendered when the page is served from localhost; the paired
   backend branch in functions/api/login.js is hard-gated to a localhost hostname too, so this can
   never work in production. Delete this function, its call site, and the backend block before launch. */
function isLocalHost(){var h=location.hostname;return h==='localhost'||h==='127.0.0.1'||h==='::1'||h==='[::1]';}
function devSignInHTML(){return isLocalHost()?'<button class="btn btn-ghost" id="ldev" type="button" style="width:100%;justify-content:center;padding:11px;margin-top:10px">Developer sign in (local testing only)</button>':'';}
function renderLogin(msg){
 root.innerHTML='<div class="login"><form class="login-card" id="lf">'+
  '<img class="login-logo" src="/images/printopack-logo.png" alt="Printopack">'+
  '<p class="login-sub">'+esc(T('Site administration · Marketing'))+'</p>'+
  '<h1>'+esc(T('Admin sign in'))+'</h1>'+
  '<div class="field"><label>'+esc(T('Password'))+'</label><input type="password" id="lpw" autocomplete="current-password" required autofocus></div>'+
  '<div id="lts" style="margin:0 0 12px"></div>'+
  '<p class="login-err" id="lerr" hidden style="color:#b00020;font-size:13px;margin:-4px 0 12px"></p>'+
  '<button class="btn btn-primary" id="lbtn" style="width:100%;justify-content:center;padding:13px" type="submit">'+esc(T('Sign in'))+'</button>'+
  devSignInHTML()+
  '<p class="login-note">'+esc(T('Restricted area for Printopack marketing. Customer accounts are managed in the customer portal.'))+'</p>'+
  '<a class="login-portal" href="https://printopack.azurewebsites.net/">'+esc(T('Are you a customer? Go to the customer portal \u2192'))+'</a>'+
  '<a class="login-back" href="/">'+esc(T('\u2190 Back to the website'))+'</a>'+
  langToggleHTML('lang-sw login-lang')+
 '</form></div>';
 bindLang(root);
 var err=$('#lerr'),btn=$('#lbtn');
 if(msg){err.textContent=msg;err.hidden=false;}
 /* Turnstile: the bot wall is optional and server-driven. Ask /api/config whether a site key is
    set; if so, render the widget and hold its token, requiring it before we allow a submit. */
 var ts=tsMount('#lts');
 function resetTs(){ts.reset();}
 $('#lf').addEventListener('submit',function(e){
  e.preventDefault();
  var pw=$('#lpw').value;err.hidden=true;
  function fail(msg){btn.disabled=false;btn.textContent=T('Sign in');err.textContent=msg;err.hidden=false;}
  if(ts.on&&!ts.token){fail(T('Please complete the verification.'));return;}
  btn.disabled=true;btn.textContent=T('Signing in...');
  fetch(API+'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw,turnstileToken:ts.token})}).then(function(r){
   if(r.ok){localStorage.setItem(SKEY,'1');boot();return;}          /* cookie set: reload content */
   if(r.status===404){resetTs();return fail(T('The backend is not reachable, so sign in is unavailable here. Use the live site.'));}
   return r.json().catch(function(){return {};}).then(function(o){  /* backend present but rejected */
    resetTs();                                                      /* one token is one attempt: get a fresh one */
    if(r.status===401)return fail(T('Wrong password. Please try again.'));
    fail((o&&o.error)||T('Sign in failed. Please try again.'));        /* 429 lockout / 403 bot / 500 misconfig carry a message */
   });
  }).catch(function(){resetTs();fail(T('Network error. Please check your connection and try again.'));});
 });
 /* LOCAL TESTING ONLY -- REMOVE BEFORE LAUNCH (see devSignInHTML). */
 var dev=$('#ldev');
 if(dev)dev.addEventListener('click',function(){
  dev.disabled=true;dev.textContent='Signing in...';err.hidden=true;
  fetch(API+'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dev:true})}).then(function(r){
   if(r.ok){localStorage.setItem(SKEY,'1');boot();return;}
   dev.disabled=false;dev.textContent='Developer sign in (local testing only)';
   err.textContent='Developer sign in is only available on a local server.';err.hidden=false;
  }).catch(function(){dev.disabled=false;dev.textContent='Developer sign in (local testing only)';err.textContent='Network error.';err.hidden=false;});
 });
}

/* ---------------- shell ---------------- */
var view='dashboard';
var NAV=[{k:'dashboard',label:'Dashboard',icon:'dash'},{k:'enquiries',label:'Enquiries',icon:'inbox'},{grp:'Content'},{k:'news'},{k:'products'},{k:'team'},{k:'careers'},{k:'partners'},{k:'formats'},{k:'standard'},{grp:'Company'},{k:'factory'},{k:'quality'},{k:'responsibility'},{k:'values'},{k:'gallery'},{grp:'Site'},{k:'about',label:'About & Home',icon:'about'},{k:'offices'},{k:'countries',label:'Countries on the map',icon:'offices'},{k:'settings',label:'Settings',icon:'settings'},{k:'security',label:'Password',icon:'logout'}];
function sidebar(){
 var items=NAV.map(function(n){
  if(n.grp)return '<div class="sb-group">'+esc(T(n.grp))+'</div>';
  if(n.k==='security'&&MODE!=='api')return ''; /* password change needs the live backend */
  var m=MODELS[n.k]; var label=n.label||(m&&m.label)||n.k; var icon=n.icon||(m&&m.icon)||'dash';
  var badge=m?'<span class="badge">'+coll(n.k).length+'</span>':'';
  if(n.k==='enquiries')badge=ENQ.counts.unread?'<span class="badge alert">'+ENQ.counts.unread+'</span>':'';
  return '<div class="sb-item'+(view===n.k?' on':'')+'" data-nav="'+n.k+'">'+svg(icon)+'<span>'+esc(T(label))+'</span>'+badge+'</div>';
 }).join('');
 return '<aside class="sidebar"><div class="sb-brand"><img class="sb-logo" src="/images/printopack-logo-white.png" alt="Printopack"><small>'+esc(T('System · Admin'))+'</small></div>'+
  '<nav class="sb-nav">'+items+'</nav>'+
  '<div class="sb-pub" id="pub"></div>'+
  '<div class="sb-foot"><div class="sb-user"><div class="av">MK</div><div><div class="nm">'+esc(T('Marketing'))+'</div><div class="rl">'+esc(T('Site administrator'))+'</div></div></div>'+
  '<a class="sb-site" href="/" target="_blank" rel="noopener">'+svg('external')+esc(T('View website'))+'</a>'+
  '<button class="sb-logout" data-logout>'+svg('logout')+esc(T('Sign out'))+'</button>'+langToggleHTML()+'</div></aside>';
}

/* ---------------- publishing ----------------
   Saving and going live are two different things, and the client must never have to guess
   which one they just did. Every edit is saved instantly and privately; this panel is the
   only thing that puts it in front of the public, and it sits in the sidebar so it is
   reachable from every screen. */
var PUB={pending:false,publishedAt:null,canDeploy:true,busy:false,changes:[],firstPublish:false};
function agoText(ts){
 if(!ts)return T('never');
 var s=Math.floor((Date.now()-ts)/1000);
 if(s<90)return T('just now');
 if(s<5400)return T('{n} min ago',{n:Math.round(s/60)});
 var d=new Date(ts),now=new Date();
 var sameDay=d.toDateString()===now.toDateString();
 var loc=LANG==='ar'?'ar':'en-GB';
 return T('{d} at {t}',{
  d:sameDay?T('today'):d.toLocaleDateString(loc,{day:'numeric',month:'short'}),
  t:d.toLocaleTimeString(loc,{hour:'2-digit',minute:'2-digit'})});
}
/* Kept to two lines: the sidebar nav already needs the height, and this panel is pinned above
   it on every screen. Status and last-published time share one line under the button. */
function pubRender(){
 var el=$('#pub');if(!el)return;
 if(PUB.busy){
  el.className='sb-pub busy';
  el.innerHTML='<button class="pub-btn" disabled>'+svg('publish')+esc(T('Publishing…'))+'</button>'+
   '<p class="pub-note">'+esc(T(PUB.canDeploy?'The site rebuilds in a minute or two.':'Saving your changes for publishing.'))+'</p>';
  return;
 }
 el.className='sb-pub'+(PUB.pending?' pending':'');
 var cnt=pendingCount(),label;
 if(!PUB.pending)label=T('Everything is live');
 else if(PUB.firstPublish)label=T('Ready for first publish');
 else if(cnt>0)label=T('{n} changes not live yet',{n:cnt});
 else label=T('Changes not live yet');
 /* Say this before they press the button, not after: without the deploy hook a publish saves
    the snapshot and the website does not change. */
 var warn=PUB.canDeploy?'':'<p class="pub-note warn">'+esc(T('Automatic rebuild is not set up yet, so publishing will not update the website.'))+'</p>';
 el.innerHTML='<button class="pub-btn" id="pubgo"'+(PUB.pending?'':' disabled')+'>'+svg('publish')+esc(T('Publish to live site'))+'</button>'+
  warn+
  '<p class="pub-note"><i></i>'+esc(label)+' · '+esc(T('last published {x}.',{x:agoText(PUB.publishedAt)}))+'</p>';
 var b=$('#pubgo');if(b)b.addEventListener('click',openPubModal);
}
/* Total individual edits waiting to go live, across every section. */
function pendingCount(){
 var n=0;(PUB.changes||[]).forEach(function(c){n+=(c.kind==='singleton')?1:(c.added+c.edited+c.removed);});
 return n;
}
/* A section's friendly name, reusing the same labels shown in the nav. */
function secLabel(key){
 if(MODELS[key]&&MODELS[key].label)return T(MODELS[key].label);
 for(var i=0;i<NAV.length;i++)if(NAV[i].k===key&&NAV[i].label)return T(NAV[i].label);
 return key;
}
/* The human-readable list of what a publish would put live. */
function changeRows(){
 if(PUB.firstPublish)return '<p class="pubm-first">'+esc(T('This is the first publish. Your entire website will be built and go live for the first time.'))+'</p>';
 if(!PUB.changes||!PUB.changes.length)return '<p class="pubm-first">'+esc(T('Your saved changes are ready to go live.'))+'</p>';
 return '<ul class="pubm-list">'+PUB.changes.map(function(c){
  var parts=[];
  if(c.kind==='singleton')parts.push(T('updated'));
  else{
   if(c.added)parts.push(T('{n} added',{n:c.added}));
   if(c.edited)parts.push(T('{n} edited',{n:c.edited}));
   if(c.removed)parts.push(T('{n} removed',{n:c.removed}));
  }
  return '<li><span class="pubm-sec">'+esc(secLabel(c.key))+'</span><span class="pubm-det">'+parts.join(' · ')+'</span></li>';
 }).join('')+'</ul>';
}
/* Called after every save so the sidebar reacts immediately, without waiting for the server
   to be asked again. */
function pubTouch(){if(!PUB.pending){PUB.pending=true;pubRender();}}
function pubRefresh(){
 if(MODE!=='api'){PUB.pending=true;pubRender();return;}
 fetch(API+'/publish').then(function(r){return r.json();}).then(function(s){
  if(!s)return;
  PUB.pending=!!s.pending;PUB.publishedAt=s.publishedAt;PUB.canDeploy=s.canDeploy!==false;
  PUB.changes=s.changes||[];PUB.firstPublish=!!s.firstPublish;
  pubRender();
 }).catch(function(){});
}
/* The publish dialog. Rather than a bare "are you sure?", it shows exactly what will go live
   and, once done, spells out what happens next and when the site will actually update, so the
   client is never left guessing whether the website changed. */
function openPubModal(){
 if(MODE!=='api'){toast(T('This is a preview copy. Publishing works on the live site.'),'err');return;}
 if(FAILED.length){
  toast(T('Some changes are not saved on the server yet. Save them before publishing.'),'err');
  renderFailBar();return;
 }
 /* The change list was fetched once when the dashboard loaded, so after an afternoon of
    editing the dialog described a site that no longer existed. Ask again, then draw. */
 fetch(API+'/publish').then(function(r){return r.json();}).then(function(s){
  if(s){PUB.pending=!!s.pending;PUB.publishedAt=s.publishedAt;PUB.canDeploy=s.canDeploy!==false;
   PUB.changes=s.changes||[];PUB.firstPublish=!!s.firstPublish;pubRender();}
 }).catch(function(){}).then(function(){drawPubModal();});
}
function drawPubModal(){
 var warn=PUB.canDeploy?'':'<p class="pubm-warn">'+esc(T('The automatic rebuild is not set up, so publishing will save your changes but will not update the public website yet.'))+'</p>';
 var host=document.createElement('div');host.id='pubmHost';
 host.innerHTML='<div class="overlay show" id="pubmOv"></div>'+
  '<div class="pubm" role="dialog" aria-modal="true">'+
   '<div class="pubm-head"><h2>'+esc(T('Publish to the live website'))+'</h2><button class="x" id="pubmX" aria-label="'+esc(T('Close'))+'">✕</button></div>'+
   '<div class="pubm-body" id="pubmBody">'+
    warn+
    '<p class="pubm-intro">'+esc(T('These changes will go live on your public website:'))+'</p>'+
    changeRows()+
    '<div class="pubm-next"><h3>'+esc(T('What happens when you publish'))+'</h3><ol>'+
     '<li>'+esc(T('Your changes are saved to the site straight away.'))+'</li>'+
     '<li>'+esc(T('The website rebuilds itself automatically, with no developer needed.'))+'</li>'+
     '<li>'+esc(T('The new version appears online, usually within 1 to 2 minutes.'))+'</li>'+
    '</ol><p class="pubm-hint">'+esc(T('You can keep working while it rebuilds. Nothing else on the site is affected.'))+'</p></div>'+
   '</div>'+
   '<div class="pubm-foot"><button class="btn btn-ghost" id="pubmCancel">'+esc(T('Cancel'))+'</button>'+
    '<button class="btn btn-ok" id="pubmGo">'+svg('publish')+esc(T('Publish now'))+'</button></div>'+
  '</div>';
 document.body.appendChild(host);
 function close(){host.remove();}
 host.querySelector('#pubmX').addEventListener('click',close);
 host.querySelector('#pubmCancel').addEventListener('click',close);
 host.querySelector('#pubmOv').addEventListener('click',close);
 host.querySelector('#pubmGo').addEventListener('click',function(){runPublish(host);});
}
function runPublish(host){
 var body=host.querySelector('#pubmBody'),foot=host.querySelector('.pubm-foot');
 var go=host.querySelector('#pubmGo'),cancel=host.querySelector('#pubmCancel');
 go.disabled=true;go.innerHTML=svg('publish')+esc(T('Publishing...'));cancel.disabled=true;
 PUB.busy=true;pubRender();
 fetch(API+'/publish',{method:'POST'}).then(function(r){if(!r.ok)throw 0;return r.json();}).then(function(o){
  PUB.busy=false;PUB.pending=false;PUB.publishedAt=Date.now();PUB.changes=[];PUB.firstPublish=false;pubRender();
  var deployed=!(o&&o.deployed===false);
  var why=(o&&o.deployError)?' ('+o.deployError+')':'';
  /* A snapshot with no rebuild behind it looks identical from in here, so say so plainly
     rather than let the client believe the website changed. */
  body.innerHTML='<div class="pubm-done"><div class="pubm-check'+(deployed?'':' warnc')+'">'+svg(deployed?'publish':'edit')+'</div>'+
   '<h3>'+esc(T(deployed?'Published':'Saved, not yet building'))+'</h3>'+
   (deployed
    ? '<p>'+esc(T('Your changes are saved and the website is rebuilding now.'))+'</p>'+
      '<ul class="pubm-steps"><li><b>'+esc(T('Now'))+'</b><span>'+esc(T('changes saved'))+'</span></li>'+
      '<li><b>'+esc(T('~1 to 2 min'))+'</b><span>'+esc(T('the new version goes live at your web address'))+'</span></li></ul>'+
      '<p class="pubm-hint">'+esc(T('You can close this and keep editing. Open your website in a minute or two, and refresh the page, to see the update.'))+'</p>'
    : '<p>'+esc(T('Your changes were saved, but the website was not asked to rebuild{why}, so the public site will not change yet. Please let your developer know.',{why:why}))+'</p>')+
   '</div>';
  foot.innerHTML='<button class="btn btn-ok" id="pubmDone">'+esc(T('Done'))+'</button>';
  host.querySelector('#pubmDone').addEventListener('click',function(){host.remove();});
  toast(T(deployed?'Published. The site rebuilds in a minute or two.':'Saved, but the rebuild was not triggered.'),deployed?'ok':'err');
 }).catch(function(){
  PUB.busy=false;pubRender();
  go.disabled=false;go.innerHTML=svg('publish')+esc(T('Publish now'));cancel.disabled=false;
  if(!body.querySelector('.pubm-err')){var e=document.createElement('p');e.className='pubm-err';e.textContent=T('Publish failed. Nothing was changed on the live site. Please check your connection and try again.');body.appendChild(e);}
  toast(T('Publish failed. Nothing was changed on the live site.'),'err');
 });
}
/* The menu button is rendered on every screen and hidden by CSS above 900px. Below that the
   sidebar is off-canvas, and it holds the section list, Publish and Sign out, so without this
   button the dashboard was a dead end on a phone: you could sign in and go nowhere. */
function topbar(title,crumb,actions){
 return '<div class="topbar">'+
  '<button class="navtog" id="navtog" aria-label="'+esc(T('Menu'))+'" aria-expanded="false">'+
   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'+
  '</button>'+
  '<div class="topbar-head"><div class="crumb">'+esc(T(crumb||'Printopack System'))+'</div><h1>'+esc(T(title))+'</h1></div>'+
  '<div class="topbar-actions">'+(actions||'')+'</div></div>';
}
/* Opens and closes the off-canvas sidebar. navigate() already closes it after a section is
   chosen, so choosing a section behaves the way a phone menu is expected to. */
function setNav(open){
 var app=root.querySelector('.app');if(!app)return;
 app.classList.toggle('nav-open',!!open);
 var t=document.getElementById('navtog');if(t)t.setAttribute('aria-expanded',open?'true':'false');
 var scrim=document.getElementById('navscrim');
 if(open&&!scrim){
  scrim=document.createElement('div');scrim.id='navscrim';scrim.className='navscrim';
  scrim.addEventListener('click',function(){setNav(false);});
  document.body.appendChild(scrim);
 }else if(!open&&scrim){scrim.remove();}
}
function bindNavToggle(){
 var t=document.getElementById('navtog');
 if(t)t.addEventListener('click',function(){
  var app=root.querySelector('.app');
  setNav(!(app&&app.classList.contains('nav-open')));
 });
}
/* Full mount: build the shell once. The sidebar is deliberately NOT rebuilt on every click
   (that was what made navigation feel laggy and reload the logo); only the main panel is
   swapped by navigate(). The sidebar nav is bound here; each view binds its own controls. */
function render(){
 ensure();
 if(!loggedIn()){renderLogin();return;}
 root.innerHTML='<div class="app">'+sidebar()+'<main class="main" id="main"></main></div>';
 root.querySelectorAll('.sidebar [data-nav]').forEach(function(el){el.addEventListener('click',function(){navigate(el.getAttribute('data-nav'));});});
 bindLang(root);
 var lo=root.querySelector('[data-logout]');if(lo)lo.addEventListener('click',function(){localStorage.removeItem(SKEY);if(MODE==='api'){fetch(API+'/logout',{method:'POST'}).catch(function(){}).finally(function(){renderLogin();});}else render();});
 renderView();
 pubRender();
}
/* Switch section without touching the shell: repaint only the main panel, then update the
   sidebar's active item and counts in place. Instant, and the active state transitions
   smoothly instead of the whole page being torn down and rebuilt. */
function navigate(v){
 if(!root.querySelector('.sidebar')){view=v;render();return;}
 view=v;
 renderView();
 syncSidebar();
 setNav(false);
 // The window is the scroll container for long sections (.main has no overflow of its own),
 // so bring the window to the top on a section change. Without this, navigating from a long
 // section to a shorter one leaves the page scrolled past the new content and the browser
 // clamps it, which reads as the sticky sidebar "teleporting" to the top. The sidebar's own
 // nav scroll is untouched, so the item just clicked stays where it was.
 window.scrollTo(0,0);
 var m=$('#main');if(m)m.scrollTop=0;
}
/* After a save or delete: repaint the current view and refresh the sidebar counts, again
   without rebuilding the shell. */
function refresh(){renderView();syncSidebar();}
/* Keep the sidebar's active highlight and per-section counts current in place. */
function syncSidebar(){
 root.querySelectorAll('.sidebar [data-nav]').forEach(function(el){
  var k=el.getAttribute('data-nav');
  el.classList.toggle('on',k===view);
  var b=el.querySelector('.badge');
  if(b&&MODELS[k])b.textContent=coll(k).length;
  if(k==='enquiries'){
   /* The unread count appears and disappears, so the badge itself has to be added and
      removed rather than only having its number changed. */
   if(ENQ.counts.unread){
    if(!b){b=document.createElement('span');b.className='badge alert';el.appendChild(b);}
    b.className='badge alert';b.textContent=ENQ.counts.unread;
   }else if(b)b.remove();
  }
 });
}
function renderView(){var m=$('#main');paintView(m);bindNavToggle();}
function paintView(m){if(view==='dashboard')return dashView(m);if(view==='enquiries')return enquiriesView(m);if(view==='about')return aboutView(m);if(view==='countries')return countriesView(m);if(view==='settings')return settingsView(m);if(view==='security')return securityView(m);if(MODELS[view])return listView(m,view);}
/* Rotate the single marketing password from inside the dashboard (API mode only). The new
   password takes effect immediately and is stored hashed in the database, so it is never
   frozen the way a hardcoded credential would be. */
function securityView(m){
 m.innerHTML=topbar('Password','Site','')+'<div class="view">'+
  '<div class="panel"><div class="panel-head"><div><h2>'+esc(T('Change admin password'))+'</h2><p>'+esc(T('This is the single sign-in for the marketing team. Change it here whenever you need to (for example when a staff member leaves). The new password works right away and is stored securely, never in plain text.'))+'</p></div></div>'+
  '<div class="panel-body"><div class="form-grid">'+
   '<div class="field"><label>'+esc(T('Current password'))+'</label><input type="password" id="pc" autocomplete="current-password"></div>'+
   '<div class="field"></div>'+
   '<div class="field"><label>'+esc(T('New password'))+'</label><input type="password" id="pn" autocomplete="new-password"></div>'+
   '<div class="field"><label>'+esc(T('Confirm new password'))+'</label><input type="password" id="pn2" autocomplete="new-password"></div>'+
   '<p id="perr" hidden style="color:#b00020;font-size:13px;grid-column:1/-1;margin:0"></p>'+
   '<div style="grid-column:1/-1"><button class="btn btn-ok" id="pbtn">'+esc(T('Update password'))+'</button></div>'+
  '</div></div></div></div>';
 var err=$('#perr'),btn=$('#pbtn');
 btn.addEventListener('click',function(){
  var c=$('#pc').value,n=$('#pn').value,n2=$('#pn2').value;err.hidden=true;
  if(n.length<10){err.textContent=T('New password must be at least 10 characters.');err.hidden=false;return;}
  if(n!==n2){err.textContent=T('The two new passwords do not match.');err.hidden=false;return;}
  btn.disabled=true;btn.textContent=T('Updating...');
  fetch(API+'/password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({current:c,next:n})}).then(function(r){return r.json().catch(function(){return {};}).then(function(o){return {ok:r.ok,o:o};});}).then(function(x){
   btn.disabled=false;btn.textContent=T('Update password');
   if(x.ok){$('#pc').value='';$('#pn').value='';$('#pn2').value='';toast(T('Password updated'),'ok');}
   else{err.textContent=(x.o&&x.o.error)||T('Could not update the password.');err.hidden=false;}
  }).catch(function(){btn.disabled=false;btn.textContent=T('Update password');err.textContent=T('Network error. Please try again.');err.hidden=false;});
 });
}

/* Picture storage, shown on the dashboard when the Cloudflare backend is live. Local demo
   mode has nothing to measure, so the panel simply stays hidden. */
function storageMeter(){
 if(MODE!=='api')return;
 fetch(API+'/storage').then(function(r){return r.json();}).then(function(s){
  var panel=$('#storage');if(!panel||!s||s.limit==null)return;
  var mb=function(b){return b<1048576?(Math.round(b/1024)+' KB'):((b/1048576).toFixed(b>10485760?0:1)+' MB');};
  var pct=Math.min(100,s.bytes/s.limit*100);
  panel.hidden=false;
  $('#mfill').style.width=Math.max(pct,0.5)+'%';
  $('#mtext').textContent=T('{n} pictures, {used} of {limit} used ({pct}%).',{
   n:s.count,used:mb(s.bytes),limit:mb(s.limit),pct:(pct<0.1?T('under 0.1'):pct.toFixed(1))});
 }).catch(function(){});
}

/* ---------------- enquiries ----------------
   Every message and job application sent from the website, in one place, with the CV
   attached to the one it came with. This is the half of the dashboard that receives rather
   than publishes: nothing here goes near the Publish button, and reading one changes
   nothing on the public site.

   The same rows are the mailing list's source. An address that arrives here is already a
   contact in the mailing tool, in this same database, with the date and the reason it is
   there recorded beside it. */
var ENQ={items:[],counts:{},filter:'open',loading:false};
function enqLoad(cb){
 ENQ.loading=true;
 fetch(API+'/enquiries?status='+encodeURIComponent(ENQ.filter)).then(function(r){
  if(r.status===401){openReauth();throw 0;}
  if(!r.ok)throw 0;return r.json();
 }).then(function(d){
  ENQ.items=(d&&d.items)||[];ENQ.counts=(d&&d.counts)||{};ENQ.loading=false;cb&&cb();
 }).catch(function(){ENQ.loading=false;cb&&cb(T('Could not load the enquiries. Please check your connection.'));});
}
function enqKindLabel(k){return T(k==='application'?'Job application':(k==='newsletter'?'Newsletter':'Enquiry'));}
function enquiriesView(m){
 if(MODE!=='api'){
  m.innerHTML=topbar('Enquiries','Inbox','')+'<div class="view"><div class="panel"><div class="empty">'+svg('inbox')+
   '<h3>'+esc(T('Available on the live site'))+'</h3><p>'+esc(T('Enquiries are sent to the website itself, so they appear here once this dashboard is running on the live address.'))+'</p></div></div></div>';
  bindNavToggle();return;
 }
 var seg='<div class="seg" id="enqseg">'+
   ['open','archived','all'].map(function(f){
    return '<button'+(ENQ.filter===f?' class="on"':'')+' data-f="'+f+'">'+esc(T(f==='open'?'Open':(f==='archived'?'Archived':'Everything')))+'</button>';
   }).join('')+'</div>';
 m.innerHTML=topbar('Enquiries','Inbox','<button class="btn btn-ghost" id="enqRefresh">'+esc(T('Refresh'))+'</button>')+
  '<div class="view"><div class="toolbar"><div class="search">'+svg('search')+'<input id="eq" placeholder="'+esc(T('Search by name, company or address…'))+'"></div>'+seg+'</div>'+
  '<div id="enqhost"><div class="panel"><div class="empty"><h3>'+esc(T('Loading…'))+'</h3></div></div></div></div>';
 bindNavToggle();
 var host=$('#enqhost');
 function paint(f){
  var list=ENQ.items.filter(function(r){
   if(!f)return true;
   return JSON.stringify([r.name,r.email,r.company,r.subject,r.position,r.message]).toLowerCase().indexOf(f.toLowerCase())>-1;
  });
  if(!list.length){
   host.innerHTML='<div class="panel"><div class="empty">'+svg('inbox')+'<h3>'+esc(T(f?'Nothing matches that search':'No enquiries here yet'))+'</h3>'+
    '<p>'+esc(T(f?'Try a different name or address.':'Messages sent from the contact page, job applications and newsletter sign-ups all arrive here.'))+'</p></div></div>';
   return;
  }
  host.innerHTML='<div class="panel"><table class="tbl"><thead><tr><th>'+esc(T('From'))+'</th><th>'+esc(T('About'))+'</th><th>'+esc(T('Sent'))+'</th><th></th></tr></thead><tbody>'+
   list.map(function(r){
    var unread=r.status==='new';
    var att=r.files?'<span class="pill tag">'+esc(T('{n} files',{n:r.files}))+'</span>':'';
    var notify=r.notified?'':'<span class="pill draft" title="'+esc(r.notify_error||T('The office has not been emailed yet'))+'">'+esc(T('not emailed yet'))+'</span>';
    return '<tr class="row'+(unread?' unread':'')+'" data-enq="'+esc(r.id)+'">'+
     '<td><div class="t-title" dir="auto">'+esc(r.name||r.email)+'</div><div class="t-sub" dir="ltr">'+esc(r.email)+(r.company?' · '+esc(r.company):'')+'</div></td>'+
     '<td><div class="t-title" dir="auto">'+esc(r.subject||r.position||enqKindLabel(r.kind))+'</div><div class="t-sub">'+esc(enqKindLabel(r.kind))+(r.reason?' · '+esc(r.reason):'')+' '+att+' '+notify+'</div></td>'+
     '<td>'+esc(fmtDate(new Date(r.created_at).toISOString().slice(0,10)))+'</td>'+
     '<td><div class="cell-actions"><button class="icon-btn" data-enq-open="'+esc(r.id)+'" title="'+esc(T('Open'))+'">'+svg('edit')+'</button></div></td>'+
    '</tr>';
   }).join('')+'</tbody></table></div>';
  host.querySelectorAll('[data-enq]').forEach(function(el){
   el.addEventListener('click',function(){openEnquiry(el.getAttribute('data-enq'));});
  });
 }
 enqLoad(function(err){
  if(err){host.innerHTML='<div class="panel"><div class="empty"><h3>'+esc(err)+'</h3></div></div>';return;}
  paint($('#eq').value);syncSidebar();
 });
 $('#eq').addEventListener('input',function(){paint(this.value);});
 $('#enqRefresh').addEventListener('click',function(){enqLoad(function(){paint($('#eq').value);});});
 $('#enqseg').querySelectorAll('button').forEach(function(b){
  b.addEventListener('click',function(){
   ENQ.filter=b.getAttribute('data-f');
   $('#enqseg').querySelectorAll('button').forEach(function(x){x.classList.remove('on');});
   b.classList.add('on');
   enqLoad(function(){paint($('#eq').value);});
  });
 });
}
/* One enquiry, in full, with its attachments and a reply button that opens the mail client
   with the address and subject already filled in. */
function openEnquiry(id){
 var r=ENQ.items.filter(function(x){return x.id===id;})[0];
 if(!r)return;
 var host=document.createElement('div');
 var when=new Date(r.created_at);
 var rows=[
  [T('From'),esc(r.name||'')+' &lt;<span dir="ltr">'+esc(r.email)+'</span>&gt;'],
  [T('Company'),esc(r.company||'')],
  [T('Telephone'),r.phone?'<span dir="ltr">'+esc(r.phone)+'</span>':''],
  [T('About'),esc(r.subject||r.position||enqKindLabel(r.kind))],
  [T('Type'),esc(enqKindLabel(r.kind))+(r.reason?' · '+esc(r.reason):'')],
  [T('Routed to'),r.route_email?'<span dir="ltr">'+esc(r.route_email)+'</span>':'<span class="muted">'+esc(T('not routed'))+'</span>'],
  [T('Received'),esc(when.toLocaleString(LANG==='ar'?'ar':'en-GB'))],
  [T('Language'),T(r.lang==='ar'?'Arabic':'English')]
 ].filter(function(x){return x[1];}).map(function(x){
  return '<div class="enq-row"><span class="enq-k">'+esc(x[0])+'</span><span class="enq-v">'+x[1]+'</span></div>';
 }).join('');
 var subject=encodeURIComponent('Re: '+(r.subject||r.position||'Your enquiry to Printopack'));
 host.innerHTML='<div class="overlay" id="ov"></div><div class="drawer" id="dw">'+
  '<div class="drawer-head"><h2>'+esc(enqKindLabel(r.kind))+'</h2><button class="x" id="xc">\u2715</button></div>'+
  '<div class="drawer-body">'+
   '<div class="enq-meta">'+rows+'</div>'+
   (r.message?'<div class="enq-msg"'+(r.lang==='ar'?' dir="rtl"':'')+'>'+esc(r.message).replace(/\n/g,'<br>')+'</div>':'')+
   '<div id="enqfiles"></div>'+
   (r.notified?'':'<p class="enq-note">'+esc(r.notify_error||T('The office has not been emailed about this yet. The mailing tool sends these; the enquiry itself is safely stored here either way.'))+'</p>')+
  '</div>'+
  '<div class="drawer-foot">'+
   '<button class="btn btn-ghost" id="enqDel">'+esc(T('Delete'))+'</button>'+
   '<button class="btn btn-ghost" id="enqArch">'+esc(T(r.status==='archived'?'Move back to open':'Archive'))+'</button>'+
   '<a class="btn btn-ok" href="mailto:'+esc(r.email)+'?subject='+subject+'">'+svg('mail')+esc(T('Reply by email'))+'</a>'+
  '</div></div>';
 document.body.appendChild(host);
 requestAnimationFrame(function(){$('#ov',host).classList.add('show');$('#dw',host).classList.add('show');});
 function close(){$('#ov',host).classList.remove('show');$('#dw',host).classList.remove('show');setTimeout(function(){host.remove();},350);}
 $('#xc',host).addEventListener('click',close);$('#ov',host).addEventListener('click',close);

 if(r.files){
  fetch(API+'/enquiry-file?e='+encodeURIComponent(r.id)).then(function(x){return x.json();}).then(function(fs){
   if(!fs||!fs.length)return;
   $('#enqfiles',host).innerHTML='<div class="enq-files"><h3>'+esc(T('Attachments'))+'</h3>'+fs.map(function(f){
    return '<a class="enq-file" href="'+API+'/enquiry-file?f='+encodeURIComponent(f.id)+'&dl=1">'+svg('attach')+
     '<span>'+esc(f.filename)+'</span><em>'+Math.max(1,Math.round(f.size/1024))+' KB</em></a>';
   }).join('')+'</div>';
  }).catch(function(){});
 }
 /* Opening it is reading it. */
 if(r.status==='new'){
  r.status='read';
  fetch(API+'/enquiries/'+encodeURIComponent(r.id),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'read'})}).catch(function(){});
 }
 $('#enqArch',host).addEventListener('click',function(){
  var next=r.status==='archived'?'read':'archived';
  fetch(API+'/enquiries/'+encodeURIComponent(r.id),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:next})})
   .then(function(){toast(T(next==='archived'?'Archived':'Moved back to open'),'ok');close();enqLoad(function(){renderView();});})
   .catch(function(){toast(T('Could not update that enquiry'),'err');});
 });
 $('#enqDel',host).addEventListener('click',function(){
  if(!confirm(T('Delete this enquiry and anything attached to it? This cannot be undone.')))return;
  fetch(API+'/enquiries/'+encodeURIComponent(r.id),{method:'DELETE'})
   .then(function(){toast(T('Enquiry deleted'),'ok');close();enqLoad(function(){renderView();});})
   .catch(function(){toast(T('Could not delete that enquiry'),'err');});
 });
}

/* ---------------- dashboard ---------------- */
function dashView(m){
 var cards=[{k:'news',l:'News posts',icon:'news'},{k:'products',l:'Products',icon:'products'},{k:'team',l:'Team members',icon:'team'},{k:'partners',l:'Partners',icon:'partners'}].map(function(c){
  return '<div class="stat-card" data-nav="'+c.k+'"><div class="ic">'+svg(c.icon)+'</div><div class="n">'+coll(c.k).length+'</div><div class="l">'+esc(T(c.l))+'</div></div>';
 }).join('');
 /* The inbox card leads, and turns gold when something is waiting: it is the only number on
    this screen that somebody outside the company is waiting on. */
 if(MODE==='api'){
  var un=ENQ.counts.unread||0;
  cards='<div class="stat-card'+(un?' alert':'')+'" data-nav="enquiries"><div class="ic">'+svg('inbox')+'</div><div class="n">'+un+'</div><div class="l">'+
   esc(T(un?'Unanswered enquiries':'Enquiries, all read'))+'</div></div>'+cards;
 }
 var recent=coll('news').slice(0,4).map(function(p){return '<tr class="row" data-open="news:'+p.id+'"><td><span class="t-title" dir="auto">'+esc(p.title)+'</span></td><td><span class="pill tag" dir="auto">'+esc(p.category)+'</span></td><td>'+statusPill(p.status)+'</td><td>'+fmtDate(p.date)+'</td></tr>';}).join('');
 var quick=['news','careers','team','factory'].map(function(k){return '<button class="btn btn-ghost" data-open="'+k+':new">'+svg('plus')+esc(T('New {x}',{x:sing(MODELS[k])}))+'</button>';}).join('');
 m.innerHTML=topbar('Welcome back','Dashboard','<button class="btn btn-gold" data-open="news:new">'+svg('plus')+esc(T('New post'))+'</button>')+
  '<div class="view"><div class="stat-grid">'+cards+'</div>'+
  '<div class="panel"><div class="panel-head"><h2>'+esc(T('Recent news'))+'</h2><button class="btn btn-ghost btn-sm" data-nav="news">'+esc(T('View all'))+'</button></div><table class="tbl"><thead><tr><th>'+esc(T('Title'))+'</th><th>'+esc(T('Category'))+'</th><th>'+esc(T('Status'))+'</th><th>'+esc(T('Date'))+'</th></tr></thead><tbody>'+(recent||'')+'</tbody></table></div>'+
  '<div class="panel"><div class="panel-head"><div><h2>'+esc(T('Quick actions'))+'</h2><p>'+esc(T('Jump into what you update most.'))+'</p></div></div><div class="panel-body" style="display:flex;gap:10px;flex-wrap:wrap">'+quick+'<button class="btn btn-ghost" data-nav="about">'+svg('edit')+esc(T('Edit home & about'))+'</button></div></div>'+
  '<div class="panel" id="storage" hidden><div class="panel-head"><div><h2>'+esc(T('Picture storage'))+'</h2><p>'+esc(T('Every picture on the site, and how much of the free allowance is left.'))+'</p></div></div><div class="panel-body"><div class="meter"><span id="mfill"></span></div><p id="mtext" class="meter-text"></p></div></div></div>';
 bind(m);
 storageMeter();
}

/* ---------------- list ---------------- */
function statusPill(s){return s==='published'?'<span class="pill pub">'+esc(T('Published'))+'</span>':'<span class="pill draft">'+esc(T('Draft'))+'</span>';}
function cellFor(col,row){
 var v=row[col.field];
 if(col.type==='thumb'){var cls='thumb'+(col.round?' round':'')+(col.contain?' contain':'');return v?'<img class="'+cls+'" src="'+esc(imgSrc(v))+'">':'<div class="'+cls+'" style="display:grid;place-items:center;color:var(--faint);font-family:var(--disp);font-size:15px">'+esc(initials(row))+'</div>';}
 if(col.type==='title'){var t=v||row[col.fallback]||T('Untitled');var sub=col.sub&&row[col.sub]?'<div class="t-sub" dir="auto">'+esc(row[col.sub])+'</div>':'';return '<div class="t-title" dir="auto">'+esc(t)+'</div>'+sub;}
 if(col.type==='pill')return statusPill(v);
 if(col.type==='active')return v?'<span class="pill pub">'+esc(T('Visible'))+'</span>':'<span class="pill off">'+esc(T('Hidden'))+'</span>';
 if(col.type==='tag')return v?'<span class="pill tag" dir="auto">'+esc(v)+'</span>':'';
 if(col.type==='date')return fmtDate(v);
 if(col.type==='text')return v==null||v===''?'<span class="muted">—</span>':'<span dir="auto">'+esc((col.prefix||'')+v+(col.suffix||''))+'</span>';
 return esc(v);
}
function initials(r){var s=(r.name||r.title||r.city||'?').trim().split(/\s+/);return ((s[0]||'')[0]||'')+((s[1]||'')[0]||'');}
function listView(m,key){
 var mdl=MODELS[key],rows=coll(key);
 var heads=mdl.columns.map(function(c){return '<th>'+(c.type==='thumb'?'':esc(T(c.field.charAt(0).toUpperCase()+c.field.slice(1))))+'</th>';}).join('')+'<th></th>';
 var actions='<button class="btn btn-gold" data-open="'+key+':new">'+svg('plus')+esc(T('New {x}',{x:sing(mdl)}))+'</button>';
 var toggle=mdl.hasCalendar?'<div class="seg" id="tg"><button class="on" data-mode="list">'+esc(T('List'))+'</button><button data-mode="cal">'+esc(T('Calendar'))+'</button></div>':'';
 /* Partners: say how many of the home page's main slots are filled, so the client is never
    guessing why a logo did or did not appear there. */
 var tally='';
 var left=capLeft(key);
 if(left!=null&&left<=Math.max(5,Math.round(capOf(key)*0.1))){
  tally+='<div class="tally'+(left===0?'':'')+'">'+esc(left===0
   ? T('{label} is full at {cap} {x}. Delete one before adding another.',{label:T(mdl.label),cap:capOf(key),x:sing(mdl)})
   : T('Room for {n} more before this section is full.',{n:LANG==='ar'?left:left+' '+sing(mdl)+(left===1?'':'s')}))+'</div>';
 }
 if(key==='partners'){
  var main=rows.filter(function(x){return String(x.featured)==='true';}).length;
  tally+='<div class="tally'+(main===MAIN_PARTNERS?' ok':'')+'">'+esc(T('{n} of {cap} main partners selected',{n:main,cap:MAIN_PARTNERS})+(main===MAIN_PARTNERS?'':T(', the home page needs exactly {cap}',{cap:MAIN_PARTNERS})))+'</div>';
 }
 m.innerHTML=topbar(mdl.label,T(mdl.group||'Content')+' · '+T(mdl.label),actions)+'<div class="view">'+tally+'<div class="toolbar"><div class="search">'+svg('search')+'<input id="q" placeholder="'+esc(T('Search {x}…',{x:LANG==='ar'?T(mdl.label):mdl.label.toLowerCase()}))+'"></div>'+toggle+'</div><div id="host"></div></div>';
 bind(m); // wire the topbar "New" button (rows are bound separately in paint(); #host is empty here so no double-binding)
 function paint(f){
  var list=rows.filter(function(r){return !f||JSON.stringify(r).toLowerCase().indexOf(f.toLowerCase())>-1;});
  if(!list.length){$('#host').innerHTML='<div class="panel"><div class="empty">'+svg(mdl.icon)+'<h3>'+esc(T('Nothing here yet'))+'</h3><p>'+esc(T('Create your first {x} with the button above.',{x:sing(mdl)}))+'</p></div></div>';return;}
  /* Reordering is hidden while a search is active: the arrows move a record past its
     neighbour in the real list, which is not what someone looking at a filtered subset
     would expect to happen. */
  var canOrder=!f&&list.length>1;
  var body=list.map(function(r,i){
   var tds=mdl.columns.map(function(c){return '<td>'+cellFor(c,r)+'</td>';}).join('');
   var mv=canOrder?'<button class="icon-btn mv" data-mv="'+key+':'+r.id+':-1"'+(i===0?' disabled':'')+' title="'+esc(T('Move up'))+'" aria-label="'+esc(T('Move up'))+'">'+svg('up')+'</button>'+
                   '<button class="icon-btn mv" data-mv="'+key+':'+r.id+':1"'+(i===list.length-1?' disabled':'')+' title="'+esc(T('Move down'))+'" aria-label="'+esc(T('Move down'))+'">'+svg('down')+'</button>':'';
   return '<tr class="row" data-open="'+key+':'+r.id+'">'+tds+'<td><div class="cell-actions">'+mv+'<button class="icon-btn" data-open="'+key+':'+r.id+'">'+svg('edit')+'</button><button class="icon-btn del" data-del="'+key+':'+r.id+'">'+svg('trash')+'</button></div></td></tr>';
  }).join('');
  var hint=canOrder?'<p class="order-hint">'+esc(T('The order here is the order on the website.'))+'</p>':'';
  $('#host').innerHTML='<div class="panel"><table class="tbl"><thead><tr>'+heads+'</tr></thead><tbody>'+body+'</tbody></table></div>'+hint;bind($('#host'));
  $('#host').querySelectorAll('[data-mv]').forEach(function(el){el.addEventListener('click',function(e){
   e.stopPropagation();
   var p=el.getAttribute('data-mv').split(':');
   if(moveRecord(p[0],p[1],+p[2]))paint(f);
  });});
 }
 paint('');$('#q').addEventListener('input',function(){paint(this.value);});
 if(mdl.hasCalendar){var seg=$('#tg');seg.querySelectorAll('button').forEach(function(b){b.addEventListener('click',function(){seg.querySelectorAll('button').forEach(function(x){x.classList.remove('on');});b.classList.add('on');if(b.dataset.mode==='cal')renderCal($('#host'));else paint($('#q').value);});});}
}

/* ---------------- form drawer ---------------- */
var draft={};
// A required field's name for the "please fill…" message: the label without the language/optional tag.
function reqName(f){return String(f.label).replace(/\s*\((English|optional)\)/gi,'').trim();}
function fieldHTML(f,val){
 var req=f.req?'<span class="req" title="'+esc(T('Required'))+'">*</span>':'';
 var lab='<label>'+esc(T(f.label))+req+(f.ar?' <span class="ar">· '+esc(T(f.ar))+'</span>':'')+'</label>';
 /* A field's direction follows the language of its CONTENT, never the language of the
    interface. Every Arabic field in the schema is marked rtl:true, so everything else is an
    English, numeric or address value and is pinned to ltr: without this, an English title
    typed while the dashboard is in Arabic would render right-aligned with its punctuation
    thrown to the wrong end. */
 var rtl=f.rtl?' dir="rtl"':' dir="ltr"';
 var hint=f.rec?'<div class="hint">'+esc(T(f.rec))+'</div>':'';
 if(f.type==='image'){
  var has=val?' has':'';
  // The chosen fit for THIS image: an explicit per-image choice wins, otherwise the field's
  // default (logos/product cut-outs default to "show whole", photographs to "fill").
  var fit=draft[f.name+'Fit']||(f.contain?'contain':'cover');
  var cn=(fit==='contain')?' contain':'';
  var rec=f.rec?'<span class="imgrec">'+svg('image')+T('Recommended: {x} for a flawless fit',{x:'<b>'+esc(T(f.rec))+'</b>'})+'</span>':'';
  // The preview box mirrors the real frame on the site (its aspect ratio), so what she sees
  // here is exactly what visitors get. Fields without a defined frame keep the neutral box.
  var frameStyle=f.frame?' style="aspect-ratio:'+f.frame+'"':'';
  // Two-button chooser, shown only for framed fields. "Fill" crops to fill the frame; "Show
  // whole" letterboxes on the frame's own colour so nothing (a logo, a QR code) is cut.
  var toggle=f.frame?'<div class="fitrow" data-fitrow="'+f.name+'">'
    +'<button type="button" class="fitbtn'+(fit==='cover'?' on':'')+'" data-fit="cover">'+svg('cover')+esc(T('Fill frame'))+'</button>'
    +'<button type="button" class="fitbtn'+(fit==='contain'?' on':'')+'" data-fit="contain">'+svg('contain')+esc(T('Show whole image'))+'</button>'
    +'</div>':'';
  // Focus point: when "Fill frame" crops the picture, this picks which part is kept, so a logo
  // or headline at an edge is not the bit that gets sliced off. Only meaningful while filling,
  // so it is hidden the moment she switches to "Show whole image". Absent = centre (the default).
  var focus=draft[f.name+'Focus']||'';
  var POS=[['left top','Top left'],['center top','Top'],['right top','Top right'],['left center','Left'],['center','Centre'],['right center','Right'],['left bottom','Bottom left'],['center bottom','Bottom'],['right bottom','Bottom right']];
  var fsel=focus||'center';
  var focusEl=f.frame?'<div class="focusrow" data-focusrow="'+f.name+'"'+(fit==='cover'?'':' hidden')+'>'
    +'<span class="focuslabel">'+esc(T('Keep this part in view'))+'</span>'
    +'<div class="focusgrid">'+POS.map(function(p){return '<button type="button" class="focusdot'+(fsel===p[0]?' on':'')+'" data-focus="'+p[0]+'" title="'+esc(T(p[1]))+'" aria-label="'+esc(T(p[1]))+'"></button>';}).join('')+'</div>'
    +'</div>':'';
  var posStyle=focus?' style="object-position:'+focus+'"':'';
  return '<div class="field full"><label>'+esc(T(f.label))+req+'</label>'+rec
    +'<div class="imgpick'+has+cn+'" data-imgpick="'+f.name+'"'+frameStyle+' data-box="'+recBox(f.rec)+'"><img src="'+esc(imgSrc(val))+'"'+posStyle+'><div class="ph">'+svg('image')+esc(T('Click to upload'))+'</div></div>'
    +toggle
    +focusEl
    +'<input type="file" accept="image/*" data-imgfile="'+f.name+'" hidden></div>';
 }
 if(f.type==='textarea')return '<div class="field full">'+lab+'<textarea data-f="'+f.name+'"'+rtl+'>'+esc(val||'')+'</textarea>'+hint+'</div>';
 if(f.type==='select'){
  var src=f.optionsFrom?coll(f.optionsFrom).map(function(g){return g.name;}).filter(Boolean):f.options;
  var list=f.optionsFrom?[''].concat(src):src;
  /* An option is either a plain string (value and label are the same) or {v,l}, which is how
     a code-valued select shows a human label. */
  var opts=list.map(function(o){
   var v=(o&&typeof o==='object')?o.v:o, l=(o&&typeof o==='object')?o.l:o;
   return '<option value="'+esc(v)+'"'+(String(val==null?'':val)===String(v)?' selected':'')+'>'+esc(l)+'</option>';
  }).join('');
  return '<div class="field'+(f.half?'':' full')+'">'+lab+'<select data-f="'+f.name+'">'+opts+'</select>'+hint+'</div>';}
 var t=f.type==='date'?'date':(f.type==='number'?'number':(f.type==='url'?'url':'text'));
 return '<div class="field'+(f.half?'':' full')+'">'+lab+'<input type="'+t+'" data-f="'+f.name+'"'+rtl+' value="'+esc(val==null?'':val)+'">'+hint+'</div>';
}
function openForm(key,id){
 var mdl=MODELS[key];var rec=id==='new'?{}:coll(key).find(function(x){return x.id===id;})||{};
 draft=JSON.parse(JSON.stringify(rec));
 if(id==='new'){mdl.fields.forEach(function(f){if(f.name==='date'&&!draft.date)draft.date=today();if(f.name==='status'&&!draft.status)draft.status='draft';});}
 var imp=mdl.hasImport?'<div class="li-import"><label>'+svg('link')+' '+esc(T('Import from a LinkedIn post'))+'</label><div class="li-row"><input id="liu" placeholder="'+esc(T('Paste a LinkedIn post link…'))+'"><button class="btn btn-primary" id="lib" type="button">'+esc(T('Import'))+'</button></div><div class="li-status" id="lis"><span class="spin"></span><span id="lit"></span></div></div>':'';
 var body='<div class="form-grid">'+mdl.fields.map(function(f){return fieldHTML(f,draft[f.name]);}).join('')+'</div>';
 var host=document.createElement('div');
 host.innerHTML='<div class="overlay" id="ov"></div><div class="drawer" id="dw"><div class="drawer-head"><h2>'+esc(T(id==='new'?'New {x}':'Edit {x}',{x:T(mdl.singular)}))+'</h2><button class="x" id="xc">✕</button></div><div class="drawer-body">'+imp+body+'</div><div class="drawer-foot"><button class="btn btn-ghost" id="cx">'+esc(T('Cancel'))+'</button><button class="btn btn-ok" id="sv">'+esc(T('Save {x}',{x:sing(mdl)}))+'</button></div></div>';
 document.body.appendChild(host);
 requestAnimationFrame(function(){$('#ov',host).classList.add('show');$('#dw',host).classList.add('show');});
 var dirty=false,saving=false;
 function close(){$('#ov',host).classList.remove('show');$('#dw',host).classList.remove('show');setTimeout(function(){host.remove();},350);}
 /* Clicking the dark area beside the drawer used to throw away everything typed, instantly
    and without asking. An accidental click while writing a long Arabic description cost the
    whole description. */
 function closeGuarded(){
  if(dirty&&!confirm(T('Close without saving? Everything you have typed here will be lost.')))return;
  close();
 }
 $('#xc',host).addEventListener('click',closeGuarded);$('#cx',host).addEventListener('click',closeGuarded);$('#ov',host).addEventListener('click',closeGuarded);
 host.querySelectorAll('[data-f]').forEach(function(el){el.addEventListener('input',function(){dirty=true;draft[el.getAttribute('data-f')]=el.value;var fl=el.closest('.field');if(fl&&String(el.value).trim()!=='')fl.classList.remove('missing');});});
 host.querySelectorAll('select[data-f]').forEach(function(el){el.addEventListener('change',function(){dirty=true;});});
 host.querySelectorAll('[data-imgpick]').forEach(function(p){var name=p.getAttribute('data-imgpick');var file=host.querySelector('[data-imgfile="'+name+'"]');p.addEventListener('click',function(){file.click();});file.addEventListener('change',function(e){var f=e.target.files[0];if(!f)return;prepImage(f,+p.getAttribute('data-box')||IMG_BOX,function(out,kb){dirty=true;draft[name]=out;p.classList.add('has');$('img',p).src=out;var fl=p.closest('.field');if(fl)fl.classList.remove('missing');toast(T('Picture ready, {kb} KB',{kb:kb}),'ok');});file.value='';});});
 // Fit chooser: records the per-image choice on the draft and shows it live in the preview,
 // so the box mirrors exactly how the site will place the picture inside its fixed frame.
 host.querySelectorAll('[data-fitrow]').forEach(function(row){
  var name=row.getAttribute('data-fitrow');
  var pick=host.querySelector('[data-imgpick="'+name+'"]');
  row.querySelectorAll('.fitbtn').forEach(function(b){
   b.addEventListener('click',function(){
    var fit=b.getAttribute('data-fit');
    draft[name+'Fit']=fit;dirty=true;
    row.querySelectorAll('.fitbtn').forEach(function(x){x.classList.toggle('on',x===b);});
    if(pick)pick.classList.toggle('contain',fit==='contain');
    // The focus grid only makes sense while filling; hide it when showing the whole image.
    var frow=host.querySelector('[data-focusrow="'+name+'"]');
    if(frow)frow.hidden=(fit!=='cover');
   });
  });
 });
 // Focus point: records which part of the picture to keep when it fills, and nudges the live
 // preview to the same spot so she can aim the crop before saving.
 host.querySelectorAll('[data-focusrow]').forEach(function(row){
  var name=row.getAttribute('data-focusrow');
  var pick=host.querySelector('[data-imgpick="'+name+'"]');
  var pim=pick?pick.querySelector('img'):null;
  row.querySelectorAll('.focusdot').forEach(function(b){
   b.addEventListener('click',function(){
    var pos=b.getAttribute('data-focus');
    draft[name+'Focus']=pos;dirty=true;
    row.querySelectorAll('.focusdot').forEach(function(x){x.classList.toggle('on',x===b);});
    if(pim)pim.style.objectPosition=pos;
   });
  });
 });
 if(mdl.hasImport){$('#lib',host).addEventListener('click',function(){importLI(host);});$('#liu',host).addEventListener('keydown',function(e){if(e.key==='Enter')importLI(host);});}
 $('#sv',host).addEventListener('click',function(){
  /* One press is one record. The drawer stays on screen for 350ms while it slides away, and
     a second click inside that window used to run the whole handler again, minting a second
     id and creating a duplicate. */
  if(saving)return;
  // Pull the live value of every field into the draft first, so a select left on its default
  // (never touched, so no input event fired) is captured and the required-check sees it.
  host.querySelectorAll('[data-f]').forEach(function(el){draft[el.getAttribute('data-f')]=el.value;});
  if(key==='products')draft.active=String(draft.active)!=='false';
  // NB: coerce experience to a number AFTER the required-check below, otherwise a blank field
  // becomes 0 here and slips past the "required" guard.
  var miss=mdl.fields.filter(function(f){return f.req&&String(draft[f.name]==null?'':draft[f.name]).trim()==='';});
  if(miss.length){
   host.querySelectorAll('.field.missing').forEach(function(el){el.classList.remove('missing');});
   miss.forEach(function(f){var el=host.querySelector('[data-f="'+f.name+'"]')||host.querySelector('[data-imgpick="'+f.name+'"]');var fl=el&&el.closest('.field');if(fl)fl.classList.add('missing');});
   var first=host.querySelector('.field.missing');if(first)first.scrollIntoView({block:'center'});
   toast(T('Please fill the required fields: {x}',{x:miss.map(reqName).join('، ')}),'err');
   return;
  }
  // A Video gallery item plays from its external link (the image is only the poster), so the
  // link is required for that type even though it is optional for a Photo or an Advertisement.
  if(key==='gallery'&&draft.kind==='Video'&&String(draft.url||'').trim()===''){
   host.querySelectorAll('.field.missing').forEach(function(el){el.classList.remove('missing');});
   var uf=host.querySelector('[data-f="url"]'),ufl=uf&&uf.closest('.field');
   if(ufl){ufl.classList.add('missing');ufl.scrollIntoView({block:'center'});}
   toast(T('A video needs its external link (YouTube or Vimeo).'),'err');
   return;
  }
  if(key==='team')draft.experience=parseInt(draft.experience,10)||0;
  if(id==='new'&&capLeft(key)===0){toast(T('{label} is full at {cap} {x}. Delete one before adding another.',{label:T(MODELS[key].label),cap:capOf(key),x:sing(MODELS[key])}),'err');return;}
  /* The home page shows exactly MAIN_PARTNERS main partners. Normalise the flag first: a
     new partner that was never touched must land as "false", not inherit a rendered default,
     or adding a partner would silently make it the 21st main one. Then refuse a 21st, rather
     than letting the site quietly drop someone: the client picks which 20, not the code. */
  if(key==='partners'){
   draft.featured=String(draft.featured)==='true'?'true':'false';
   if(draft.featured==='true'){
    var others=coll('partners').filter(function(x){return x.id!==draft.id&&String(x.featured)==='true';}).length;
    if(others>=MAIN_PARTNERS){toast(T('Already {cap} main partners. Turn one off first.',{cap:MAIN_PARTNERS}),'err');return;}
   }
  }
  /* Products are joined to their group by the group's English name, so renaming a group used
     to strand every product inside it: the products vanished from the site and the next time
     one was opened its Group select showed blank, which then saved the blank. The rename is
     carried through to them here instead, which is what the client means by renaming. */
  if(key==='productGroups'&&id!=='new'){
   var before=coll('productGroups').filter(function(x){return x.id===draft.id;})[0];
   var oldName=before&&before.name,newName=draft.name;
   if(oldName&&newName&&oldName!==newName){
    var moved=coll('products').filter(function(pr){return pr.category===oldName;});
    if(moved.length&&!confirm(T('Rename this group to \u201c{name}\u201d? {n} products inside it will move with it.',{name:newName,n:moved.length})))return;
    moved.forEach(function(pr){pr.category=newName;saveRecord('products',pr);});
   }
  }
  saving=true;
  var sv=$('#sv',host);if(sv){sv.disabled=true;sv.textContent=T('Saving...');}
  if(id==='new')draft.id=uid();
  saveRecord(key,draft);
  toast(T(id==='new'?'{x} created':'{x} updated',{x:T(mdl.singular)}),'ok');
  dirty=false;close();refresh();
 });
}
function importLI(host){
 var url=$('#liu',host).value.trim();if(!url){toast(T('Paste a link first'),'err');return;}if(!/^https?:\/\//.test(url))url='https://'+url;
 var st=$('#lis',host),tx=$('#lit',host);st.className='li-status show';tx.textContent=T('Fetching the post…');$('#lib',host).disabled=true;
 var ctrl=new AbortController();var to=setTimeout(function(){ctrl.abort();},28000);
 fetch('https://r.jina.ai/'+url,{headers:{'Accept':'application/json'},signal:ctrl.signal}).then(function(r){return r.json();}).then(function(res){
  var d=(res&&res.data)||{},meta=d.metadata||{};var title=meta['og:title']||d.title||'';var desc=meta['og:description']||d.description||'';if(!desc&&d.content)desc=String(d.content).replace(/\s+/g,' ').slice(0,320).trim()+'…';var img=meta['og:image']||meta['twitter:image']||'';
  if(!title&&!desc)throw 0;
  setV(host,'title',title.trim());setV(host,'body',desc.trim());if(img){draft.image=img;var p=host.querySelector('[data-imgpick="image"]');if(p){p.classList.add('has');$('img',p).src=img;}}
  st.className='li-status show done';tx.textContent=T('Imported. Review the text and Arabic, then save.');
 }).catch(function(){st.className='li-status show err';tx.textContent=T('Could not read that link (login wall or blocked). Type the details below.');}).finally(function(){$('#lib',host).disabled=false;clearTimeout(to);});
}
function setV(host,n,v){draft[n]=v;var el=host.querySelector('[data-f="'+n+'"]');if(el)el.value=v;}

/* ---------------- calendar ---------------- */
function renderCal(hostEl){
 var now=new Date(),y=now.getFullYear(),mth=now.getMonth();var start=new Date(y,mth,1).getDay(),days=new Date(y,mth+1,0).getDate();var evs=coll('news');
 var dow=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(function(d){return '<div class="cal-dow">'+esc(T(d))+'</div>';}).join('');var cells='';
 for(var i=0;i<start;i++)cells+='<div class="cal-cell out"></div>';
 for(var d=1;d<=days;d++){var ds=y+'-'+String(mth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');var t=(d===now.getDate())?' today':'';var de=evs.filter(function(e){return e.date===ds;}).map(function(e){return '<div class="cal-ev" data-open="news:'+e.id+'">'+esc(e.title)+'</div>';}).join('');cells+='<div class="cal-cell'+t+'"><div class="dn">'+d+'</div>'+de+'</div>';}
 hostEl.innerHTML='<div class="cal"><div class="cal-head"><h2>'+new Date(y,mth,1).toLocaleDateString(LANG==='ar'?'ar':'en-GB',{month:'long',year:'numeric'})+'</h2><span class="muted" style="font-size:13px">'+evs.length+' '+esc(T('entries'))+'</span></div><div class="cal-grid">'+dow+cells+'</div></div>';
 bind(hostEl);
}

/* ---------------- about & settings (single form) ---------------- */
function formPanel(title,desc,fields,data){
 return '<div class="panel"><div class="panel-head"><div><h2>'+esc(T(title))+'</h2>'+(desc?'<p>'+esc(T(desc))+'</p>':'')+'</div></div><div class="panel-body"><div class="form-grid">'+fields.map(function(f){return fieldHTML(f,data[f.name]);}).join('')+'</div></div></div>';
}
/* Countries on the map. Nasser's brief: every Arab country listed with a switch, so that if
   Printopack opens in Qatar the admin flips Qatar ON, a Qatar office section appears for the
   details, and Qatar lights up on the map by itself. Switching ON creates the office record
   (that record IS the switch, so there is no second list to keep in step); switching OFF
   deletes it, with a warning naming what will be lost. */
function countriesView(m){
 var offs=coll('offices');
 var on=function(cc){return offs.filter(function(o){return o.cc===cc;})[0];};
 var live=COUNTRIES.filter(function(c){return on(c.cc);}).length;
 var cards=COUNTRIES.map(function(c){
  var o=on(c.cc);
  var detail=o?[o.email,o.phone].filter(Boolean).join(' · '):T('Not in the network');
  return '<div class="cty'+(o?' on':'')+'">'+
   '<div class="cty-main"><div class="cty-name">'+esc(c.en)+'</div>'+
   '<div class="cty-ar" dir="rtl">'+esc(c.ar)+'</div>'+
   '<div class="cty-detail" dir="auto">'+esc(detail||T('No contact details yet'))+'</div></div>'+
   '<button class="sw'+(o?' on':'')+'" data-cty="'+c.cc+'" role="switch" aria-checked="'+(!!o)+'" aria-label="'+esc(c.en)+'"><span class="sw-k"></span></button>'+
   '</div>';
 }).join('');
 m.innerHTML=topbar('Countries on the map','Site · Countries','')+
  '<div class="view"><p class="hint-lead">'+esc(T('Switch a country on and it joins the network: a new office appears under Offices & Contact for its email, phone and manager, and the country lights up on both maps. Switch it off and that office is removed.'))+'</p>'+
  '<div class="tally'+(live?' ok':'')+'">'+esc(T('{n} of {total} countries switched on',{n:live,total:COUNTRIES.length}))+'</div>'+
  '<div class="cty-grid">'+cards+'</div></div>';
 m.querySelectorAll('[data-cty]').forEach(function(btn){
  btn.addEventListener('click',function(){
   var cc=btn.getAttribute('data-cty');
   var c=COUNTRIES.filter(function(x){return x.cc===cc;})[0];
   var existing=on(cc);
   if(existing){
    if(!confirm(T('Switch {x} off? Its office, including the email and phone, is deleted and the country is removed from the map.',{x:LANG==='ar'?c.ar:c.en})))return;
    deleteRecord('offices',existing.id);
    toast(T('{x} switched off',{x:LANG==='ar'?c.ar:c.en}),'ok');
   }else{
    var nid=uid();
    saveRecord('offices',{id:nid,group:'Regional & Export',cc:cc,city:c.en,cityAr:c.ar,
     country:c.en,countryAr:c.ar,staffName:'',staffNameAr:'',staffRole:'',staffRoleAr:'',
     phone:'',email:''});
    toast(T('{x} switched on. Fill in its details to finish.',{x:LANG==='ar'?c.ar:c.en}),'ok');
    refresh();
    openForm('offices',nid); // every field is required, so the editor opens straight away
    return;
   }
   refresh();
  });
 });
}
function aboutView(m){
 var p=obj('about');
 m.innerHTML=topbar('About & Home','Site','<button class="btn btn-ok" id="save">'+esc(T('Save changes'))+'</button>')+'<div class="view">'+
  formPanel('Home hero','The headline visitors see first.',[{name:'heroTitle',type:'text',label:'Hero headline'},{name:'heroTitleAr',type:'text',label:'Hero headline',ar:'Arabic',rtl:true},{name:'heroSub',type:'textarea',label:'Hero subtext'},{name:'heroSubAr',type:'textarea',label:'Hero subtext',ar:'Arabic',rtl:true}],p)+
  formPanel('The company story','Shown on the Company page. Leave a blank line between paragraphs and each one is laid out separately. The values themselves are edited under Our Values.',[{name:'historyTitle',type:'text',label:'History headline (English)'},{name:'historyTitleAr',type:'text',label:'History headline',ar:'Arabic',rtl:true},{name:'history',type:'textarea',label:'History (English)'},{name:'historyAr',type:'textarea',label:'History',ar:'Arabic',rtl:true},{name:'ownership',type:'text',label:'Ownership'},{name:'ownershipAr',type:'text',label:'Ownership',ar:'Arabic',rtl:true},{name:'vision',type:'text',label:'Vision headline (English)'},{name:'visionAr',type:'text',label:'Vision headline',ar:'Arabic',rtl:true},{name:'visionBody',type:'textarea',label:'Vision (English)'},{name:'visionBodyAr',type:'textarea',label:'Vision',ar:'Arabic',rtl:true},{name:'mission',type:'text',label:'Mission headline (English)'},{name:'missionAr',type:'text',label:'Mission headline',ar:'Arabic',rtl:true},{name:'missionBody',type:'textarea',label:'Mission (English)'},{name:'missionBodyAr',type:'textarea',label:'Mission',ar:'Arabic',rtl:true}],p)+
  formPanel('Counters','The stat numbers. They all appear together on the home page. Change a number here and the home page follows.',[{name:'statOffices',type:'text',label:'Offices',half:true},{name:'statCountries',type:'text',label:'Countries',half:true},{name:'statFounded',type:'text',label:'Year founded',half:true,rec:'Years in the market are counted from this year automatically.'},{name:'statEmployees',type:'text',label:'Employees',half:true},{name:'statAvgExp',type:'text',label:'Avg. experience (yrs)',half:true,rec:'A decimal is fine here, for example 14.5. Combined experience is worked out from this and the employee count.'},{name:'statCustomers',type:'text',label:'Customers',half:true}],p)+
  '</div>';
 var d={};m.querySelectorAll('[data-f]').forEach(function(el){el.addEventListener('input',function(){d[el.getAttribute('data-f')]=el.value;});});
 $('#save').addEventListener('click',function(){var cur=obj('about');Object.keys(d).forEach(function(k){cur[k]=d[k];});setObj('about',cur);toast(T('Saved'),'ok');});
}
function settingsView(m){
 var s=obj('settings');
 m.innerHTML=topbar('Settings','Site','<button class="btn btn-ok" id="save">'+esc(T('Save changes'))+'</button>')+'<div class="view">'+
  formPanel('Company details','Shown in the footer of every page and on the contact page.',[{name:'company',type:'text',label:'Company name (English)'},{name:'companyAr',type:'text',label:'Company name',ar:'Arabic',rtl:true},{name:'phone',type:'text',label:'Phone',half:true},{name:'phone2',type:'text',label:'Second phone',half:true,rec:'Optional. Shown in the footer under the main number. Leave blank to hide it.'},{name:'fax',type:'text',label:'Fax',half:true},{name:'email',type:'text',label:'Email',half:true},{name:'hours',type:'text',label:'Office hours',half:true},{name:'address',type:'textarea',label:'Address (English)'},{name:'addressAr',type:'textarea',label:'Address',ar:'Arabic',rtl:true},{name:'addressShort',type:'text',label:'Short address (English)',rec:'The compact version shown in the bar at the very top of every page.'},{name:'addressShortAr',type:'text',label:'Short address',ar:'Arabic',rtl:true}],s)+formPanel('Pictures','How large an uploaded picture may be. Every picture is shrunk and re-encoded in your browser before it is sent, so most land far under this on their own. Lower it if the storage meter on the dashboard climbs; anything that will not fit is refused rather than quietly accepted.',[{name:'maxImageKb',type:'number',label:'Largest picture (KB)',half:true,rec:'Between 40 and 600. The default is 400 KB. A phone photo normally lands around 65 KB.'}],s)+'</div>';
 var d={};m.querySelectorAll('[data-f]').forEach(function(el){el.addEventListener('input',function(){d[el.getAttribute('data-f')]=el.value;});});
 $('#save').addEventListener('click',function(){var cur=obj('settings');Object.keys(d).forEach(function(k){cur[k]=d[k];});setObj('settings',cur);toast(T('Saved'),'ok');});
}

/* ---------------- shared bindings ---------------- */
function bind(scope){
 scope.querySelectorAll('[data-open]').forEach(function(el){el.addEventListener('click',function(e){e.stopPropagation();var p=el.getAttribute('data-open').split(':');openForm(p[0],p[1]);});});
 scope.querySelectorAll('[data-del]').forEach(function(el){el.addEventListener('click',function(e){
  e.stopPropagation();
  var p=el.getAttribute('data-del').split(':');
  /* A group holds products, and deleting it strands them: they keep a group name that no
     longer exists, so they disappear from the site with nothing to say why. Name them. */
  if(p[0]==='productGroups'){
   var g=coll('productGroups').filter(function(x){return x.id===p[1];})[0];
   var inside=g?coll('products').filter(function(pr){return pr.category===g.name;}):[];
   if(inside.length){
    toast(T('This group still holds {n} products. Move them to another group first, or delete them.',{n:inside.length}),'err');
    return;
   }
  }
  if(!confirm(T('Delete this {x}? This cannot be undone.',{x:sing(MODELS[p[0]])})))return;
  deleteRecord(p[0],p[1]);toast(T('{x} deleted',{x:T(MODELS[p[0]].singular)}));refresh();
 });});
 scope.querySelectorAll('[data-nav]').forEach(function(el){el.addEventListener('click',function(){navigate(el.getAttribute('data-nav'));});});
}
/* The last line of defence: closing the tab with writes still queued would lose them for
   good, because the queue lives in this page. The browser's own "leave site?" prompt is the
   only thing that can interrupt that. */
window.addEventListener('beforeunload',function(e){
 if(!FAILED.length)return;
 e.preventDefault();e.returnValue='';
});
boot();
})();
