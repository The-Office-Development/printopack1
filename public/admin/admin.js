/* Printopack System - Admin dashboard (v2).
   Self-service CMS covering every section the client requested. Data persists in
   the browser for this build; in production the same read/write layer points at
   api.printopack.com.sa. */
(function(){
"use strict";
var $=function(s,c){return (c||document).querySelector(s);};
var root=document.getElementById('root');
function esc(s){var d=document.createElement('div');d.textContent=s==null?'':String(s);return d.innerHTML;}
function uid(){return 'x'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function today(){return new Date().toISOString().slice(0,10);}
function fmtDate(d){if(!d)return '';var p=new Date(d);if(isNaN(p))return d;return p.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});}
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
 down:'<path d="M6 9l6 6 6-6"/>'
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
function prepImage(f,box,cb){
 if(f.type==='image/svg+xml'){toast('SVG files are not accepted. Please save it as a PNG.','err');return;}
 if(f.type.slice(0,6)!=='image/'){toast('Pictures only. A video goes in as a YouTube or Vimeo link.','err');return;}
 var url=URL.createObjectURL(f),im=new Image();
 im.onerror=function(){URL.revokeObjectURL(url);toast('That image could not be read','err');};
 im.onload=function(){
  URL.revokeObjectURL(url);
  var s=Math.min(1,box/Math.max(im.width,im.height));
  var c=document.createElement('canvas');c.width=Math.round(im.width*s)||1;c.height=Math.round(im.height*s)||1;
  c.getContext('2d').drawImage(im,0,0,c.width,c.height);
  /* WebP keeps transparency, so logos on a transparent background survive. A browser that
     cannot encode WebP silently returns a PNG data URL, in which case fall back to JPEG. */
  var q=0.82,out=c.toDataURL('image/webp',q);
  var type=out.slice(0,15)==='data:image/webp'?'image/webp':'image/jpeg';
  if(type==='image/jpeg')out=c.toDataURL(type,q);
  var cap=imgMaxKB();
  while(dataKB(out)>cap&&q>0.4){q=Math.round((q-0.1)*100)/100;out=c.toDataURL(type,q);}
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
  statOffices:"10",statCountries:"35",statFounded:"1997",statEmployees:"400",statAvgExp:"14",statCustomers:"1000"
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
function apiUploadDataUrls(rec){
 var jobs=[];Object.keys(rec).forEach(function(k){var v=rec[k];if(typeof v==='string'&&v.slice(0,5)==='data:'){jobs.push(fetch(API+'/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({field:k,dataUrl:v})}).then(function(r){return r.json();}).then(function(o){if(o&&o.url)rec[k]=o.url;}));}});
 return Promise.all(jobs).then(function(){return rec;});
}
function apiSaveRecord(collection,rec){return apiUploadDataUrls(rec).then(function(r){return fetch(API+'/'+collection,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(r)});}).then(function(r){if(!r.ok)throw 0;});}
function apiDeleteRecord(collection,id){return fetch(API+'/'+collection+'/'+encodeURIComponent(id),{method:'DELETE'}).then(function(r){if(!r.ok)throw 0;});}
function apiSaveOrder(collection,ids){return fetch(API+'/order/'+collection,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:ids})}).then(function(r){if(!r.ok)throw 0;});}
function apiSaveSingleton(key,o){return fetch(API+'/singleton/'+key,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(o)}).then(function(r){if(!r.ok)throw 0;});}

/* unified writes (optimistic: update CACHE now, persist in the background) */
function saveRecord(collection,rec){
 var arr=coll(collection);var i=arr.findIndex(function(x){return x.id===rec.id;});
 if(i>-1)arr[i]=rec;else arr.unshift(rec);
 pubTouch();
 if(MODE==='api')apiSaveRecord(collection,rec).catch(function(){toast('Save failed - check your connection','err');});
 else persistLocal();
}
function deleteRecord(collection,id){
 CACHE.entries[collection]=coll(collection).filter(function(x){return x.id!==id;});
 pubTouch();
 if(MODE==='api')apiDeleteRecord(collection,id).catch(function(){toast('Delete failed','err');});
 else persistLocal();
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
 if(MODE==='api')apiSaveOrder(collection,arr.map(function(x){return x.id;})).catch(function(){toast('Could not save the new order','err');});
 else persistLocal();
 return true;
}
function setObj(k,o){CACHE.singletons[k]=o;pubTouch();if(MODE==='api')apiSaveSingleton(k,o).catch(function(){toast('Save failed','err');});else persistLocal();}

/* boot: try the backend, else fall back to localStorage, then render */
function boot(){
 fetch(API+'/bootstrap',{headers:{'Accept':'application/json'}}).then(function(r){if(!r.ok)throw 0;return r.json();}).then(function(d){
  MODE='api';CACHE.entries=d.entries||{};CACHE.singletons=d.singletons||{};
  COLLECTIONS.forEach(function(k){if(!CACHE.entries[k])CACHE.entries[k]=[];});
  try{localStorage.setItem(SKEY,'1');}catch(e){} /* Cloudflare Access already authenticated the user */
  render();pubRefresh();
 }).catch(function(){MODE='local';loadLocal();render();pubRefresh();});
}

/* ---------------- models ---------------- */
var sel=function(a){return a;};
var MODELS={
 news:{label:"News & Events",singular:"Post",icon:"news",group:"Content",hasImport:true,hasCalendar:true,
  columns:[{type:"thumb",field:"image"},{type:"title",field:"title",sub:"category"},{type:"pill",field:"status"},{type:"date",field:"date"}],
  fields:[{name:"image",type:"image",label:"Cover image",rec:"1200 × 800px (landscape, JPG)"},{name:"category",type:"select",label:"Category",half:true,options:["General","Company News","Sustainability","Certifications","Events","Products"]},{name:"date",type:"date",label:"Date",half:true},{name:"status",type:"select",label:"Status",half:true,options:["draft","published"]},{name:"title",type:"text",label:"Title (English)"},{name:"body",type:"textarea",label:"Body (English)"},{name:"titleAr",type:"text",label:"Title",ar:"Arabic",rtl:true},{name:"bodyAr",type:"textarea",label:"Body",ar:"Arabic (review before publishing)",rtl:true}]},
 productGroups:{label:"Product Groups",singular:"Group",icon:"products",group:"Content",
  columns:[{type:"thumb",field:"image",contain:true},{type:"title",field:"name",sub:"description"},{type:"text",field:"nameAr"}],
  fields:[{name:"image",type:"image",label:"Group image",contain:true,rec:"1000 × 750px (transparent PNG)"},{name:"name",type:"text",label:"Name (English)",half:true},{name:"nameAr",type:"text",label:"Name",ar:"Arabic",rtl:true,half:true},{name:"kind",type:"select",label:"Type",half:true,options:["Group","Measurements"],rec:"A Measurements group is a size chart rather than a product range: its page shows the drawing at full page width."},{name:"filter",type:"select",label:"Browse family",half:true,options:["snacks","confectionery","bakery","staples","beverage","chilled","specialty"],rec:"Which heading this group sits under in the Browse list on the products page. Snacks · Confectionery · Bakery & Breads · Pantry Staples · Bottles & Liquids · Frozen & Chilled · Specialty."},{name:"description",type:"textarea",label:"Description (English)"},{name:"descriptionAr",type:"textarea",label:"Description",ar:"Arabic",rtl:true}]},
 products:{label:"Products",singular:"Product",icon:"products",group:"Content",
  columns:[{type:"thumb",field:"image",contain:true},{type:"title",field:"name",sub:"category"},{type:"active",field:"active"}],
  fields:[{name:"image",type:"image",label:"Product image",contain:true,rec:"1000 × 750px (transparent PNG)"},{name:"name",type:"text",label:"Name (English)",half:true},{name:"category",type:"select",label:"Group",half:true,optionsFrom:"productGroups"},{name:"kind",type:"select",label:"Type",half:true,options:["Product","Measurements"],rec:"A Measurements section is shown differently: full width, the chart uncropped, and openable at full size, because the sizes printed on it have to be readable."},{name:"description",type:"textarea",label:"Description (English)"},{name:"nameAr",type:"text",label:"Name",ar:"Arabic",rtl:true,half:true},{name:"active",type:"select",label:"Visible on site",half:true,options:["true","false"]},{name:"descriptionAr",type:"textarea",label:"Description",ar:"Arabic",rtl:true}]},
 team:{label:"Our Team",singular:"Member",icon:"team",group:"Content",
  columns:[{type:"thumb",field:"photo",round:true},{type:"title",field:"name",sub:"role"},{type:"text",field:"experience",prefix:"",suffix:" yrs"},{type:"text",field:"email"}],
  fields:[{name:"photo",type:"image",label:"Photo",rec:"600 × 760px (portrait, JPG)"},{name:"mono",type:"text",label:"Monogram (initials, shown until a photo is added)",half:true},{name:"name",type:"text",label:"Name (English)",half:true},{name:"role",type:"text",label:"Role (English)",half:true},{name:"nameAr",type:"text",label:"Name",ar:"Arabic",rtl:true,half:true},{name:"roleAr",type:"text",label:"Role",ar:"Arabic",rtl:true,half:true},{name:"email",type:"text",label:"Email",half:true},{name:"experience",type:"number",label:"Years of experience",half:true},{name:"bio",type:"textarea",label:"Short note (English)"},{name:"bioAr",type:"textarea",label:"Short note",ar:"Arabic",rtl:true}]},
 careers:{label:"Careers",singular:"Job",icon:"careers",group:"Content",
  columns:[{type:"title",field:"title",sub:"dept"},{type:"text",field:"type"},{type:"text",field:"location"},{type:"pill",field:"status"}],
  fields:[{name:"title",type:"text",label:"Title (English)",half:true},{name:"titleAr",type:"text",label:"Title",ar:"Arabic",rtl:true,half:true},{name:"dept",type:"select",label:"Department",half:true,options:["Production","Quality","Sales","Engineering","Admin","Logistics","IT"]},{name:"deptAr",type:"text",label:"Department",ar:"Arabic",rtl:true,half:true},{name:"type",type:"select",label:"Type",half:true,options:["Full-time","Part-time","Contract","Internship"]},{name:"typeAr",type:"text",label:"Type",ar:"Arabic",rtl:true,half:true},{name:"location",type:"text",label:"Location",half:true},{name:"locationAr",type:"text",label:"Location",ar:"Arabic",rtl:true,half:true},{name:"status",type:"select",label:"Status",half:true,options:["draft","published"]},{name:"email",type:"text",label:"Application email",half:true,rec:"Applications for THIS role go here. Send a manager vacancy to that manager rather than to one shared inbox."},{name:"summary",type:"textarea",label:"Summary (English)",rec:"One or two lines, shown under the job title."},{name:"summaryAr",type:"textarea",label:"Summary",ar:"Arabic",rtl:true},{name:"requirements",type:"textarea",label:"Requirements (English)",rec:"One requirement per line. Each line becomes a bullet on the site."},{name:"requirementsAr",type:"textarea",label:"Requirements",ar:"Arabic",rtl:true}]},
 partners:{label:"Success Partners",singular:"Partner",icon:"partners",group:"Content",
  columns:[{type:"thumb",field:"image",contain:true},{type:"title",field:"name",sub:"country",fallback:"country"},{type:"text",field:"country"}],
  fields:[{name:"image",type:"image",label:"Logo",contain:true,rec:"480 × 300px (transparent PNG)"},{name:"name",type:"text",label:"Client name (English)",half:true},{name:"nameAr",type:"text",label:"Client name",ar:"Arabic",rtl:true,half:true},{name:"country",type:"text",label:"Country (English)",half:true},{name:"countryAr",type:"text",label:"Country",ar:"Arabic",rtl:true,half:true},{name:"featured",type:"select",label:"Main partner",half:true,options:["false","true"],rec:"Main partners are the ones shown on the home page. There are always exactly "+MAIN_PARTNERS+" of them, so turn one off before turning another on."},{name:"link",type:"url",label:"Website (optional)"}]},
 factory:{label:"Factory Departments",singular:"Department",icon:"factory",group:"Company",
  columns:[{type:"thumb",field:"image"},{type:"title",field:"name",sub:"kind"},{type:"tag",field:"kind"}],
  fields:[{name:"image",type:"image",label:"Photo",rec:"1200 × 800px (landscape, JPG)"},{name:"name",type:"text",label:"Name (English)",half:true},{name:"kind",type:"select",label:"Type",half:true,options:["Department","Warehouse"]},{name:"nameAr",type:"text",label:"Name",ar:"Arabic",rtl:true},{name:"description",type:"textarea",label:"Description (English)"},{name:"descriptionAr",type:"textarea",label:"Description",ar:"Arabic",rtl:true}]},
 quality:{label:"Quality System",singular:"Item",icon:"quality",group:"Company",
  columns:[{type:"thumb",field:"image"},{type:"title",field:"title",sub:"kind"},{type:"tag",field:"kind"}],
  fields:[{name:"image",type:"image",label:"Certificate / image",rec:"1000 × 1400px (portrait, JPG or PNG)"},{name:"title",type:"text",label:"Title (English)",half:true},{name:"kind",type:"select",label:"Type",half:true,options:["Certificate","Assurance","Lab"]},{name:"titleAr",type:"text",label:"Title",ar:"Arabic",rtl:true},{name:"description",type:"textarea",label:"Description (English)"},{name:"descriptionAr",type:"textarea",label:"Description",ar:"Arabic",rtl:true}]},
 responsibility:{label:"Social Responsibility",singular:"Item",icon:"responsibility",group:"Company",
  columns:[{type:"thumb",field:"image"},{type:"title",field:"title",sub:"category"},{type:"tag",field:"category"}],
  fields:[{name:"image",type:"image",label:"Certificate / image",rec:"1000 × 1400px (portrait, JPG or PNG)"},{name:"title",type:"text",label:"Title (English)",half:true},{name:"category",type:"select",label:"Area",half:true,options:["Environment","Local Community","International"]},{name:"titleAr",type:"text",label:"Title",ar:"Arabic",rtl:true},{name:"description",type:"textarea",label:"Description (English)"},{name:"descriptionAr",type:"textarea",label:"Description",ar:"Arabic",rtl:true}]},
 gallery:{label:"Gallery",singular:"Item",icon:"gallery",group:"Company",
  columns:[{type:"thumb",field:"image"},{type:"title",field:"title",sub:"kind"},{type:"tag",field:"kind"}],
  fields:[{name:"kind",type:"select",label:"Type",half:true,options:["Photo","Video","Advertisement"]},{name:"span",type:"select",label:"Size (photos & ads)",half:true,options:["normal","wide","tall"]},{name:"title",type:"text",label:"Title (English)",half:true},{name:"image",type:"image",label:"Image / thumbnail",rec:"1600 × 1000px JPG/WebP. For videos, upload only a poster image."},{name:"titleAr",type:"text",label:"Title",ar:"Arabic",rtl:true},{name:"url",type:"url",label:"External video / campaign link",rec:"Paste a YouTube or Vimeo link. Do not upload video files."}]},
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
  fields:[{name:"photo",type:"image",label:"Office manager's photo",rec:"420 × 420px, square. Shown beside the office on the contact page; initials stand in until one is added."},{name:"city",type:"text",label:"Office (English)",half:true},{name:"cityAr",type:"text",label:"Office",ar:"Arabic",rtl:true,half:true},{name:"group",type:"select",label:"Group",half:true,options:["Saudi Arabia","Regional & Export"]},{name:"cc",type:"select",label:"Country on the map",half:true,options:["","sa","kw","jo","iq","eg","sd","tn","ly","dz","ma","ye","sy","int"],rec:"Which country this office lights up on the map, and whose details the map shows. Leave blank for a branch inside a country that already has an office (Riyadh, Dammam). 'int' is International Sales, which appears in the selector but has no country to colour."},{name:"country",type:"text",label:"Country / area (English)",half:true},{name:"countryAr",type:"text",label:"Country / area",ar:"Arabic",rtl:true,half:true},{name:"staffName",type:"text",label:"Manager name (English)",half:true},{name:"staffNameAr",type:"text",label:"Manager name",ar:"Arabic",rtl:true,half:true},{name:"staffRole",type:"text",label:"Manager title (English)",half:true},{name:"staffRoleAr",type:"text",label:"Manager title",ar:"Arabic",rtl:true,half:true},{name:"phone",type:"text",label:"Phone",half:true},{name:"email",type:"text",label:"Email",half:true}]}
};

/* ---------------- auth ---------------- */
var SKEY='pp_admin_session';
function loggedIn(){return localStorage.getItem(SKEY)==='1';}
function renderLogin(){
 root.innerHTML='<div class="login"><form class="login-card" id="lf">'+
  '<div class="login-brand">PRINTO<span>·</span>PACK</div>'+
  '<p class="login-sub">Site administration · Staff only</p>'+
  '<h1>Admin sign in</h1>'+
  '<div class="field"><label>Email</label><input type="email" value="creative@printopack.com.sa" required></div>'+
  '<div class="field"><label>Password</label><input type="password" value="demo" required></div>'+
  '<button class="btn btn-primary" style="width:100%;justify-content:center;padding:13px" type="submit">Sign in</button>'+
  '<p class="login-note">Restricted area for Printopack staff. Customer accounts are managed in the customer portal.</p>'+
  '<a class="login-portal" href="https://printopack.azurewebsites.net/">Are you a customer? Go to the customer portal &rarr;</a>'+
 '</form></div>';
 $('#lf').addEventListener('submit',function(e){e.preventDefault();localStorage.setItem(SKEY,'1');render();});
}

/* ---------------- shell ---------------- */
var view='dashboard';
var NAV=[{k:'dashboard',label:'Dashboard',icon:'dash'},{grp:'Content'},{k:'news'},{k:'products'},{k:'team'},{k:'careers'},{k:'partners'},{k:'formats'},{k:'standard'},{grp:'Company'},{k:'factory'},{k:'quality'},{k:'responsibility'},{k:'values'},{k:'gallery'},{grp:'Site'},{k:'about',label:'About & Home',icon:'about'},{k:'offices'},{k:'countries',label:'Countries on the map',icon:'offices'},{k:'settings',label:'Settings',icon:'settings'}];
function sidebar(){
 var items=NAV.map(function(n){
  if(n.grp)return '<div class="sb-group">'+n.grp+'</div>';
  var m=MODELS[n.k]; var label=n.label||(m&&m.label)||n.k; var icon=n.icon||(m&&m.icon)||'dash';
  var badge=m?'<span class="badge">'+coll(n.k).length+'</span>':'';
  return '<div class="sb-item'+(view===n.k?' on':'')+'" data-nav="'+n.k+'">'+svg(icon)+'<span>'+label+'</span>'+badge+'</div>';
 }).join('');
 return '<aside class="sidebar"><div class="sb-brand"><b>PRINTO<span>·</span>PACK</b><small>System · Admin</small></div>'+
  '<nav class="sb-nav">'+items+'</nav>'+
  '<div class="sb-pub" id="pub"></div>'+
  '<div class="sb-foot"><div class="sb-user"><div class="av">CM</div><div><div class="nm">Creative Manager</div><div class="rl">creative@printopack.com.sa</div></div></div>'+
  '<button class="sb-logout" data-logout>'+svg('logout')+'Sign out</button></div></aside>';
}

/* ---------------- publishing ----------------
   Saving and going live are two different things, and the client must never have to guess
   which one they just did. Every edit is saved instantly and privately; this panel is the
   only thing that puts it in front of the public, and it sits in the sidebar so it is
   reachable from every screen. */
var PUB={pending:false,publishedAt:null,canDeploy:true,busy:false};
function agoText(ts){
 if(!ts)return 'never';
 var s=Math.floor((Date.now()-ts)/1000);
 if(s<90)return 'just now';
 if(s<5400)return Math.round(s/60)+' min ago';
 var d=new Date(ts),now=new Date();
 var sameDay=d.toDateString()===now.toDateString();
 return (sameDay?'today':d.toLocaleDateString('en-GB',{day:'numeric',month:'short'}))+' at '+d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
}
/* Kept to two lines: the sidebar nav already needs the height, and this panel is pinned above
   it on every screen. Status and last-published time share one line under the button. */
function pubRender(){
 var el=$('#pub');if(!el)return;
 if(PUB.busy){
  el.className='sb-pub busy';
  el.innerHTML='<button class="pub-btn" disabled>'+svg('publish')+'Publishing…</button>'+
   '<p class="pub-note">'+(PUB.canDeploy?'The site rebuilds in a minute or two.':'Saving your changes for publishing.')+'</p>';
  return;
 }
 el.className='sb-pub'+(PUB.pending?' pending':'');
 var state=PUB.pending?'<i></i>Changes not live yet':'<i></i>Everything is live';
 /* Say this before they press the button, not after: without the deploy hook a publish saves
    the snapshot and the website does not change. */
 var warn=PUB.canDeploy?'':'<p class="pub-note warn">Automatic rebuild is not set up yet, so publishing will not update the website.</p>';
 el.innerHTML='<button class="pub-btn" id="pubgo"'+(PUB.pending?'':' disabled')+'>'+svg('publish')+'Publish to live site</button>'+
  warn+
  '<p class="pub-note">'+state+' · last published '+esc(agoText(PUB.publishedAt))+'.</p>';
 var b=$('#pubgo');if(b)b.addEventListener('click',doPublish);
}
/* Called after every save so the sidebar reacts immediately, without waiting for the server
   to be asked again. */
function pubTouch(){if(!PUB.pending){PUB.pending=true;pubRender();}}
function pubRefresh(){
 if(MODE!=='api'){PUB.pending=true;pubRender();return;}
 fetch(API+'/publish').then(function(r){return r.json();}).then(function(s){
  if(!s)return;
  PUB.pending=!!s.pending;PUB.publishedAt=s.publishedAt;PUB.canDeploy=s.canDeploy!==false;
  pubRender();
 }).catch(function(){});
}
function doPublish(){
 if(MODE!=='api'){toast('This is a preview copy. Publishing works on the live site.','err');return;}
 if(!confirm('Publish everything you have edited to the public website?'))return;
 PUB.busy=true;pubRender();
 fetch(API+'/publish',{method:'POST'}).then(function(r){if(!r.ok)throw 0;return r.json();}).then(function(o){
  PUB.busy=false;PUB.pending=false;PUB.publishedAt=Date.now();pubRender();
  /* A snapshot with no rebuild behind it looks identical from in here, so say so plainly
     rather than let the client believe the website changed. */
  if(o&&o.deployed===false)toast('Saved for publishing, but the site rebuild was not triggered. Tell your developer.','err');
  else toast('Published. The site rebuilds in a minute or two.','ok');
 }).catch(function(){
  PUB.busy=false;pubRender();
  toast('Publish failed. Nothing was changed on the live site.','err');
 });
}
function topbar(title,crumb,actions){return '<div class="topbar"><div><div class="crumb">'+esc(crumb||'Printopack System')+'</div><h1>'+esc(title)+'</h1></div><div class="topbar-actions">'+(actions||'')+'</div></div>';}
function render(){
 ensure();
 if(!loggedIn()){renderLogin();return;}
 root.innerHTML='<div class="app">'+sidebar()+'<main class="main" id="main"></main></div>';
 renderView();
 pubRender();
 root.querySelectorAll('[data-nav]').forEach(function(el){el.addEventListener('click',function(){view=el.getAttribute('data-nav');render();});});
 var lo=root.querySelector('[data-logout]');if(lo)lo.addEventListener('click',function(){localStorage.removeItem(SKEY);render();});
}
function renderView(){var m=$('#main');if(view==='dashboard')return dashView(m);if(view==='about')return aboutView(m);if(view==='countries')return countriesView(m);if(view==='settings')return settingsView(m);if(MODELS[view])return listView(m,view);}

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
  $('#mtext').textContent=s.count+' picture'+(s.count===1?'':'s')+', '+mb(s.bytes)+' of '+mb(s.limit)+' used ('+(pct<0.1?'under 0.1':pct.toFixed(1))+'%).';
 }).catch(function(){});
}

