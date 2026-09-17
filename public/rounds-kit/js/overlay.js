

(()=>{'use strict';
const root=document.getElementById('rounds-lab'); if(!root)return;
const $=s=>root.querySelector(s),$$=s=>Array.from(root.querySelectorAll(s));
const stage=$('.lab-stage'),viewport=$('.lab-viewport'),panel=$('.panel'),canvas=$('.fx'),ctx=canvas.getContext('2d');
const ui={recipient:$('[data-recipient]'),sender:$('[data-sender]'),message:$('[data-message]'),duration:$('[data-duration]'),screen:$('[data-screen]'),photoToggle:$('[data-photo-toggle]'),photo:$('[data-photo]'),background:$('[data-background]'),slider:$('input[type=range]'),gift:$('[data-gift]'),alpha:$('[data-opacity]')};
const giftPlayer=new window.RoundsGiftMedia.Player(root);
const GIFTS={heart:{sender:'#91f5ff',recipient:'#ffb1d6',nameLight:'#fff3f7',energyRGB:'82,226,255',src:'assets/gifts/heart/poster.png',rgb:'255,61,120',accent:'#ff507f',caption:'MOMENTUL TĂU.'},crown:{sender:'#9af5ff',recipient:'#ffe094',nameLight:'#fff5db',energyRGB:'83,225,255',src:'assets/gifts/crown/poster.png',rgb:'255,190,77',accent:'#ffcc76',caption:'RESPECT!'},trophy:{sender:'#9af5ff',recipient:'#ffe3a2',nameLight:'#fff8e2',energyRGB:'91,225,255',src:'assets/gifts/trophy/poster.png',rgb:'245,201,117',accent:'#ffe2a1',caption:'SĂRBĂTORIM!'},bolt:{sender:'#ffdf9b',recipient:'#a7f0ff',nameLight:'#f1fdff',energyRGB:'207,144,255',src:'assets/gifts/bolt/poster.png',rgb:'95,222,255',accent:'#7debff',caption:'ENERGIE!'},diamond:{sender:'#ffd99a',recipient:'#9fefff',nameLight:'#f1fdff',energyRGB:'175,128,255',src:'assets/gifts/diamond/poster.png',rgb:'73,215,255',accent:'#16aafa',caption:'STRĂLUCEȘTI!'},star:{sender:'#96f3ff',recipient:'#ffe796',nameLight:'#fff9da',energyRGB:'86,225,255',src:'assets/gifts/star/poster.png',rgb:'255,214,75',accent:'#ffb300',caption:'EȘTI VEDETA!'},fire:{sender:'#96f3ff',recipient:'#ffc384',nameLight:'#fff0db',energyRGB:'94,216,255',src:'assets/gifts/fire/poster.png',rgb:'255,137,44',accent:'#ff510d',caption:'SEARA TA!'},rocket:{sender:'#94f7dc',recipient:'#d4baff',nameLight:'#f6edff',energyRGB:'85,239,211',src:'assets/gifts/rocket/poster.png',rgb:'193,144,255',accent:'#864aff',caption:'LA ÎNĂLȚIME!'},rose:{sender:'#91f5ff',recipient:'#ffb9d4',nameLight:'#fff1f6',energyRGB:'101,230,255',src:'assets/gifts/rose/poster.png',rgb:'255,88,150',accent:'#e52172',caption:'PENTRU TINE!'},champagne:{sender:'#ffe3a8',recipient:'#b2ffdb',nameLight:'#edfff6',energyRGB:'255,204,109',src:'assets/gifts/champagne/poster.png',rgb:'142,244,170',accent:'#30bb8c',caption:'SĂ SĂRBĂTORIM!'}};let giftTheme=GIFTS.crown;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let mode='hall',nativeW=576,nativeH=352,height=611.111,photoURL='',photoGeneration=0,frame=0,playing=false,start=0,time=3,duration=10,completion=null,activeId=null,lastPhase='',clean=false;
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));const ease=x=>1-Math.pow(1-clamp(x),3);const back=x=>{x=clamp(x)-1;return 1+2.70158*x*x*x+1.70158*x*x};

