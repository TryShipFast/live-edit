(function(){
const A='assets/31/';
const LEVELS=[
 {id:'stylist',n:'Stylist',m:1,d:'Three years or more on the floor. Precise, unhurried, great for regular cuts.'},
 {id:'senior',n:'Senior',m:1.2,d:'Eight years or more. Colour corrections, big changes, textured and curly hair.'},
 {id:'director',n:'Creative director',m:1.45,d:'Ines and Ama. Shoots, bridal, the hardest colour work.'}
];
const MENU=[
 {cat:'Cuts and styling',items:[
  {id:'cut-blow',n:'Cut and blow-dry',min:60,p:65,note:'Consultation, wash, cut, finish',tr:'cut-and-blow-dry'},
  {id:'restyle',n:'Restyle',min:75,p:80,note:'A big change, with time to talk it through first'},
  {id:'fringe',n:'Fringe trim',min:15,p:15,note:'Between cuts, any stylist'},
  {id:'blow-dry',n:'Wash and blow-dry',min:45,p:40,note:'Smooth, bouncy or undone'},
  {id:'curly',n:'Curly cut',min:90,p:85,note:'Cut dry, curl by curl, then defined'}
 ]},
 {cat:'Colour',items:[
  {id:'balayage',n:'Balayage',min:180,p:190,note:'Hand-painted lightening, toned to finish. Patch test 48 hours before',tr:'balayage'},
  {id:'roots',n:'Root tint',min:90,p:70,note:'Regrowth only, up to 2 cm'},
  {id:'full-colour',n:'Full head colour',min:120,p:95,note:'One shade, root to tip'},
  {id:'gloss',n:'Gloss and toner',min:45,p:45,note:'Shine and tone between colours',tr:'gloss-and-toner'},
  {id:'correction',n:'Colour correction',min:240,p:280,note:'From a consultation only. Price confirmed before we start'}
 ]},
 {cat:'Treatments',items:[
  {id:'smoothing',n:'Smoothing treatment',min:150,p:160,note:'Cuts frizz for up to 12 weeks',tr:'smoothing'},
  {id:'bond',n:'Bond repair',min:30,p:30,note:'Added to any colour'},
  {id:'scalp',n:'Scalp treatment',min:30,p:35,note:'Exfoliate, massage, steam'}
 ]},
 {cat:'Occasions',items:[
  {id:'up',n:'Hair up',min:60,p:70,note:'Weddings, parties, the theatre'},
  {id:'trial',n:'Bridal trial',min:90,p:95,note:'Taken off the wedding-day price'}
 ]}
];
const TREAT=[
 {id:'balayage',n:'Balayage',svc:'balayage',img:A+'hairdone-daniel.jpg',alt:'Stylist working colour through a client\'s hair by the window',lead:'Lightness painted by hand where the sun would put it, so it grows out softly and needs a visit every four to five months, not every six weeks.',time:'3 hours, including toner and blow-dry',steps:[['Consultation','We look at your hair in daylight, talk about how light you want to go, and agree a price before anything is mixed.'],['Painting','Sections are painted freehand and left open or wrapped in paper, depending on how strong you want the lift.'],['Toning','A gloss takes out brassiness and sets the final shade.'],['Finish','Cut if booked, then a blow-dry and a talk about home care.']],care:'Wash in cool water, use a purple shampoo once a week, and book a gloss at eight weeks to keep the tone.',patch:true},
 {id:'cut-and-blow-dry',n:'Cut and blow-dry',svc:'cut-blow',img:A+'scissors-farhad.jpg',alt:'Hands cutting wet hair with scissors and a comb',lead:'The appointment most people book us for. Sixty minutes, so there is time to talk before the scissors come out.',time:'60 minutes',steps:[['Talk first','How you wear it, how long you have in the morning, what went wrong last time.'],['Wash','With a scalp massage. Tell us if you would rather skip it.'],['Cut','Wet or dry depending on your hair, checked as it dries.'],['Finish','Blow-dried the way you would do it at home, so you can.']],care:'Book your next cut before you leave: six to eight weeks for short hair, ten to twelve for long.',patch:false},
 {id:'gloss-and-toner',n:'Gloss and toner',svc:'gloss',img:A+'cut-lindsay.jpg',alt:'Client at the wash basin with her head back',lead:'A quick shine and colour refresh that sits on the outside of the hair. No lightening, no damage, and it fades out gently.',time:'45 minutes',steps:[['Check','We look at the tone you have now and the one you want.'],['Gloss','Applied at the basin and timed to the minute.'],['Rinse and dry','A quick blow-dry so you can see the shine.']],care:'Lasts four to six weeks. Sulphate-free shampoo makes it last longer.',patch:true},
 {id:'smoothing',n:'Smoothing treatment',svc:'smoothing',img:A+'curler-baylee.jpg',alt:'Hands curling a long section of brown hair',lead:'Calms frizz and cuts your drying time for up to twelve weeks, without making hair flat or straight unless you want it to be.',time:'2 hours 30 minutes',steps:[['Clarify','A deep wash to clear build-up so the treatment takes evenly.'],['Apply','Section by section, combed through and timed.'],['Seal','Dried and sealed with a flat iron at a heat set for your hair.']],care:'No tight ponytails or clips for 48 hours. Use sulphate-free shampoo after that.',patch:true}
];
const TEAM=[
 {id:'ines',n:'Ines Varga',r:'Creative director, owner',lvl:'director',img:A+'curl-giorgio.jpg',alt:'Ines curling a client\'s hair',spec:'Balayage, long hair, bridal',q:'Certified colour educator · 19 years',bio:'Ines opened Maren in 2014 after twelve years in other people\'s salons. She still takes clients four days a week and teaches the team on Mondays.',quote:'I want people to leave with hair they can do themselves on a Tuesday.'},
 {id:'ama',n:'Ama Owusu',r:'Creative director, colour',lvl:'director',img:A+'hairdone-daniel.jpg',alt:'Ama working colour through a client\'s hair',spec:'Colour correction, blondes, grey blending',q:'Certified colourist · 14 years',bio:'Ama runs colour. If something went wrong elsewhere, she is the person to see, and she will tell you honestly how many visits it will take.',quote:'Good colour starts with a long consultation and a patch test.'},
 {id:'hana',n:'Hana Brook',r:'Senior stylist',lvl:'senior',img:A+'dryer-adam.jpg',alt:'Hana blow-drying a client\'s bob',spec:'Short cuts, bobs, fringes',q:'Qualified stylist · 9 years',bio:'Hana cuts most of our short hair. She is quick, exact and very good at a fringe that works with a cowlick.',quote:'A bob should still look right on day four.'},
 {id:'teo',n:'Teo Marsh',r:'Senior stylist',lvl:'senior',img:A+'scissors-farhad.jpg',alt:'Teo cutting a section of wet hair',spec:'Curly and textured hair',q:'Qualified stylist, curl specialist · 8 years',bio:'Teo cuts curls dry, one by one. Allow ninety minutes for a first visit.',quote:'Curls tell you where they want to be cut.'},
 {id:'rosa',n:'Rosalind Delgado-Whitfield',r:'Stylist',lvl:'stylist',img:'',alt:'',spec:'Blow-dries, hair up, everyday cuts',q:'Qualified stylist · 3 years',bio:'Rosalind joined after her training at Maren. She does most of our Saturday blow-dries and wedding mornings.',quote:'I like a big, bouncy finish.'}
];
const GAL=[
 {id:'g1',c:'Colour',img:A+'hairdone-daniel.jpg',alt:'Balayage being worked through by the window',t:'Soft balayage, toned beige'},
 {id:'g2',c:'Cuts',img:A+'scissors-farhad.jpg',alt:'Precision cut on wet hair',t:'Blunt one-length cut'},
 {id:'g3',c:'Styling',img:A+'curler-baylee.jpg',alt:'Long hair being curled with a wand',t:'Loose wand curls'},
 {id:'g4',c:'Space',img:A+'salon-brick.jpg',alt:'The salon floor with black chairs and round mirrors',t:'The main floor'},
 {id:'g5',c:'Styling',img:A+'blow-adam.jpg',alt:'Round-brush blow-dry in progress',t:'Round-brush blow-dry'},
 {id:'g6',c:'Space',img:A+'sinks-bw.jpg',alt:'A row of wash basins in black and white',t:'The wash room'},
 {id:'g7',c:'Colour',img:A+'curl-giorgio.jpg',alt:'Dimensional colour being curled',t:'Lived-in brunette'},
 {id:'g8',c:'Cuts',img:A+'dryer-adam.jpg',alt:'Bob being dried into shape',t:'Chin-length bob'},
 {id:'g9',c:'Space',img:A+'salon-modern.jpg',alt:'Arched mirrors and chairs in a pale room',t:'The quiet room'}
];
const GCATS=['All','Colour','Cuts','Styling','Space','Bridal'];
const JOURNAL=[
 {id:'j1',d:'2026-10-02',t:'Why we ask for a patch test, every time',img:A+'cut-lindsay.jpg',alt:'Client at the wash basin',x:['A reaction to hair dye can happen even if you have had the same colour for years. That is why we patch test 48 hours before every colour appointment, including returning clients after six months.','It takes five minutes. Pop in, we put a dot of the colour behind your ear, and you go about your day.']},
 {id:'j2',d:'2026-09-14',t:'Late Thursdays are back',img:A+'salon-brick.jpg',alt:'The salon floor at night',x:['From October we are open until 9pm on Thursdays, with three stylists on.','Book online or call; walk-ins only if a chair is free.']},
 {id:'j3',d:'2026-08-21',t:'What to ask before you go from very dark to very light, and why it usually takes more than one appointment',img:'',alt:'',x:['Going from dark to light in one sitting can break hair. Most of the time we plan two or three visits, six weeks apart, with bond repair in each.','Ama will map the visits out at your consultation and tell you the full price before you commit.']}
];
const REVIEWS=[
 {q:'Ines listened for ten minutes before she touched my hair. First balayage I have not had to fix at home.',n:'Priya',s:'Balayage with Ines'},
 {q:'Teo understood my curls straight away. I left with a shape I can actually wear.',n:'Jonah',s:'Curly cut with Teo'}
];
const HOURS=[['Monday','Closed'],['Tuesday','9am to 6pm'],['Wednesday','9am to 6pm'],['Thursday','9am to 9pm'],['Friday','9am to 7pm'],['Saturday','8am to 5pm'],['Sunday','10am to 4pm']];
const ROLES=[
 {id:'chair',t:'Chair rental, self-employed stylist',d:'Two chairs available. Weekly rent includes products, reception and booking system. At least 5 years of experience.'},
 {id:'assistant',t:'Salon assistant (part-time)',d:'Three days a week including Saturdays. Training towards a stylist qualification included.'}
];
window.MR31={A,LEVELS,MENU,TREAT,TEAM,GAL,GCATS,JOURNAL,REVIEWS,HOURS,ROLES,
 ADDR:'14 Alder Row, Old Town',PHONE:'+00 0000 000 314',EMAIL:'hello@maren-salon.example'};
})();