/* ---------------- dashboard ---------------- */
function dashView(m){
 var cards=[{k:'news',l:'News posts',icon:'news'},{k:'products',l:'Products',icon:'products'},{k:'team',l:'Team members',icon:'team'},{k:'partners',l:'Partners',icon:'partners'}].map(function(c){
  return '<div class="stat-card" data-nav="'+c.k+'"><div class="ic">'+svg(c.icon)+'</div><div class="n">'+coll(c.k).length+'</div><div class="l">'+c.l+'</div></div>';
 }).join('');
 var recent=coll('news').slice(0,4).map(function(p){return '<tr class="row" data-open="news:'+p.id+'"><td><span class="t-title">'+esc(p.title)+'</span></td><td><span class="pill tag">'+esc(p.category)+'</span></td><td>'+statusPill(p.status)+'</td><td>'+fmtDate(p.date)+'</td></tr>';}).join('');
 var quick=['news','careers','team','factory'].map(function(k){return '<button class="btn btn-ghost" data-open="'+k+':new">'+svg('plus')+'New '+MODELS[k].singular.toLowerCase()+'</button>';}).join('');
 m.innerHTML=topbar('Welcome back','Dashboard','<button class="btn btn-gold" data-open="news:new">'+svg('plus')+'New post</button>')+
  '<div class="view"><div class="stat-grid">'+cards+'</div>'+
  '<div class="panel"><div class="panel-head"><h2>Recent news</h2><button class="btn btn-ghost btn-sm" data-nav="news">View all</button></div><table class="tbl"><thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Date</th></tr></thead><tbody>'+(recent||'')+'</tbody></table></div>'+
  '<div class="panel"><div class="panel-head"><div><h2>Quick actions</h2><p>Jump into what you update most.</p></div></div><div class="panel-body" style="display:flex;gap:10px;flex-wrap:wrap">'+quick+'<button class="btn btn-ghost" data-nav="about">'+svg('edit')+'Edit home & about</button></div></div>'+
  '<div class="panel" id="storage" hidden><div class="panel-head"><div><h2>Picture storage</h2><p>Every picture on the site, and how much of the free allowance is left.</p></div></div><div class="panel-body"><div class="meter"><span id="mfill"></span></div><p id="mtext" class="meter-text"></p></div></div></div>';
 bind(m);
 storageMeter();
}