// Page at the authored size: never shrink live text to make it fit.
let fullMessage='',fullRecipient='',fullSender='',messagePages=[''],recipientPages=[''],senderPages=[''],messagePage=-1,recipientPage=-1,senderPage=-1,requestedDuration=10;
function paginate(el,text,box=el){
 const original=text.replace(/\s+/g,' ').trim();if(!original)return [''];
 // Measure text independently of live DOM ink overflow, flex sizing and entry transforms.
 // scrollHeight includes glyph ink in some browsers even when a single line fits.
 const style=getComputedStyle(el),size=parseFloat(style.fontSize)||32;
 const sender=el===$('[data-sender-display]'),paragraph=el===$('.message');
 const fallbackWidth=sender?(mode==='tall'?310:355):mode==='tall'?(paragraph?724:584):(paragraph?563:563);
 let width=Math.max(24,(box.clientWidth||fallbackWidth)-8);
 const spacing=parseFloat(style.letterSpacing)||0;
 const lines=paragraph?2:1;
 ctx.save();ctx.font=`${style.fontWeight||400} ${size}px ${style.fontFamily||'TikTokSans, sans-serif'}`;
 const measure=value=>ctx.measureText(value).width+Math.max(0,Array.from(value).length-1)*spacing;
 if(sender){
  const parent=$('.eyebrow'),gap=parseFloat(getComputedStyle(parent).columnGap)||size*.45;
  const labelWidth=selector=>{const label=$(selector),ls=getComputedStyle(label),font=ctx.font;ctx.font=`${ls.fontWeight||600} ${parseFloat(ls.fontSize)||size*.78}px ${ls.fontFamily||'TikTokSans, sans-serif'}`;const text=label.textContent||'',w=ctx.measureText(text).width+Math.max(0,Array.from(text).length-1)*(parseFloat(ls.letterSpacing)||0);ctx.font=font;return w};
  const available=(parent.clientWidth||(mode==='tall'?584:565))-labelWidth('[data-from]')-labelWidth('[data-for]')-2*gap;width=Math.max(24,available-8)
 }
 function fits(value){
  if(lines===1)return measure(value)<=width;
  let used=1,line='';
  for(const word of value.split(' ')){
   const candidate=line?line+' '+word:word;
   if(measure(candidate)<=width){line=candidate;continue}
   if(line){used++;line=''}
   if(measure(word)<=width){line=word}else{
    for(const char of Array.from(word)){if(line&&measure(line+char)>width){used++;line=''}line+=char}
   }
   if(used>lines)return false;
  }
  return used<=lines;
 }
 const pages=[];let remaining=Array.from(original);
 while(remaining.length){
  let lo=1,hi=remaining.length,best=1;
  while(lo<=hi){const n=(lo+hi)>>1;if(fits(remaining.slice(0,n).join(''))){best=n;lo=n+1}else hi=n-1}
  if(best<remaining.length){let space=-1;for(let i=best-1;i>Math.floor(best*.4);i--)if(/\s/.test(remaining[i])){space=i;break}if(space>0)best=space}
  pages.push(remaining.slice(0,best).join('').trim());remaining=remaining.slice(best);while(remaining[0]===' ')remaining.shift();
 }
 ctx.restore();return pages;
}

function livePages(){
 const hero=$('.hero-text'),msg=$('.message');hero.style.fontSize='';hero.style.letterSpacing='';msg.style.fontSize='';
 recipientPages=paginate(hero,fullRecipient,$('.hero'));messagePages=paginate(msg,fullMessage);senderPages=paginate($('[data-sender-display]'),fullSender);recipientPage=messagePage=senderPage=-1;
 const count=Math.max(recipientPages.length,messagePages.length,senderPages.length);
 duration=Math.min(30,Math.max(requestedDuration,count>1?2+count*3.2+.6:requestedDuration));ui.slider.max=duration;
 drawPageText(time);
}
function drawPageText(t){
 const readingStart=reduce?.45:1.75,readingEnd=duration-.6,span=Math.max(1,readingEnd-readingStart);
 const part=clamp((t-readingStart)/span,0,.999999);
 const ri=Math.min(recipientPages.length-1,Math.floor(part*recipientPages.length));
 const mi=Math.min(messagePages.length-1,Math.floor(part*messagePages.length));
 const si=Math.min(senderPages.length-1,Math.floor(part*senderPages.length));
 if(si!==senderPage){$('[data-sender-display]').textContent=senderPages[si];senderPage=si}
 if(ri!==recipientPage){$('.hero-text').textContent=recipientPages[ri];recipientPage=ri}
 if(mi!==messagePage){$('.message').textContent=messagePages[mi];messagePage=mi}
 // A short fade at page boundaries; the text is stationary during reading.
 const pageOpacity=(count,index)=>{if(reduce||index===0)return 1;const age=(t-readingStart)-index*span/count;return ease(age/.2)};
 return {hero:pageOpacity(recipientPages.length,ri),message:pageOpacity(messagePages.length,mi),sender:pageOpacity(senderPages.length,si)};
}

