(function(){
const A='assets/32/';
const PH={brick:A+'chair-brick.jpg',scissors:A+'cut-scissors.jpg',shave:A+'man-chair.jpg',dim:A+'chairs-dim.jpg',classic:A+'shop-classic.jpg',silver:A+'chair-silver.jpg',pendant:A+'pendant-salon.jpg'};
const BARBERS=[
 {id:'dev',n:'Dev Okafor',mono:'DO',role:'Fades and short back and sides',yrs:9,cuts:['fade','scissor'],q:'Qualified barber, Level 3 (Sample)',bio:'Dev has cut in the shop since the day it opened. Clean fades, sharp lines, and he will tell you honestly if a style will not sit with your crown.',slots:['10:15','11:40','15:20','17:50'],work:[PH.scissors,PH.brick],day:'Tue–Sat'},
 {id:'marta',n:'Marta Lind',mono:'ML',role:'Scissor cuts and longer hair',yrs:12,cuts:['scissor'],q:'Qualified barber and stylist (Sample)',bio:'Marta trained as a hairdresser before she picked up clippers. She does the longer, softer cuts and the grow-outs most shops send away.',slots:['12:30','14:00','16:45'],work:[PH.classic,PH.pendant],day:'Mon–Fri'},
 {id:'ollie',n:'Ollie Brandt',mono:'OB',role:'Hot towel shaves and beards',yrs:7,cuts:['shave','beard'],q:'Qualified barber, wet-shave certified (Sample)',bio:'Ollie runs the shave chair. Hot towels, a proper lather and a straight razor, at a pace that lets you nearly fall asleep.',slots:['10:00','13:15'],work:[PH.shave,PH.silver],day:'Wed–Sun'},
 {id:'kwame',n:'Kwame Asante',mono:'KA',role:'Curly and textured hair',yrs:6,cuts:['fade','beard'],q:'Qualified barber, Level 3 (Sample)',bio:'Kwame cuts curls dry and in their natural shape, so what you see in the mirror is what you get after a wash.',slots:[],work:[PH.dim,PH.scissors],day:'Thu–Sun'}
];
const CATS=[
 {id:'cuts',t:'Cuts',items:[
  {id:'fade',n:'Skin fade',min:45,p:32,d:'Clippers down to the skin, blended up into length on top.',detail:true},
  {id:'scissor',n:'Scissor cut',min:45,p:34,d:'All scissors, for longer or softer styles.',detail:true},
  {id:'classic',n:'Short back and sides',min:30,p:26,d:'Clipper sides, scissor top, tidy neckline.'},
  {id:'buzz',n:'Buzz cut',min:20,p:18,d:'One guard all over, lined up.'},
  {id:'kids',n:'Under 12s',min:30,p:18,d:'Any cut, with a bit more patience.'}]},
 {id:'beard',t:'Beard and shave',items:[
  {id:'shave',n:'Hot towel shave',min:40,p:30,d:'Hot towels, lather, straight razor, cold towel to finish.',detail:true},
  {id:'beard',n:'Beard shape-up',min:25,p:18,d:'Trim, line and oil.',detail:true},
  {id:'combo',n:'Cut and beard',min:60,p:44,d:'Any cut plus a beard shape-up.'}]},
 {id:'extra',t:'Extras',items:[
  {id:'line',n:'Line-up only',min:15,p:12,d:'Edges and neck between cuts.'},
  {id:'wash',n:'Wash and style',min:15,p:10,d:'Add to any cut.'}]}
];
const SVC={
 fade:{img:PH.scissors,alt:'Barber working on a client with scissors and comb',what:['We start with a quick chat in the chair: how high, how short, and how you wear it day to day.','Clippers take the sides down to the skin and we blend upward guard by guard until there is no line.','The top is cut to match, then a straight-razor line-up and a mirror check from the back.'],after:'A skin fade grows out fast. Most regulars come back every 2 to 3 weeks; a line-up in between keeps it sharp.',by:['dev','kwame']},
 scissor:{img:PH.classic,alt:'Black and white photo of a busy barbershop',what:['Hair is cut damp, all with scissors, so it falls naturally.','We take weight out rather than length when you are growing it out.','Finished with a blow-dry and a little product if you want it.'],after:'Every 4 to 6 weeks. Ask about a free fringe trim in between.',by:['marta','dev']},
 shave:{img:PH.shave,alt:'Client reclined in a barber chair for a shave',what:['Two hot towels open the skin while the lather warms.','A straight razor, with the grain then across, with a fresh blade for every client.','Cold towel and balm to close it all up.'],after:'Skip a shave for a day before if your skin is sensitive. Tell us about allergies when you book.',by:['ollie']},
 beard:{img:PH.silver,alt:'Empty chrome and leather barber chair',what:['We shape to your jaw and neckline, not a template.','Clipper trim, scissor detail, razor line on the cheeks.','Finished with oil; we will tell you which one, but you do not have to buy it.'],after:'Every 2 to 4 weeks. Grow-outs are free if you book a shape-up after.',by:['ollie','kwame']}
};
const GALLERY=[
 {img:PH.scissors,t:'Fade and textured top',tag:'Fades',alt:'Barber cutting a client\'s hair with scissors'},
 {img:PH.shave,t:'Hot towel shave',tag:'Shaves',alt:'Client reclined for a shave'},
 {img:PH.brick,t:'The front room',tag:'Shop',alt:'Three leather barber chairs in front of a brick wall'},
 {img:PH.classic,t:'Saturday morning',tag:'Scissor',alt:'Black and white barbershop with clients in chairs'},
 {img:PH.dim,t:'After hours',tag:'Shop',alt:'Ornate barber chairs in warm light'},
 {img:PH.silver,t:'Chair three',tag:'Shaves',alt:'Chrome barber chair in a dark room'},
 {img:PH.pendant,t:'The long room',tag:'Shop',alt:'A row of barber chairs under pendant lamps'}
];
const GTAGS=['All','Fades','Scissor','Shaves','Shop','Colour'];
const PLANS=[
 {id:'cut',n:'Monthly cut',p:29,per:'month',inc:['One cut a month, any barber','Free line-up between cuts','10% off products'],note:'Saves about $3 a month on a skin fade (Sample).'},
 {id:'cutbeard',n:'Cut and beard',p:39,per:'month',inc:['One cut and one beard shape-up a month','Priority on Saturday slots','Free line-up between cuts','10% off products'],note:'Saves about $5 a month (Sample).',feat:true}
];
const PRODUCTS=[
 {n:'Matte clay',size:'75 ml',p:16,d:'Strong hold, no shine. For textured short cuts.'},
 {n:'Sea salt spray',size:'200 ml',p:14,d:'Light hold and volume for longer tops.'},
 {n:'Beard oil',size:'30 ml',p:15,d:'Cedar and orange. Two drops is plenty.'},
 {n:'Shave balm',size:'100 ml',p:13,d:'For after the shave chair, or your own.'}
];
const QUOTES=[
 {q:'Dev asked how I actually do my hair in the morning, then cut it so that works. Nobody had ever asked.',who:'Sam, skin fade'},
 {q:'I walked in on a Tuesday lunch break and was out in forty minutes. Chair three is real.',who:'Femi, short back and sides'}
];
const FAQ=[
 {q:'Do you take walk-ins?',a:'Yes. Chair three is kept free for walk-ins every day. The chair board shows the rough wait.'},
 {q:'Is there a deposit?',a:'Bookings over 40 minutes take a $10 deposit (Sample), taken off your bill on the day.'},
 {q:'What if I am late?',a:'Up to 10 minutes late and we will still do the full cut. After 15 minutes we may need to shorten it or move you.'},
 {q:'How do I cancel?',a:'Cancel or move a booking up to 12 hours before at no cost, from the link in your confirmation text.'},
 {q:'Do you cut curly and textured hair?',a:'Yes, every barber does, and Kwame specialises in it.'},
 {q:'Can I pause Cut Club?',a:'Pause for up to two months a year, or cancel with 30 days\' notice.'}
];
const POLICIES=[
 {t:'Cancellation',d:'Cancel or move a booking up to 12 hours before at no cost. Later than that, or a no-show, keeps the deposit.'},
 {t:'Deposit',d:'Services over 40 minutes and all Saturday bookings take a $10 deposit (Sample), taken off your bill.'},
 {t:'Late arrival',d:'We hold your slot for 15 minutes. Arrive later and we may shorten the service or move you to the next free time.'},
 {t:'Consultation',d:'Every first visit starts with a short consultation in the chair. For shaves, tell us about skin conditions or allergies.'},
 {t:'Walk-ins',d:'Chair three is kept free for walk-ins. Walk-ins are first come, first served; the board shows a rough wait.'},
 {t:'Children',d:'Under 12s are welcome with an adult who stays in the shop.'},
 {t:'Vouchers',d:'Gift vouchers last 12 months and cover any service or product. They cannot be swapped for cash.'}
];
const HOURS=[['Mon','10:00–18:00'],['Tue','10:00–18:00'],['Wed','10:00–19:00'],['Thu','10:00–20:00'],['Fri','09:00–20:00'],['Sat','08:00–17:00'],['Sun','11:00–16:00']];
const POSTS=[
 {id:'p1',t:'How often should you get a skin fade?',date:'2026-09-30',img:PH.scissors,alt:'Barber cutting hair',body:['A skin fade looks its best for about ten days. After two weeks the line softens; after three it is a different haircut.','Most of our regulars come every two to three weeks. If that is too often, book a line-up in between: fifteen minutes and it buys you another week.']},
 {id:'p2',t:'Five things to tell your barber before the first cut',date:'2026-08-14',img:PH.brick,alt:'Barber chairs in front of a brick wall',body:['How you wear it in the morning. What you hated about your last cut. Whether you use product. How long you want between visits. And a photo, if you have one.','That is all the consultation is. It takes two minutes and saves most of the bad haircuts we hear about.']},
 {id:'p3',t:'Why we keep the third chair free every single day, even on our busiest Saturdays, and what happens when it fills up',date:'2026-06-02',img:'',alt:'',body:['We opened with three chairs and a rule: one is always for walk-ins. Some days it is empty for an hour. Most days it is not.','When chair three fills, the board shows the wait. If it is longer than you have, leave your name and number and we will text when it is your turn.']}
];
window.TC32={A,PH,BARBERS,CATS,SVC,GALLERY,GTAGS,PLANS,PRODUCTS,QUOTES,FAQ,POLICIES,HOURS,POSTS,
 BIZ:{n:'Third Chair',area:'Market Quarter',addr:'14 Tanner Row, Market Quarter (Sample)',phone:'+1 555 0132 (Sample)',email:'hello@thirdchair.example',since:2017}};
})();
