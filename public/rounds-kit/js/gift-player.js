/* 12 ROUNDS prerendered gift playback. No WebGL, no geometry, no queue. */
(function(scope){'use strict';
 const source=document.currentScript&&document.currentScript.src;
 const base=scope.ROUNDS_ASSET_BASE?new URL(scope.ROUNDS_ASSET_BASE,document.baseURI):new URL('../assets/gifts/',source||location.href);
 const KEYS=['crown','heart','trophy','bolt','diamond','star','fire','rocket','rose','champagne'];
 const LENGTH={intro:2.4,loop:3.2,outro:.7};
 function timeline(t,duration){
  const hold=Math.max(.1,duration-LENGTH.intro-LENGTH.outro),cycles=Math.max(1,Math.round(hold/LENGTH.loop)),rate=cycles*LENGTH.loop/hold;
  if(t<LENGTH.intro)return{phase:'intro',time:Math.max(0,t),rate:1};
  if(t<duration-LENGTH.outro)return{phase:'loop',time:((t-LENGTH.intro)*rate)%LENGTH.loop,rate};
  return{phase:'outro',time:Math.max(0,Math.min(LENGTH.outro-1/30,t-duration+LENGTH.outro)),rate:1};
 }
 class Player{
  constructor(root){this.root=root;this.cache=new Map();this.active=null;this.requested=null;this.playEpoch=0;this.phase=null;this.currentVideo=null;this.failed=false;this.destroyed=false;this.group=document.createElement('div');this.group.className='gift-media';this.group.setAttribute('aria-hidden','true')}
  reserve(key){this.requested=KEYS.includes(key)?key:'crown'}
  async preload(key){
   if(!KEYS.includes(key))key='crown';if(this.cache.has(key))return this.cache.get(key).ready;
   const bundle={key,videos:{},ok:false,loading:true,ready:null};this.cache.set(key,bundle);
   bundle.ready=Promise.all(Object.keys(LENGTH).map(phase=>new Promise(resolve=>{
    const v=document.createElement('video');bundle.videos[phase]=v;v.muted=true;v.defaultMuted=true;v.playsInline=true;v.preload='auto';v.loop=phase==='loop';v.setAttribute('playsinline','');v.setAttribute('muted','');v.setAttribute('aria-hidden','true');v.src=new URL(key+'/'+phase+'.webm',base).href;
    let done=false;const finish=ok=>{if(done)return;done=true;clearTimeout(timer);v.removeEventListener('loadeddata',loaded);v.removeEventListener('error',failed);resolve(ok)};
    const loaded=()=>finish(true),failed=()=>finish(false),timer=setTimeout(()=>finish(false),8000);
    v.addEventListener('loadeddata',loaded);v.addEventListener('error',failed);v.load();if(v.readyState>=2)finish(true);
   }))).then(ok=>{bundle.loading=false;bundle.ok=ok.every(Boolean);if(this.destroyed)return bundle;if(!bundle.ok)this.root.dispatchEvent(new CustomEvent('rounds:asset-error',{bubbles:true,detail:{gift:key,reason:'Media unavailable; static poster used.'}}));this.trim(key);return bundle});
   return bundle.ready;
  }
  trim(keep){for(const [key,b]of this.cache){if(this.cache.size<=2)break;if(key===keep||key===this.requested||b===this.active||b.loading)continue;for(const v of Object.values(b.videos)){v.pause();v.removeAttribute('src');v.load()}this.cache.delete(key)}}
  activate(bundle){this.pause();this.active=bundle;this.requested=null;this.phase=null;this.currentVideo=null;this.failed=!bundle||!bundle.ok;this.group.replaceChildren(...(bundle?Object.values(bundle.videos):[]));this.root.classList.remove('has-gift-media');if(bundle){for(const v of Object.values(bundle.videos)){v.style.display='none';try{v.currentTime=0}catch(e){}}this.trim(bundle.key)}}
  pause(){this.playEpoch++;if(this.active)for(const v of Object.values(this.active.videos))v.pause()}
  stop(){this.pause();this.requested=null;this.phase=null;this.currentVideo=null;this.root.classList.remove('has-gift-media')}
  draw(t,duration,mode,running,reduced){
   const photoOnly=mode==='hall'&&t>=2.1&&this.root.querySelector('.lab-stage').classList.contains('has-photo');
   if(this.destroyed||!this.active||this.active.key!==this.root.dataset.gift||this.failed||reduced||photoOnly||t<=0||t>=duration){this.pause();this.root.classList.remove('has-gift-media');return}
   const slot=this.root.querySelector(mode==='hall'&&t<2.1?'.gift-art':'.gift-stamp');if(this.group.parentNode!==slot)slot.appendChild(this.group);
   const state=timeline(t,duration),v=this.active.videos[state.phase],changed=this.phase!==state.phase;
   if(changed){this.playEpoch++;if(this.currentVideo){this.currentVideo.pause();this.currentVideo.style.display='none'}this.phase=state.phase;this.currentVideo=v;v.style.display='block'}
   v.playbackRate=state.rate;
   const drift=Math.abs(v.currentTime-state.time),wrap=state.phase==='loop'&&Math.abs(drift-LENGTH.loop)<.12;
   if((changed&&state.time>1/30)||(!wrap&&drift>(running?.18:1/60))){try{v.currentTime=state.time}catch(e){}}
   this.root.classList.add('has-gift-media');
   if(running&&v.paused){const epoch=this.playEpoch,bundle=this.active,p=v.play();if(p&&p.catch)p.catch(error=>{if(this.destroyed||epoch!==this.playEpoch||this.active!==bundle||this.currentVideo!==v||error&&error.name==='AbortError')return;this.failed=true;this.pause();this.root.classList.remove('has-gift-media');this.root.dispatchEvent(new CustomEvent('rounds:asset-error',{bubbles:true,detail:{gift:bundle.key,reason:'Playback rejected; static poster used.'}}))})}
   if(!running&&!v.paused)v.pause();
  }
  dispose(){this.stop();this.destroyed=true;for(const b of this.cache.values())for(const v of Object.values(b.videos)){v.pause();v.removeAttribute('src');v.load()}this.cache.clear();this.group.remove()}
 }
 scope.RoundsGiftMedia={Player,timeline,keys:KEYS,phaseDurations:LENGTH,posterURL:key=>new URL((KEYS.includes(key)?key:'crown')+'/poster.png',base).href};
})(window);