function phase(s){if(s!==lastPhase){lastPhase=s;$('[data-phase]').textContent=s}}
function size(){nativeW=mode==='hall'?(ui.screen.value==='6'?587:576):mode==='wide'?1920:1080;nativeH=mode==='hall'?352:mode==='wide'?1080:1920;height=1000*nativeH/nativeW;viewport.style.aspectRatio=`${nativeW}/${nativeH}`;stage.style.height=height+'px';stage.style.transform=`scale(${viewport.clientWidth/1000})`;viewport.classList.toggle('portrait-preview',mode==='tall');$('[data-resolution]').textContent=`${nativeW} × ${nativeH} · ${mode==='hall'?'Ecran '+ui.screen.value:'Live'}`;const r=panel.getBoundingClientRect();const pw=mode==='hall'?1000:mode==='wide'?735:790;const ph=mode==='hall'?height:mode==='wide'?126:275;canvas.width=pw;canvas.height=Math.round(ph);fit();draw(time)}
function fit(){if(mode!=='hall'){livePages();return}const el=$('.hero-text'),box=$('.hero');el.style.fontSize='';el.style.letterSpacing='';let n=parseFloat(getComputedStyle(el).fontSize);for(let i=0;i<145 && (el.scrollHeight>box.clientHeight||el.scrollWidth>box.clientWidth);i++){n=Math.max(18,n-1);el.style.fontSize=n+'px';el.style.letterSpacing=Math.max(-3,-n*.025)+'px'}const msg=$('.message');msg.style.fontSize='';let m=parseFloat(getComputedStyle(msg).fontSize);for(let i=0;i<50&&m>11&&msg.scrollHeight>msg.clientHeight+1;i++){m-=.5;msg.style.fontSize=m+'px'}}
function current(){return{gift:ui.gift.value,liveOpacity:Number(ui.alpha.value)/100,recipient:ui.recipient.value.trim(),sender:ui.sender.value.trim(),message:ui.message.value.trim(),duration:Number(ui.duration.value),photoUrl:mode==='hall'&&ui.photoToggle.checked?photoURL:null,showPhoto:mode==='hall'&&ui.photoToggle.checked}}
function apply(d){
 const giftKey=Object.prototype.hasOwnProperty.call(GIFTS,d.gift)?d.gift:'crown';giftTheme=GIFTS[giftKey];giftTheme.src=window.RoundsGiftMedia.posterURL(giftKey);
 $('.gift-art .gift-fallback').src=giftTheme.src;$('.gift-stamp .gift-fallback').src=giftTheme.src;$('.show-intro>b').textContent=giftTheme.caption;
 root.style.setProperty('--gift-rgb',giftTheme.rgb);root.style.setProperty('--gift-secondary-rgb',giftTheme.energyRGB);root.style.setProperty('--sender-color',giftTheme.sender);root.style.setProperty('--recipient-color',giftTheme.recipient);root.style.setProperty('--recipient-light',giftTheme.nameLight);root.dataset.gift=giftKey;
 let alpha=Number(d.liveOpacity);if(!Number.isFinite(alpha))alpha=Number(ui.alpha.value)/100;if(!Number.isFinite(alpha))alpha=.55;alpha=clamp(alpha,.25,.85);
 root.style.setProperty('--live-alpha',alpha);ui.alpha.value=Math.round(alpha*100);$('[data-opacity-value]').textContent=Math.round(alpha*100)+'%';
 const name=String(d.recipient||'Pentru tine').slice(0,60),sender=String(d.sender||'').slice(0,60),msg=String(d.message||'').slice(0,180);requestedDuration=clamp(Number(d.duration)||10,5,30);duration=requestedDuration;fullRecipient=name;fullMessage=msg;fullSender=sender.toLocaleUpperCase('ro-RO');ui.slider.max=duration;$('.hero-text').textContent=name;$('.message').textContent=msg;$('[data-from]').textContent=sender?'DE LA':'';$('[data-sender-display]').textContent=sender.toLocaleUpperCase('ro-RO');$('[data-for]').textContent=mode==='hall'?'':'PENTRU';$('.eyebrow').setAttribute('aria-label',sender?'DE LA '+sender+' PENTRU '+name:'PENTRU '+name);$('.footer span').textContent='DEDICAȚIE LIVE';const show=mode==='hall'&&Boolean(d.photoUrl||d.showPhoto);stage.classList.toggle('has-photo',show);const img=$('.photo img');img.removeAttribute('src');img.style.display='none';$('.photo-placeholder').style.display='flex';if(show&&d.photoUrl){const src=String(d.photoUrl);if(/^(data:image\/(png|jpeg|webp);base64,|blob:|https:\/\/)/i.test(src)){const generation=++photoGeneration;img.onload=()=>{if(generation!==photoGeneration)return;img.style.display='block';$('.photo-placeholder').style.display='none'};img.onerror=()=>{img.style.display='none';$('.photo-placeholder').style.display='flex'};img.src=src}}else{photoGeneration++}fit()}
