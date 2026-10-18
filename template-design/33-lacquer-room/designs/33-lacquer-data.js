(function(){
const A='assets/33/';
const BIZ={n:'Lacquer Room',addr:'7 Weaver Yard, Mill District (Sample)',phone:'+1 555 0147 (Sample)',tel:'+15550147',email:'hello@lacquerroom.example'};
const FINISHES=[
 {id:'classic',n:'Classic',min:30,wear:'5–7 days',p:28,soak:'Removes with polish remover',note:'Air-dries. Best for short, natural nails and toes.'},
 {id:'gel',n:'Gel',min:45,wear:'2–3 weeks',p:48,soak:'Soaks off in 15 min',note:'Cured under LED. High shine, no smudging when you leave.'},
 {id:'biab',n:'BIAB',min:60,wear:'3–4 weeks',p:62,soak:'Infill, no full removal',note:'Builder gel that adds strength to weak or peeling natural nails.'},
 {id:'chrome',n:'Chrome',min:60,wear:'2–3 weeks',p:58,soak:'Soaks off in 15 min',note:'Mirror powder rubbed over gel. Reads silver, rose or pearl.'},
 {id:'press',n:'Press-on set',min:40,wear:'1–2 weeks',p:52,soak:'Reusable set, sized to you',note:'Made to your measurements. Glue or tabs; take them home.'}];
const FAMILIES=[{id:'sheer',n:'Sheers'},{id:'earth',n:'Earth'},{id:'berry',n:'Berry'},{id:'green',n:'Green'},{id:'blue',n:'Blue'},{id:'french',n:'French'}];
const SHADES={
 sheer:[['Milk glass','#EDE6E1'],['Bare','#E3C9BC'],['Shell','#F1D9D4'],['Oat','#D9CBB5']],
 earth:[['Clay','#A8644A'],['Cocoa','#6B4234'],['Sand','#C9A27E'],['Fig','#5B3A40']],
 berry:[['Plum','#5A2240'],['Cherry','#8E1F2C'],['Mulberry','#7A2E55'],['Rosehip','#B5475A']],
 green:[['Oxide','#3F5E4E'],['Sage','#93A58E'],['Moss','#4F5B32'],['Bottle','#1F3B30']],
 blue:[['Ink','#1E2A44'],['Denim','#41597A'],['Mist','#AFC0D3'],['Cornflower','#5E7FC1']],
 french:[['Classic tip','#F4F1EC'],['Micro tip','#EFE6DF'],['Deep tip','#E6DCD2'],['Colour tip','#3F5E4E']]};
const NOFIT={chrome:['french'],classic:[]};
const CATS=[
 {id:'hands',n:'Hands',img:A+'nude-coat.jpg',alt:'Technician painting a nude coat on a client\u2019s nails',items:[
  {id:'classic-mani',n:'Classic manicure',min:30,p:28,d:'Shape, cuticle tidy, buff, polish.'},
  {id:'gel',n:'Gel manicure',min:45,p:48,d:'Shape, prep, gel colour, cured.',detail:true},
  {id:'biab',n:'BIAB overlay',min:60,p:62,d:'Builder gel on natural nails, any shade.',detail:true},
  {id:'biab-infill',n:'BIAB infill',min:50,p:52,d:'Every 3\u20134 weeks. Rebalance and new colour.'},
  {id:'chrome',n:'Chrome or pearl',min:60,p:58,d:'Gel base with mirror powder.',detail:true},
  {id:'soak',n:'Gel soak-off',min:20,p:15,d:'Gentle removal and a strengthening oil.'}]},
 {id:'feet',n:'Feet',img:A+'chair-white.jpg',alt:'A white treatment chair in a bright room',items:[
  {id:'pedicure',n:'Gel pedicure',min:60,p:58,d:'Soak, file, hard skin, gel colour.',detail:true},
  {id:'classic-pedi',n:'Classic pedicure',min:45,p:42,d:'Soak, file, polish.'},
  {id:'toes',n:'Toes only',min:25,p:24,d:'File and gel on toes.'}]},
 {id:'art',n:'Art and sets',img:A+'press-earth.jpg',alt:'A press-on set in earth tones laid out on a tray',items:[
  {id:'french',n:'French or micro French',min:15,p:12,d:'Add to any gel or BIAB.'},
  {id:'art2',n:'Nail art, two nails',min:15,p:10,d:'Lines, dots, chrome accents.'},
  {id:'press',n:'Custom press-on set',min:40,p:52,d:'Sized at a short fitting, made in 5 days.'}]}];
const TREAT={
 gel:{n:'Gel manicure',img:A+'pink-coat.jpg',alt:'Gel colour being applied to pink nails',lead:'Two to three weeks of shine. Soaks off in 15 minutes without scraping.',steps:['Shape and push back cuticles with a wooden stick — no metal on the nail plate.','Light buff only where the gel needs grip.','Base, two colour coats and top, each cured under LED.','Cuticle oil, then you are done — nothing to smudge.'],good:'Short to medium natural nails, regular colour changes.',not:'Very thin or peeling nails — BIAB will hold better.'},
 biab:{n:'BIAB overlay',img:A+'sheer-five.jpg',alt:'Five nails in soft sheer BIAB shades',lead:'A builder gel layer that strengthens your own nails while they grow.',steps:['Consultation: we check nail health and any reaction to gel before.','Prep with a hand file, then a thin builder layer shaped to an apex.','Colour or sheer finish, cured.','Infill every 3–4 weeks — no full removal needed.'],good:'Weak, bendy or peeling nails; growing nails out.',not:'Broken skin around the nail — we will rebook you.'},
 chrome:{n:'Chrome or pearl',img:A+'blue-ombre.jpg',alt:'Blue ombre nails with a chrome tip',lead:'A mirror finish rubbed over gel — silver, rose, pearl or a tint over colour.',steps:['Gel prep as for a gel manicure.','Colour coat, then a no-wipe top.','Chrome powder pressed in with a silicone tool.','Sealed with a final top coat.'],good:'Short squoval or almond shapes, special occasions.',not:'French tips — chrome fights the white line.'},
 pedicure:{n:'Gel pedicure',img:A+'chair-white.jpg',alt:'A white treatment chair ready for a pedicure',lead:'An hour with your feet up. Gel on toes lasts four to six weeks.',steps:['Warm soak with salts, nails trimmed and filed.','Hard skin smoothed by hand file — no blades.','Gel colour on toes.','Balm and a short leg massage.'],good:'Holidays, sandals season, anyone on their feet all day.',not:'Fungal or broken skin — see a foot specialist first.'}};
const TECHS=[
 {id:'ines',n:'In\u00e9s',role:'Founder, BIAB and structure',mono:'IN',yrs:9,img:A+'clear-coat.jpg',alt:'Close-up of a clear coat being brushed on',spec:['biab','gel'],next:'Thu 11:30',bio:'Opened the studio in 2019 after years of fixing over-filed nails. Slow prep, thin layers.'},
 {id:'cal',n:'Cal',role:'Art and chrome',mono:'CA',yrs:5,img:A+'marble-tips.jpg',alt:'Marbled art set by Cal — art',spec:['chrome','art2','french'],next:'Today 16:00',bio:'Fine lines and chrome. Bring a picture; Cal will tell you honestly what will last.'},
 {id:'maya',n:'Maya',role:'Pedicure and natural nail care',mono:'MA',yrs:7,img:A+'french-file.jpg',alt:'A nail being filed to a soft French shape',spec:['pedicure','classic-mani'],next:'Fri 10:00',bio:'Pedicures and nail repair. Good with nervous first-timers and kids\u2019 polish.'},
 {id:'jun',n:'Jun',role:'Press-on sets',mono:'JU',yrs:4,img:A+'press-speckle.jpg',alt:'A speckled press-on set on a tray',spec:['press'],next:null,leave:'Back on 4 November',bio:'Designs custom press-on sets in the back room. On leave this month.'}];
const GALLERY=[
 {img:A+'blue-ombre.jpg',tag:'Chrome',alt:'Blue ombre with chrome tips'},
 {img:A+'sheer-five.jpg',tag:'BIAB',alt:'Sheer BIAB in five soft shades'},
 {img:A+'pink-coat.jpg',tag:'Gel',alt:'Pink gel being applied'},
 {img:A+'pastel-close.jpg',tag:'BIAB',alt:'Pastel BIAB close up'},
 {img:A+'nude-coat.jpg',tag:'Gel',alt:'Nude gel coat on short nails'},
 {img:A+'french-file.jpg',tag:'Classic',alt:'Soft French shape being filed'},
 {img:A+'marble-hands.jpg',tag:'Classic',alt:'Hands on a marble table during a manicure'},
 {img:A+'press-earth.jpg',tag:'Art',alt:'Earth-tone set laid out on a tray'},
 {img:A+'marble-tips.jpg',tag:'Art',alt:'Marbled white set with purple and black tips'},
 {img:A+'almond-rest.jpg',tag:'Gel',alt:'Almond nude gel set resting on a soft throw'},
 {img:A+'polish-apply.jpg',tag:'Classic',alt:'A technician painting a client\'s nails berry red'},
 {img:A+'file-desk.jpg',tag:'Classic',alt:'A technician filing a client\'s nails at the desk'}];
const GTAGS=['All','Gel','BIAB','Chrome','Classic','Art','Press-on'];
const QUOTES=[
 {q:'My nails have grown past my fingertips for the first time in years. Three BIAB infills in.',who:'Priya, BIAB'},
 {q:'Cal talked me out of a design that would have chipped in a week. The simpler one lasted four.',who:'Tom, chrome'},
 {q:'Booked my mum and me together. Quiet, clean, nobody tried to sell us anything.',who:'Elle, gel pedicure'}];
const FIRST=[
 {t:'Consultation',d:'Ten minutes on your nail health, allergies and what you want to wear. Patch test offered for BIAB and extensions.',img:A+'marble-hands.jpg',alt:'Two pairs of hands on a marble table'},
 {t:'Prep by hand',d:'Hand files and wooden sticks on the natural nail. Sterile tools from a sealed pouch each time.',img:A+'gloves-nippers.jpg',alt:'Gloved hands holding sterilised nippers'},
 {t:'Colour and cure',d:'Thin coats, cured under LED. You choose the shade from the chart.',img:A+'polish-apply.jpg',alt:'A technician painting thin colour coats, cured under LED'},
 {t:'Aftercare',d:'Oil, a care card and your next date. Infill in three to four weeks.',img:A+'almond-rest.jpg',alt:'A freshly finished almond nude set'}];
const SHELF=[
 {n:'Cuticle oil',p:14,d:'Jojoba and almond, 10 ml. Twice a day.',img:A+'clear-coat.jpg',alt:'Clear coat brush and bottle'},
 {n:'Glass file',p:12,d:'Files one way, seals the edge, washable.',img:A+'file-desk.jpg',alt:'Nail being filed'},
 {n:'Hand balm',p:18,d:'Unscented shea balm for after hand-washing.',img:A+'marble-hands.jpg',alt:'Hands resting on marble'},
 {n:'Top-up press-on tabs',p:6,d:'Spare adhesive tabs for your set.',img:A+'press-speckle.jpg',alt:'Speckled press-on set'}];
const HOURS=[['Mon','Closed'],['Tue','10:00–19:00'],['Wed','10:00–19:00'],['Thu','10:00–20:00'],['Fri','10:00–19:00'],['Sat','09:00–17:00'],['Sun','11:00–16:00']];
const FAQ=[
 {q:'Does gel or BIAB damage nails?',a:'Removal does the damage, not the gel. We soak off and never scrape or drill your natural nail.'},
 {q:'How long does an appointment take?',a:'Gel 45 min, BIAB 60 min, gel pedicure 60 min. Each card shows the time.'},
 {q:'Do I need a patch test?',a:'For BIAB and extensions we offer one 48 hours before if you have had a reaction to gel or acrylic.'},
 {q:'What if I am late?',a:'We hold your slot for 10 minutes. After that we may shorten the treatment or rebook you.'},
 {q:'Do you take a deposit?',a:'A $10 deposit for appointments over 60 minutes, taken off your bill (Sample).'},
 {q:'Can I bring a picture?',a:'Yes. Your technician will tell you what will last on your nail length.'}];
const POLICIES=[
 {t:'Cancellation',d:'Free up to 24 hours before. Inside 24 hours we keep the deposit.'},
 {t:'Late arrival',d:'10 minutes grace, then a shorter treatment or a new time.'},
 {t:'Deposits',d:'$10 for treatments over 60 minutes (Sample), taken off your bill.'},
 {t:'Patch tests and allergies',d:'Offered 48 hours before BIAB or extensions. Tell us about any reaction to gel, acrylic or latex.'},
 {t:'Consultation',d:'Every first visit starts with a short consultation. We may refuse treatment over broken or infected skin.'},
 {t:'Hygiene',d:'Sterile metal tools in sealed pouches, single-use files and buffers, tables wiped between clients.'},
 {t:'Children',d:'Polish for under-12s with an adult present. No gel for under-16s.'}];
const ROLES=[
 {id:'desk',n:'Desk rental, two days a week',type:'Self-employed',d:'A lit desk, LED lamp, storage and booking system access. For qualified technicians with their own clients.'},
 {id:'tech',n:'Nail technician, part time',type:'Employed, 3 days',d:'Gel and BIAB, at least two years of salon work. Certified and insured.'}];
const POSTS=[
 {id:'p1',t:'Gel or BIAB: which one for weak nails?',date:'2026-09-30',img:A+'almond-rest.jpg',alt:'Almond nude set on short natural nails',ex:'BIAB adds a structure layer; gel adds colour. Here is how we decide at the desk.',body:['Gel is a colour coat. It sits on top of your nail and comes off in fifteen minutes.','BIAB is a builder gel. It is applied thicker at the stress point, so bendy nails stop snapping while they grow.','If your nails peel in layers, start with BIAB and keep it for two or three infills.']},
 {id:'p2',t:'How we clean between clients',date:'2026-08-14',img:A+'gloves-nippers.jpg',alt:'Gloved hands with sterile nippers',ex:'Sealed pouches, single-use files, and why we wipe the lamp too.',body:['Metal tools go through a wash, then a sterilising cycle, then into a sealed pouch opened in front of you.','Files and buffers are single-use. You can take yours home.','Tables, lamps and arm rests are wiped between every client.']},
 {id:'p3',t:'Growing out a bitten nail habit over a winter without giving up halfway, and what actually helped our clients',date:'2026-07-02',img:null,ex:'Short BIAB, frequent infills and a glass file in your bag.',body:['Keep the length short at first so the nail has nothing to catch.','Infill every three weeks rather than four.','Carry a glass file — smoothing a snag stops you picking at it.']}];
window.LR33={A,BIZ,FINISHES,FAMILIES,SHADES,NOFIT,CATS,TREAT,TECHS,GALLERY,GTAGS,QUOTES,FIRST,SHELF,HOURS,FAQ,POLICIES,ROLES,POSTS};
})();