/* ---------------- list ---------------- */
function statusPill(s){return s==='published'?'<span class="pill pub">Published</span>':'<span class="pill draft">Draft</span>';}
function cellFor(col,row){
 var v=row[col.field];
 if(col.type==='thumb'){var cls='thumb'+(col.round?' round':'')+(col.contain?' contain':'');return v?'<img class="'+cls+'" src="'+esc(imgSrc(v))+'">':'<div class="'+cls+'" style="display:grid;place-items:center;color:var(--faint);font-family:var(--disp);font-size:15px">'+esc(initials(row))+'</div>';}
 if(col.type==='title'){var t=v||row[col.fallback]||'Untitled';var sub=col.sub&&row[col.sub]?'<div class="t-sub">'+esc(row[col.sub])+'</div>':'';return '<div class="t-title">'+esc(t)+'</div>'+sub;}
 if(col.type==='pill')return statusPill(v);
 if(col.type==='active')return v?'<span class="pill pub">Visible</span>':'<span class="pill off">Hidden</span>';
 if(col.type==='tag')return v?'<span class="pill tag">'+esc(v)+'</span>':'';
 if(col.type==='date')return fmtDate(v);
 if(col.type==='text')return v==null||v===''?'<span class="muted">—</span>':esc((col.prefix||'')+v+(col.suffix||''));
 return esc(v);
}
function initials(r){var s=(r.name||r.title||r.city||'?').trim().split(/\s+/);return ((s[0]||'')[0]||'')+((s[1]||'')[0]||'');}
function listView(m,key){
 var mdl=MODELS[key],rows=coll(key);
 var heads=mdl.columns.map(function(c){return '<th>'+(c.type==='thumb'?'':esc(c.field.charAt(0).toUpperCase()+c.field.slice(1)))+'</th>';}).join('')+'<th></th>';
 var actions='<button class="btn btn-gold" data-open="'+key+':new">'+svg('plus')+'New '+mdl.singular.toLowerCase()+'</button>';
 var toggle=mdl.hasCalendar?'<div class="seg" id="tg"><button class="on" data-mode="list">List</button><button data-mode="cal">Calendar</button></div>':'';
 /* Partners: say how many of the home page's main slots are filled, so the client is never
    guessing why a logo did or did not appear there. */
 var tally='';
 var left=capLeft(key);
 if(left!=null&&left<=Math.max(5,Math.round(capOf(key)*0.1))){
  tally+='<div class="tally'+(left===0?'':'')+'">'+(left===0
   ? mdl.label+' is full at '+capOf(key)+' '+mdl.singular.toLowerCase()+'s. Delete one before adding another.'
   : 'Room for '+left+' more '+mdl.singular.toLowerCase()+(left===1?'':'s')+' before this section is full.')+'</div>';
 }
 if(key==='partners'){
  var main=rows.filter(function(x){return String(x.featured)==='true';}).length;
  tally+='<div class="tally'+(main===MAIN_PARTNERS?' ok':'')+'">'+main+' of '+MAIN_PARTNERS+' main partners selected'+(main===MAIN_PARTNERS?'':', the home page needs exactly '+MAIN_PARTNERS)+'</div>';
 }
 m.innerHTML=topbar(mdl.label,'Content · '+mdl.label,actions)+'<div class="view">'+tally+'<div class="toolbar"><div class="search">'+svg('search')+'<input id="q" placeholder="Search '+mdl.label.toLowerCase()+'…"></div>'+toggle+'</div><div id="host"></div></div>';
 bind(m); // wire the topbar "New" button (rows are bound separately in paint(); #host is empty here so no double-binding)
 function paint(f){
  var list=rows.filter(function(r){return !f||JSON.stringify(r).toLowerCase().indexOf(f.toLowerCase())>-1;});
  if(!list.length){$('#host').innerHTML='<div class="panel"><div class="empty">'+svg(mdl.icon)+'<h3>Nothing here yet</h3><p>Create your first '+mdl.singular.toLowerCase()+' with the button above.</p></div></div>';return;}
  /* Reordering is hidden while a search is active: the arrows move a record past its
     neighbour in the real list, which is not what someone looking at a filtered subset
     would expect to happen. */
  var canOrder=!f&&list.length>1;
  var body=list.map(function(r,i){
   var tds=mdl.columns.map(function(c){return '<td>'+cellFor(c,r)+'</td>';}).join('');
   var mv=canOrder?'<button class="icon-btn mv" data-mv="'+key+':'+r.id+':-1"'+(i===0?' disabled':'')+' title="Move up" aria-label="Move up">'+svg('up')+'</button>'+
                   '<button class="icon-btn mv" data-mv="'+key+':'+r.id+':1"'+(i===list.length-1?' disabled':'')+' title="Move down" aria-label="Move down">'+svg('down')+'</button>':'';
   return '<tr class="row" data-open="'+key+':'+r.id+'">'+tds+'<td><div class="cell-actions">'+mv+'<button class="icon-btn" data-open="'+key+':'+r.id+'">'+svg('edit')+'</button><button class="icon-btn del" data-del="'+key+':'+r.id+'">'+svg('trash')+'</button></div></td></tr>';
  }).join('');
  var hint=canOrder?'<p class="order-hint">The order here is the order on the website.</p>':'';
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
function fieldHTML(f,val){
 var lab='<label>'+esc(f.label)+(f.ar?' <span class="ar">· '+esc(f.ar)+'</span>':'')+'</label>';
 var rtl=f.rtl?' dir="rtl"':'';
 var hint=f.rec?'<div class="hint">'+esc(f.rec)+'</div>':'';
 if(f.type==='image'){var has=val?' has':'';var cn=f.contain?' contain':'';var rec=f.rec?'<span class="imgrec">'+svg('image')+'Recommended: <b>'+esc(f.rec)+'</b> for a flawless fit</span>':'';return '<div class="field full"><label>'+esc(f.label)+'</label>'+rec+'<div class="imgpick'+has+cn+'" data-imgpick="'+f.name+'" data-box="'+recBox(f.rec)+'"><img src="'+esc(imgSrc(val))+'"><div class="ph">'+svg('image')+'Click to upload</div></div><input type="file" accept="image/*" data-imgfile="'+f.name+'" hidden></div>';}
 if(f.type==='textarea')return '<div class="field full">'+lab+'<textarea data-f="'+f.name+'"'+rtl+'>'+esc(val||'')+'</textarea>'+hint+'</div>';
 if(f.type==='select'){var src=f.optionsFrom?coll(f.optionsFrom).map(function(g){return g.name;}).filter(Boolean):f.options;var list=f.optionsFrom?[''].concat(src):src;var opts=list.map(function(o){return '<option'+(String(val)===String(o)?' selected':'')+'>'+esc(o)+'</option>';}).join('');return '<div class="field'+(f.half?'':' full')+'">'+lab+'<select data-f="'+f.name+'">'+opts+'</select>'+hint+'</div>';}
 var t=f.type==='date'?'date':(f.type==='number'?'number':(f.type==='url'?'url':'text'));
 return '<div class="field'+(f.half?'':' full')+'">'+lab+'<input type="'+t+'" data-f="'+f.name+'"'+rtl+' value="'+esc(val==null?'':val)+'">'+hint+'</div>';
}
function openForm(key,id){
 var mdl=MODELS[key];var rec=id==='new'?{}:coll(key).find(function(x){return x.id===id;})||{};
 draft=JSON.parse(JSON.stringify(rec));
 if(id==='new'){mdl.fields.forEach(function(f){if(f.name==='date'&&!draft.date)draft.date=today();if(f.name==='status'&&!draft.status)draft.status='draft';});}
 var imp=mdl.hasImport?'<div class="li-import"><label>'+svg('link')+' Import from a LinkedIn post</label><div class="li-row"><input id="liu" placeholder="Paste a LinkedIn post link…"><button class="btn btn-primary" id="lib" type="button">Import</button></div><div class="li-status" id="lis"><span class="spin"></span><span id="lit"></span></div></div>':'';
 var body='<div class="form-grid">'+mdl.fields.map(function(f){return fieldHTML(f,draft[f.name]);}).join('')+'</div>';
 var host=document.createElement('div');
 host.innerHTML='<div class="overlay" id="ov"></div><div class="drawer" id="dw"><div class="drawer-head"><h2>'+(id==='new'?'New ':'Edit ')+esc(mdl.singular)+'</h2><button class="x" id="xc">✕</button></div><div class="drawer-body">'+imp+body+'</div><div class="drawer-foot"><button class="btn btn-ghost" id="cx">Cancel</button><button class="btn btn-ok" id="sv">Save '+esc(mdl.singular.toLowerCase())+'</button></div></div>';
 document.body.appendChild(host);
 requestAnimationFrame(function(){$('#ov',host).classList.add('show');$('#dw',host).classList.add('show');});
 function close(){$('#ov',host).classList.remove('show');$('#dw',host).classList.remove('show');setTimeout(function(){host.remove();},350);}
 $('#xc',host).addEventListener('click',close);$('#cx',host).addEventListener('click',close);$('#ov',host).addEventListener('click',close);
 host.querySelectorAll('[data-f]').forEach(function(el){el.addEventListener('input',function(){draft[el.getAttribute('data-f')]=el.value;});});
 host.querySelectorAll('[data-imgpick]').forEach(function(p){var name=p.getAttribute('data-imgpick');var file=host.querySelector('[data-imgfile="'+name+'"]');p.addEventListener('click',function(){file.click();});file.addEventListener('change',function(e){var f=e.target.files[0];if(!f)return;prepImage(f,+p.getAttribute('data-box')||IMG_BOX,function(out,kb){draft[name]=out;p.classList.add('has');$('img',p).src=out;toast('Picture ready, '+kb+' KB','ok');});file.value='';});});
 if(mdl.hasImport){$('#lib',host).addEventListener('click',function(){importLI(host);});$('#liu',host).addEventListener('keydown',function(e){if(e.key==='Enter')importLI(host);});}
 $('#sv',host).addEventListener('click',function(){
  if(key==='products')draft.active=String(draft.active)!=='false';
  if(key==='team'&&draft.experience!=null)draft.experience=parseInt(draft.experience,10)||0;
  if(!draft.title&&!draft.name&&!draft.city&&!draft.staffName){toast('Add a title/name first','err');return;}
  if(id==='new'&&capLeft(key)===0){toast(MODELS[key].label+' is full at '+capOf(key)+'. Delete one before adding another.','err');return;}
  /* The home page shows exactly MAIN_PARTNERS main partners. Normalise the flag first: a
     new partner that was never touched must land as "false", not inherit a rendered default,
     or adding a partner would silently make it the 21st main one. Then refuse a 21st, rather
     than letting the site quietly drop someone: the client picks which 20, not the code. */
  if(key==='partners'){
   draft.featured=String(draft.featured)==='true'?'true':'false';
   if(draft.featured==='true'){
    var others=coll('partners').filter(function(x){return x.id!==draft.id&&String(x.featured)==='true';}).length;
    if(others>=MAIN_PARTNERS){toast('Already '+MAIN_PARTNERS+' main partners. Turn one off first.','err');return;}
   }
  }
  if(id==='new')draft.id=uid();
  saveRecord(key,draft);
  toast(mdl.singular+(id==='new'?' created':' updated'),'ok');
  close();render();
 });
}
function importLI(host){
 var url=$('#liu',host).value.trim();if(!url){toast('Paste a link first','err');return;}if(!/^https?:\/\//.test(url))url='https://'+url;
 var st=$('#lis',host),tx=$('#lit',host);st.className='li-status show';tx.textContent='Fetching the post…';$('#lib',host).disabled=true;
 var ctrl=new AbortController();var to=setTimeout(function(){ctrl.abort();},28000);
 fetch('https://r.jina.ai/'+url,{headers:{'Accept':'application/json'},signal:ctrl.signal}).then(function(r){return r.json();}).then(function(res){
  var d=(res&&res.data)||{},meta=d.metadata||{};var title=meta['og:title']||d.title||'';var desc=meta['og:description']||d.description||'';if(!desc&&d.content)desc=String(d.content).replace(/\s+/g,' ').slice(0,320).trim()+'…';var img=meta['og:image']||meta['twitter:image']||'';
  if(!title&&!desc)throw 0;
  setV(host,'title',title.trim());setV(host,'body',desc.trim());if(img){draft.image=img;var p=host.querySelector('[data-imgpick="image"]');if(p){p.classList.add('has');$('img',p).src=img;}}
  st.className='li-status show done';tx.textContent='Imported. Review the text and Arabic, then save.';
 }).catch(function(){st.className='li-status show err';tx.textContent='Could not read that link (login wall or blocked). Type the details below.';}).finally(function(){$('#lib',host).disabled=false;clearTimeout(to);});
}
function setV(host,n,v){draft[n]=v;var el=host.querySelector('[data-f="'+n+'"]');if(el)el.value=v;}

/* ---------------- calendar ---------------- */
function renderCal(hostEl){
 var now=new Date(),y=now.getFullYear(),mth=now.getMonth();var start=new Date(y,mth,1).getDay(),days=new Date(y,mth+1,0).getDate();var evs=coll('news');
 var dow=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(function(d){return '<div class="cal-dow">'+d+'</div>';}).join('');var cells='';
 for(var i=0;i<start;i++)cells+='<div class="cal-cell out"></div>';
 for(var d=1;d<=days;d++){var ds=y+'-'+String(mth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');var t=(d===now.getDate())?' today':'';var de=evs.filter(function(e){return e.date===ds;}).map(function(e){return '<div class="cal-ev" data-open="news:'+e.id+'">'+esc(e.title)+'</div>';}).join('');cells+='<div class="cal-cell'+t+'"><div class="dn">'+d+'</div>'+de+'</div>';}
 hostEl.innerHTML='<div class="cal"><div class="cal-head"><h2>'+new Date(y,mth,1).toLocaleDateString('en-GB',{month:'long',year:'numeric'})+'</h2><span class="muted" style="font-size:13px">'+evs.length+' entries</span></div><div class="cal-grid">'+dow+cells+'</div></div>';
 bind(hostEl);
}

/* ---------------- about & settings (single form) ---------------- */
function formPanel(title,desc,fields,data){
 return '<div class="panel"><div class="panel-head"><div><h2>'+esc(title)+'</h2>'+(desc?'<p>'+esc(desc)+'</p>':'')+'</div></div><div class="panel-body"><div class="form-grid">'+fields.map(function(f){return fieldHTML(f,data[f.name]);}).join('')+'</div></div></div>';
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
  var detail=o?[o.email,o.phone].filter(Boolean).join(' · '):'Not in the network';
  return '<div class="cty'+(o?' on':'')+'">'+
   '<div class="cty-main"><div class="cty-name">'+esc(c.en)+'</div>'+
   '<div class="cty-ar" dir="rtl">'+esc(c.ar)+'</div>'+
   '<div class="cty-detail">'+esc(detail||'No contact details yet')+'</div></div>'+
   '<button class="sw'+(o?' on':'')+'" data-cty="'+c.cc+'" role="switch" aria-checked="'+(!!o)+'" aria-label="'+esc(c.en)+'"><span class="sw-k"></span></button>'+
   '</div>';
 }).join('');
 m.innerHTML=topbar('Countries on the map','Site · Countries','')+
  '<div class="view"><p class="hint-lead">Switch a country on and it joins the network: a new office appears under Offices &amp; Contact for its email, phone and manager, and the country lights up on both maps. Switch it off and that office is removed.</p>'+
  '<div class="tally'+(live?' ok':'')+'">'+live+' of '+COUNTRIES.length+' countries switched on</div>'+
  '<div class="cty-grid">'+cards+'</div></div>';
 m.querySelectorAll('[data-cty]').forEach(function(btn){
  btn.addEventListener('click',function(){
   var cc=btn.getAttribute('data-cty');
   var c=COUNTRIES.filter(function(x){return x.cc===cc;})[0];
   var existing=on(cc);
   if(existing){
    if(!confirm('Switch '+c.en+' off? Its office, including the email and phone, is deleted and the country is removed from the map.'))return;
    deleteRecord('offices',existing.id);
    toast(c.en+' switched off','ok');
   }else{
    saveRecord('offices',{id:uid(),group:'Regional & Export',cc:cc,city:c.en,cityAr:c.ar,
     country:c.en,countryAr:c.ar,staffName:'',staffNameAr:'',staffRole:'',staffRoleAr:'',
     phone:'',email:''});
    toast(c.en+' switched on. Add its details under Offices & Contact.','ok');
   }
   render();
  });
 });
}
function aboutView(m){
 var p=obj('about');
 m.innerHTML=topbar('About & Home','Site','<button class="btn btn-ok" id="save">Save changes</button>')+'<div class="view">'+
  formPanel('Home hero','The headline visitors see first.',[{name:'heroTitle',type:'text',label:'Hero headline'},{name:'heroTitleAr',type:'text',label:'Hero headline',ar:'Arabic',rtl:true},{name:'heroSub',type:'textarea',label:'Hero subtext'},{name:'heroSubAr',type:'textarea',label:'Hero subtext',ar:'Arabic',rtl:true}],p)+
  formPanel('The company story','Shown on the Company page. Leave a blank line between paragraphs and each one is laid out separately. The values themselves are edited under Our Values.',[{name:'historyTitle',type:'text',label:'History headline (English)'},{name:'historyTitleAr',type:'text',label:'History headline',ar:'Arabic',rtl:true},{name:'history',type:'textarea',label:'History (English)'},{name:'historyAr',type:'textarea',label:'History',ar:'Arabic',rtl:true},{name:'ownership',type:'text',label:'Ownership'},{name:'ownershipAr',type:'text',label:'Ownership',ar:'Arabic',rtl:true},{name:'vision',type:'text',label:'Vision headline (English)'},{name:'visionAr',type:'text',label:'Vision headline',ar:'Arabic',rtl:true},{name:'visionBody',type:'textarea',label:'Vision (English)'},{name:'visionBodyAr',type:'textarea',label:'Vision',ar:'Arabic',rtl:true},{name:'mission',type:'text',label:'Mission headline (English)'},{name:'missionAr',type:'text',label:'Mission headline',ar:'Arabic',rtl:true},{name:'missionBody',type:'textarea',label:'Mission (English)'},{name:'missionBodyAr',type:'textarea',label:'Mission',ar:'Arabic',rtl:true}],p)+
  formPanel('Counters','The stat numbers shown across the site. Change a number here and every page that shows it follows.',[{name:'statOffices',type:'text',label:'Offices',half:true},{name:'statCountries',type:'text',label:'Countries',half:true},{name:'statFounded',type:'text',label:'Year founded',half:true,rec:'Years in the market are counted from this year automatically.'},{name:'statEmployees',type:'text',label:'Employees',half:true},{name:'statAvgExp',type:'text',label:'Avg. experience (yrs)',half:true},{name:'statCustomers',type:'text',label:'Customers',half:true}],p)+
  '</div>';
 var d={};m.querySelectorAll('[data-f]').forEach(function(el){el.addEventListener('input',function(){d[el.getAttribute('data-f')]=el.value;});});
 $('#save').addEventListener('click',function(){var cur=obj('about');Object.keys(d).forEach(function(k){cur[k]=d[k];});setObj('about',cur);toast('Saved','ok');});
}
function settingsView(m){
 var s=obj('settings');
 m.innerHTML=topbar('Settings','Site','<button class="btn btn-ok" id="save">Save changes</button>')+'<div class="view">'+
  formPanel('Company details','Shown in the footer of every page and on the contact page.',[{name:'company',type:'text',label:'Company name (English)'},{name:'companyAr',type:'text',label:'Company name',ar:'Arabic',rtl:true},{name:'phone',type:'text',label:'Phone',half:true},{name:'fax',type:'text',label:'Fax',half:true},{name:'email',type:'text',label:'Email',half:true},{name:'hours',type:'text',label:'Office hours',half:true},{name:'address',type:'textarea',label:'Address (English)'},{name:'addressAr',type:'textarea',label:'Address',ar:'Arabic',rtl:true},{name:'addressShort',type:'text',label:'Short address (English)',rec:'The compact version shown in the bar at the very top of every page.'},{name:'addressShortAr',type:'text',label:'Short address',ar:'Arabic',rtl:true}],s)+formPanel('Pictures','How large an uploaded picture may be. Every picture is shrunk and re-encoded in your browser before it is sent, so most land far under this on their own. Lower it if the storage meter on the dashboard climbs; anything that will not fit is refused rather than quietly accepted.',[{name:'maxImageKb',type:'number',label:'Largest picture (KB)',half:true,rec:'Between 40 and 600. The default is 400 KB. A phone photo normally lands around 65 KB.'}],s)+'</div>';
 var d={};m.querySelectorAll('[data-f]').forEach(function(el){el.addEventListener('input',function(){d[el.getAttribute('data-f')]=el.value;});});
 $('#save').addEventListener('click',function(){var cur=obj('settings');Object.keys(d).forEach(function(k){cur[k]=d[k];});setObj('settings',cur);toast('Saved','ok');});
}

/* ---------------- shared bindings ---------------- */
function bind(scope){
 scope.querySelectorAll('[data-open]').forEach(function(el){el.addEventListener('click',function(e){e.stopPropagation();var p=el.getAttribute('data-open').split(':');openForm(p[0],p[1]);});});
 scope.querySelectorAll('[data-del]').forEach(function(el){el.addEventListener('click',function(e){e.stopPropagation();var p=el.getAttribute('data-del').split(':');if(!confirm('Delete this '+MODELS[p[0]].singular.toLowerCase()+'? This cannot be undone.'))return;deleteRecord(p[0],p[1]);toast(MODELS[p[0]].singular+' deleted');render();});});
 scope.querySelectorAll('[data-nav]').forEach(function(el){el.addEventListener('click',function(){view=el.getAttribute('data-nav');render();});});
}
boot();
})();