function updateFeed(){const v=$('[data-feed]');if(!v)return;if(clean||mode==='hall'||ui.background.value==='transparent'){v.pause()}else{v.muted=true;const p=v.play();if(p&&p.catch)p.catch(()=>{})}}
function setMode(m){stop(false);mode=m;stage.className='lab-stage '+mode;$$('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===m)));$('.lab-alpha').hidden=m==='hall';$('[data-screen-label]').hidden=m!=='hall';$('[data-background-label]').hidden=m==='hall';ui.photoToggle.disabled=m!=='hall';ui.photo.disabled=m!=='hall';$('[data-photo-note]').textContent=m==='hall'?'Poza rămâne locală în acest demo.':'Nicio fotografie nu se transmite pe live.';$('.lab-scene').hidden=clean||m==='hall'||ui.background.value==='transparent';$('.lab-scene-label').hidden=$('.lab-scene').hidden;viewport.classList.toggle('checker',!clean&&m!=='hall'&&ui.background.value==='transparent');apply(current());size();time=3;draw(time);updateFeed()}
function giftMotion(t){return reduce?'none':`translateY(${Math.sin(t*2)*2.5}px) rotate(${Math.sin(t*1.3)*2.3}deg)`;}


function drawBase(t){
 if(mode==='hall'){panel.style.boxShadow='';panel.style.transformOrigin='center';}
 if(mode!=='hall'){drawLive(t);return}
 time=clamp(t,0,duration);ui.slider.value=time;$('.lab-time').textContent=`${time.toFixed(1)} / ${duration.toFixed(1)} s`;
 const exit=clamp((time-(duration-.72))/.72),visible=time>0&&time<duration;
 panel.style.opacity=visible?'1':'0';
 const kick=reduce?0:Math.sin((time-2.04)*62)*Math.max(0,1-(time-2.04)/.25)*3;
 panel.style.transform=`translate(${time>=2.04&&time<2.29?kick:0}px,${exit*35}px) scale(${1-exit*.04})`;
 panel.style.clipPath=exit?`inset(${exit*50}% 0 ${exit*50}% 0)`:'none';
 const intro=reduce?1:ease((time-1.83)/.42);
 $('.show-intro').style.clipPath=`inset(0 0 ${intro*100}% 0)`;
 $('.show-intro').style.opacity=reduce?'0':'1';
 $('.show-intro>b').style.transform=`scale(${.9+.1*back((time-.38)/.55)}) translateY(${(1-ease(time/.35))*100}px)`;
 $('.show-intro>b').style.opacity=ease((time-.4)/.2);
 const giftIn=reduce?1:back((time-.08)/.7),giftOut=reduce?1:ease((time-1.76)/.47);
 $('.gift-art').style.opacity=reduce?'0':String(ease((time-.04)/.18)*(1-giftOut));
 $('.gift-art').style.transform=`translateY(${(1-giftIn)*105+Math.sin(time*3.2)*4-giftOut*35}px) rotate(${-7+giftIn*7}deg) scale(${(.25+.75*giftIn)*(1-giftOut*.65)})`;
 $('.gift-aura').style.transform=`scale(${.35+.65*ease(time/.8)}) rotate(${time*17}deg)`;
 $('.gift-aura').style.opacity=String((1-giftOut)*.85);
 $('.gift-stamp').style.opacity=ease((time-2.1)/.4);
 $('.gift-stamp').style.transform=giftMotion(time);
 $('.intro-num').style.transform=`rotate(${-19+time*8}deg) scale(${1+time*.09})`;
 const n=reduce?1:back((time-2.03)/.6);
 $('.hero').style.opacity=time>=2.03?'1':'0';
 $('.hero-text').style.transform=`perspective(800px) translateY(${(1-n)*75}px) rotateX(${(1-n)*-40}deg) scale(${1+(1-n)*1.5})`;
 $('.hero-text').style.filter=`blur(${Math.max(0,1-n)*10}px) drop-shadow(0 4px 12px #0006)`;
 const reveal=ease((time-2.45)/.48),badge=ease((time-2.15)/.4);
 $('.recipient-tag').style.opacity=badge;$('.recipient-tag').style.transform=`translateY(${(1-badge)*-20}px)`;
 $('.message').style.opacity=reveal;$('.message').style.transform=`translateY(${(1-reveal)*45}px)`;
 $('.eyebrow').style.opacity=reveal;
 $('.rule').style.transform=`scaleX(${ease((time-2.26)/.5)})`;
 const photo=ease((time-2.13)/.7);
 $('.photo').style.opacity=photo;$('.photo').style.transform=`perspective(900px) translateX(${(1-photo)*160}px) rotateY(${(1-photo)*-38}deg) scale(${.8+.2*photo})`;
 $('.brand').style.opacity=badge;$('.show-badge').style.opacity=badge;$('.footer').style.opacity=reveal;
 $('.show-plate').style.transform=`scaleX(${reduce?1:back((time-1.97)/.6)})`;
 $('.wing-left').style.transform=`translateX(${(1-ease((time-1.8)/.6))*-100}px)`;
 $('.wing-right').style.transform=`translateX(${(1-ease((time-1.8)/.6))*-100}px)`;
 $('.stage-beams').style.transform=`rotate(${reduce?0:time*2.8}deg)`;
 $('.show-ring').style.transform=`rotate(${reduce?-12:-12+Math.sin(time*.55)*5}deg) scale(${reduce?1:1+Math.sin(time*.7)*.014})`;
 const pulse=reduce?0:Math.max(0,1-Math.abs(time-2.15)/.32)*.65;
 $('.impact-light').style.opacity=pulse;
 $('.progress-line').style.transform=`scaleX(${1-clamp((time-2)/(duration-2.72))})`;
 const shimmer=(time-2.4)*480-350;$('.sweep').style.left=shimmer+'px';$('.sweep').style.opacity=reduce?'0':time>2.4&&time<5.1?'.7':'0';
 drawFX(time);
 phase(time===0?'În așteptare':time>=duration?'Încheiat':exit?'Ieșire':time<2.03?'Anticipare':time<2.5?'Impact':time<3?'Dezvăluire':'Afișare');
}
// Directional light streaks. No polar coordinates or rotating emitter.
function energyBurst(g,cx,cy,age,scale=1){
 if(age<0||age>1.5)return;
 const seed=i=>{const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n)};
 g.save();g.globalCompositeOperation='lighter';g.lineCap='round';
 for(let i=0;i<24;i++){
  const delay=seed(i+80)*.2,a=age-delay,life=.45+seed(i+91)*.7;if(a<0||a>life)continue;
  const side=i%2?1:-1,ox=(seed(i+11)-.5)*90*scale,oy=(seed(i+21)-.5)*100*scale;
  const vx=side*(140+seed(i+31)*260)*scale,vy=(-.35+seed(i+41)*.55)*100*scale;
  const x=cx+ox+vx*a,y=cy+oy+vy*a,len=(.035+seed(i+51)*.08)*(1-a/life);
  g.globalAlpha=Math.pow(1-a/life,1.4)*.85;g.shadowColor=giftTheme.accent;g.shadowBlur=14*scale;
  g.strokeStyle=giftTheme.accent;g.lineWidth=(1.4+seed(i+61)*1.8)*scale;
  g.beginPath();g.moveTo(x-vx*len,y-vy*len);g.lineTo(x,y);g.stroke();
  g.shadowBlur=0;g.strokeStyle='#fff5eb';g.lineWidth=.65*scale;g.stroke();
 }
 g.restore();
}
function drawFX(t){
 const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);if(reduce||t<.05||t>duration-.7)return;
 energyBurst(ctx,w*.5,h*.46,t-2.05,1.25);
 // Two offset edge sweeps frame the dedication without passing over letters.
 const hold=ease((t-2.4)/.55);
 ctx.save();ctx.lineCap='round';ctx.globalCompositeOperation='lighter';
 for(let i=0;i<8;i++){
  const q=((t*.24+i*.173)%1),left=i%2===0,x=left?26+i*5:w-26-i*5,y=h*(1-q),len=24+(i%3)*17;
  ctx.globalAlpha=Math.sin(q*Math.PI)*hold*.5;ctx.shadowBlur=12;ctx.shadowColor=giftTheme.accent;
  ctx.strokeStyle=giftTheme.accent;ctx.lineWidth=i%3===0?2:1;
  ctx.beginPath();ctx.moveTo(x,y+len);ctx.lineTo(x+4,y);ctx.stroke();
 }
 ctx.restore();
}

function premiumFX(t,tall,out){
 const w=canvas.width,h=canvas.height,cx=tall?87:62,cy=tall?85:62,well=tall?178:134;
 ctx.clearRect(0,0,w,h);if(reduce||t<.01||t>=duration)return;
 const rgba=(a)=>`rgba(${giftTheme.rgb},${a})`,glow=(x,y,r,a)=>{const gr=ctx.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,`rgba(255,248,235,${a})`);gr.addColorStop(.14,rgba(a*.85));gr.addColorStop(.5,rgba(a*.22));gr.addColorStop(1,rgba(0));ctx.fillStyle=gr;ctx.fillRect(x-r,y-r,r*2,r*2)};
 ctx.save();ctx.globalCompositeOperation='lighter';
 const peak=Math.max(0,1-Math.abs(t-.77)/.38),exitPeak=Math.sin(clamp((t-duration+.7)/.7)*Math.PI);
 // A short two-tone wash crosses the plate while the name is revealed.
 const bloom=ease((t-.36)/.32)*(1-ease((t-1.08)/.6));
 if(bloom>0){const wash=ctx.createLinearGradient(0,0,w,h);wash.addColorStop(0,`rgba(${giftTheme.rgb},${bloom*.3})`);wash.addColorStop(.42,`rgba(${giftTheme.energyRGB},${bloom*.12})`);wash.addColorStop(1,`rgba(${giftTheme.energyRGB},0)`);ctx.fillStyle=wash;ctx.fillRect(0,0,w,h)}
 ctx.save();ctx.beginPath();ctx.rect(0,0,well,tall?161:h);ctx.clip();glow(cx,cy,tall?114:84,(peak*.55+exitPeak*.35));
 // The gift canvas owns the burst; this layer supplies only depth and plate light.
 const hold=ease((t-1.75)/.6)*(1-out);
 for(let i=0;i<3;i++){const q=((t*.25+i*.317)%1),x=18+(i*47)%(well-25),y=(tall?151:h-10)-q*(tall?141:h-20);ctx.globalAlpha=Math.sin(q*Math.PI)*hold*.5;ctx.fillStyle=i%2?'#fff6df':giftTheme.accent;ctx.fillRect(x,y,1.5,3.2)}
 ctx.restore();ctx.globalAlpha=1;
 // Brief edge illumination opens the plate; it clears before queue handoff.
 if(t>.4&&t<1.6){const q=ease((t-.4)/1.2),len=88;ctx.globalAlpha=Math.sin(q*Math.PI)*.85;ctx.shadowColor=giftTheme.accent;ctx.shadowBlur=8;ctx.strokeStyle=giftTheme.accent;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(q*w-len,1);ctx.lineTo(q*w,1);ctx.moveTo(q*w-len,h-2);ctx.lineTo(q*w,h-2);ctx.stroke()}
 ctx.restore();ctx.globalAlpha=1;
}
function drawLive(t){
 time=clamp(t,0,duration);ui.slider.value=time;$('.lab-time').textContent=`${time.toFixed(1)} / ${duration.toFixed(1)} s`;
 const tall=mode==='tall',en=ease(time/.52),exitStart=duration-.7,ex=ease((time-exitStart)/.7),visible=time>0&&time<duration;
 panel.style.opacity=visible?String(en*(1-ex)):'0';
 const spring=back(time/.65);
 panel.style.transform=reduce?'none':`translateY(${(1-en)*13-ex*5}px) scale(${.975+.025*spring-ex*.018})`;
 panel.style.transformOrigin='12% 60%';
 panel.style.clipPath=reduce?'none':`inset(0 ${(1-en)*100}% 0 0 round ${tall?12:7}px)`;
 const impact=Math.max(0,1-Math.abs(time-.77)/.45),pulse=reduce?.1:.12+impact*.88;
 const exitFlash=reduce?0:Math.sin(ex*Math.PI)*.65,shine=reduce?0:Math.max(impact,exitFlash);
 panel.style.boxShadow=`0 0 ${9+shine*19}px rgba(${giftTheme.rgb},${.07+shine*.28}),inset 0 0 ${16+shine*30}px rgba(${giftTheme.energyRGB},${.025+shine*.1}),0 7px 24px #0003`;
 panel.style.borderColor=`rgba(${giftTheme.rgb},${(.24+shine*.62)*(1-ex)})`;
 const page=drawPageText(time),name=ease((time-(reduce?.15:.87))/.48),msg=ease((time-(reduce?.25:1.53))/.4),sender=ease((time-(reduce?.1:.7))/.34);
 const nameOut=reduce?ex:ease((time-exitStart-.08)/.39),msgOut=reduce?ex:ease((time-exitStart)/.33),senderOut=reduce?ex:ease((time-exitStart-.03)/.32);
 $('.hero').style.opacity=name*page.hero*(1-nameOut);
 $('.hero-text').style.filter=reduce||name===1&&nameOut===0?'none':`blur(${(1-name)*3.5+nameOut*1.5}px)`;
 $('.hero-text').style.transformOrigin='left center';
 $('.hero-text').style.transform=reduce?'none':`translateY(${(1-name)*19-nameOut*8}px) scale(${1+(1-name)*.14})`;
 $('.message').style.opacity=msg*page.message*(1-msgOut);$('.message').style.transform=reduce?'none':`translateY(${(1-msg)*9+msgOut*6}px)`;
 $('.eyebrow').style.opacity=sender*page.sender*(1-senderOut);$('.eyebrow').style.transform=reduce?'none':`translateY(${(1-sender)*-5}px)`;
 $('.rule').style.opacity='0';$('.progress-line').style.opacity='0';
 const stamp=$('.gift-stamp'),charge=ease(time/.59),kick=back((time-.48)/.52),settle=ease((time-1.04)/.54),giftOut=ease((time-exitStart-.08)/.52);
 const scale=time<.48?.42+.38*charge:.8+.43*kick-.23*settle;
 stamp.style.opacity=ease(time/.23)*(1-giftOut);
 stamp.style.transform=reduce?'none':`translate(${(1-charge)*-22+giftOut*14}px,${(1-charge)*16-giftOut*20+Math.sin(time*2)*1.4}px) rotate(${(1-charge)*-12+giftOut*12}deg) scale(${scale*(1+giftOut*.16)})`;
 stamp.style.filter=`drop-shadow(0 0 ${5+impact*14}px rgba(${giftTheme.rgb},${.32+impact*.45}))`;
 $('.live-charge').style.opacity=String(pulse*(1-ex));
 $('.live-charge').style.transform=`scale(${.8+impact*.35})`;
 const sheen=ease((time-.56)/.82),exitSheen=ease((time-exitStart)/.44),sheenPosition=ex?1-exitSheen:sheen;
 $('.live-sheen').style.opacity=reduce?'0':String((ex?Math.sin(exitSheen*Math.PI)*.35:Math.sin(sheen*Math.PI)*.72)*(1-ex));$('.live-sheen').style.transform=`translateX(${-150+sheenPosition*(canvas.width+280)}px) skewX(-20deg)`;
 premiumFX(time,tall,ex);
 phase(time===0?'În așteptare':time>=duration?'Încheiat':ex?'Ieșire':time<.55?'Anticipare':time<1.35?'Impact':time<1.95?'Dezvăluire':'Afișare');
}

// Single animation lifecycle. The host application owns moderation and the queue.
let pausedAt=null,loading=false,generation=0,lastPaint=-Infinity;
function notifyEnd(status){
 const done=completion,detail={id:activeId,status,duration,fallback:giftPlayer.failed};completion=null;activeId=null;
 if(done){root.dispatchEvent(new CustomEvent('rounds:complete',{detail,bubbles:true}));done(detail)}
}
function stop(reset=true){generation++;cancelAnimationFrame(frame);playing=false;loading=false;pausedAt=null;giftPlayer.stop();notifyEnd('cancelled');if(reset)draw(0);$('.lab-pause').textContent='Continuă'}
function draw(t){
 for(const selector of ['.hero','.message','.eyebrow','.gift-stamp','.photo','.brand','.show-badge','.footer','.recipient-tag'])$(selector).style.transform='';
 drawBase(t);giftPlayer.draw(time,duration,mode,playing,reduce);
 if(mode==='hall'){panel.style.borderColor='';$('.rule').style.opacity='1';$('.progress-line').style.opacity='1'}
}
function loop(now){
 if(!playing)return;const t=(now-start)/1000;
 if(t>=duration){draw(duration);playing=false;giftPlayer.stop();notifyEnd('completed');$('.lab-pause').textContent='Continuă';return}
 if(now-lastPaint>=1000/30-.5){lastPaint=now;draw(t)}frame=requestAnimationFrame(loop);
}
function play(d,force=false){
 if(!d||typeof d!=='object')return Promise.reject(new Error('Datele animației lipsesc.'));
 if(completion||playing||loading){if(!force)return Promise.reject(new Error('Animație ocupată. Așteptați finalizarea înainte de play().'));stop()}
 const token=++generation;loading=true;activeId=d.id||null;apply(d);giftPlayer.reserve(root.dataset.gift);draw(0);phase('Pregătire animație');
 return new Promise(resolve=>{
  completion=resolve;
  Promise.all([document.fonts.ready,giftPlayer.preload(root.dataset.gift)]).then(([,bundle])=>{
   if(token!==generation||!completion)return;
   giftPlayer.activate(bundle);fit();loading=false;playing=true;pausedAt=null;start=performance.now();lastPaint=-Infinity;
   $('.lab-pause').textContent='Pauză';draw(0);
   root.dispatchEvent(new CustomEvent('rounds:start',{bubbles:true,detail:{id:activeId,duration,gift:root.dataset.gift,fallback:!bundle.ok}}));
   frame=requestAnimationFrame(loop);
  }).catch(error=>{if(token!==generation)return;loading=false;playing=false;$('.lab-error').textContent=error.message;notifyEnd('error')});
 });
}
function pausePlayback(){if(!playing)return false;cancelAnimationFrame(frame);playing=false;pausedAt=performance.now();giftPlayer.pause();$('.lab-pause').textContent='Continuă';return true}
function resumePlayback(){if(pausedAt===null)return false;start+=performance.now()-pausedAt;pausedAt=null;playing=true;lastPaint=-Infinity;$('.lab-pause').textContent='Pauză';frame=requestAnimationFrame(loop);return true}
function preview(){updateFeed();const d=current();if(!d.recipient||!d.message){$('.lab-error').textContent='Completează numele și mesajul.';return}$('.lab-error').textContent='';play(d,true).catch(error=>{$('.lab-error').textContent=error.message})}
$$('[data-mode]').forEach(b=>b.addEventListener('click',()=>{setMode(b.dataset.mode);preview()}));
ui.screen.addEventListener('change',()=>{stop(false);apply(current());size()});
ui.background.addEventListener('change',()=>setMode(mode));
$('.lab-play').addEventListener('click',preview);$('.lab-pause').addEventListener('click',()=>{if(playing)pausePlayback();else resumePlayback()});
ui.slider.addEventListener('input',()=>{stop(false);draw(Number(ui.slider.value))});
[ui.recipient,ui.sender,ui.message,ui.duration,ui.photoToggle].forEach(el=>el.addEventListener('input',()=>{stop(false);apply(current());draw(3)}));
ui.photo.addEventListener('change',()=>{const f=ui.photo.files[0];if(!f)return;if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>10*1024*1024){$('.lab-error').textContent='Alege JPG, PNG sau WebP, maximum 10 MB.';return}if(photoURL)URL.revokeObjectURL(photoURL);photoURL=URL.createObjectURL(f);ui.photoToggle.checked=true;$('.lab-error').textContent='';stop(false);apply(current());draw(3)});
ui.gift.addEventListener('change',preview);
ui.alpha.addEventListener('input',()=>{root.style.setProperty('--live-alpha',Number(ui.alpha.value)/100);$('[data-opacity-value]').textContent=ui.alpha.value+'%'});
const params=new URLSearchParams(location.search);clean=params.get('clean')==='1';
if(clean){root.classList.add('clean');document.documentElement.style.background='transparent';document.body.style.cssText='margin:0;background:transparent;overflow:hidden';const f=params.get('format');ui.screen.value=f==='hall6'?'6':'1';mode=f==='wide'?'wide':f==='tall'?'tall':'hall'}
setMode(mode);if(clean)draw(0);new ResizeObserver(size).observe(viewport);
const ready=document.fonts.ready.then(()=>{fit();draw(time)});
window.RoundsAnimation={version:'1.0.0',ready,play:d=>play(d),stop:()=>stop(),pause:pausePlayback,resume:resumePlayback,
 preload:gift=>giftPlayer.preload(gift).then(b=>({gift:b.key,ready:b.ok})),
 setFormat:f=>{if(!['hall1','hall6','wide','tall'].includes(f))throw new Error('Format invalid');ui.screen.value=f==='hall6'?'6':'1';setMode(f.startsWith('hall')?'hall':f);if(clean)draw(0)},
 getState:()=>({format:mode==='hall'?(ui.screen.value==='6'?'hall6':'hall1'):mode,time,duration,playing,loading,busy:Boolean(completion),id:activeId,paused:pausedAt!==null,fallback:giftPlayer.failed,recipientPages:recipientPages.length,senderPages:senderPages.length,messagePages:messagePages.length}),
 seek:t=>{stop(false);draw(t)},dispose:()=>{stop();giftPlayer.dispose();if(photoURL)URL.revokeObjectURL(photoURL)}
};
document.documentElement.dataset.ready='1';
if(!clean&&!reduce)setTimeout(preview,300);if(clean&&params.get('demo')==='1')setTimeout(preview,300);
})();
