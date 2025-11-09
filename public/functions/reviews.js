// Centralized reviews + gallery + Swiper setup
/**
 * Global declarations for linting (non-module script)
 * @typedef {{name:string;rating:number;comment:string;date?:string}} Review
 * @typedef {{el:HTMLElement}} SwiperInstance
 * @typedef {new (selector:string, opts:any) => SwiperInstance} SwiperConstructor
 * @type {any}
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var __globals;
// Declare known globals for TypeScript when type-checking JS
/* global Swiper */
(function(){
  /** @typedef {{ body:string, author:string, service?:string }} Review */
  /** @type {Review[]} */
  /** @type {any} */(window)['REVIEWS'] = Array.isArray(/** @type {any} */(window)['REVIEWS']) ? /** @type {any} */(window)['REVIEWS'] : []; //
  /** Swiper global (from CDN) */
  // eslint-disable-next-line no-unused-vars
  /** @type {SwiperConstructor | undefined} */
  const SwiperCtor = /** @type {any} */(window)['Swiper']; //
  // Small HTML escaper to prevent accidental injection in dynamic markup.
  /** @param {any} v */
  function esc(v){ //
    return String(v == null ? '' : v)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;'); //
  }

  function initReviews(){ //
    if(typeof window === 'undefined'){ return; } //
  const existing = document.querySelector('#reviews .testimonial-swiper'); //
  /** @type {HTMLElement|null} */
  let host = existing ? /** @type {HTMLElement} */(existing) : null; //
    // If no #reviews section exists, dynamically create one (less common, but provides fallback)
    if(!host){ //
      const sec=document.createElement('section'); //
      sec.id='reviews'; //
      sec.className='section-dark'; //
      sec.setAttribute('aria-labelledby','reviews-heading'); //
      sec.innerHTML='<h2 id="reviews-heading" class="section-title">What Our Clients Say</h2>' +
        '<div class="swiper testimonial-swiper" aria-label="Client testimonials"><div class="swiper-wrapper"></div><div class="swiper-pagination" aria-hidden="true"></div><button class="swiper-button-prev reviews-prev" aria-label="Previous review"></button><button class="swiper-button-next reviews-next" aria-label="Next review"></button></div>'; //
      document.body.appendChild(sec); //
      host=sec.querySelector('.testimonial-swiper'); //
    }
    if(!host) return; //
  const wrap = host ? host.querySelector('.swiper-wrapper') : null; //
    if(!wrap) return; //
    // Add fallback horizontal scroll style while waiting for Swiper
    host.classList.add('dp-swiper-pending'); //
    wrap.innerHTML=''; //
  /** @type {any[]} */
  /** @type {Review[]} */
  const list = Array.isArray(/** @type {any} */(window)['REVIEWS']) ? /** @type {Review[]} */(/** @type {any} */(window)['REVIEWS']) : []; //
    if(!list.length){ //
      const empty=document.createElement('div'); //
      empty.className='swiper-slide'; //
      empty.innerHTML='<article class="review-card"><p>No reviews available yet.</p></article>'; //
      wrap.appendChild(empty); //
    } else {
  list.forEach((r)=>{ //
        const slide=document.createElement('div'); //
        slide.className='swiper-slide'; //
        // Use innerHTML with escaped content
        slide.innerHTML=`<article class="review-card"><p>"${esc(r.body)}"</p><p class="review-author">- ${esc(r.author)}${r.service? ' &middot; ' + esc(r.service): ''}</p></article>`; //
        wrap.appendChild(slide); //
      });
    }

  /** @param {number} attempt */
  function trySwiper(attempt=0){ //
  if(typeof SwiperCtor === 'undefined'){ //
        if(attempt<40) return setTimeout(()=>trySwiper(attempt+1), 125); // retry up to ~5s //
  if(host) host.classList.remove('dp-swiper-pending'); //
        return; // graceful fallback (scrollable list) //
      }
  if(host && host.dataset && host.dataset.swiperInit==='1') return; // already initialized //
  if(host && host.dataset) host.dataset.swiperInit='1'; //
  host && host.classList.remove('dp-swiper-pending'); //
      try {
  // Swiper global expected from CDN script
  if(SwiperCtor) new SwiperCtor('.testimonial-swiper',{ //
          slidesPerView:1.1, //
          spaceBetween:16, //
          pagination:{ el:'.testimonial-swiper .swiper-pagination', clickable:true }, //
          navigation:{ nextEl:'.testimonial-swiper .reviews-next', prevEl:'.testimonial-swiper .reviews-prev' }, //
          autoplay:{ delay:5000, disableOnInteraction:false }, //
          breakpoints:{640:{slidesPerView:2,spaceBetween:18},1024:{slidesPerView:3,spaceBetween:22}}, //
          keyboard:{ enabled:true } //
        });
      } catch(e){ //
        console.error('Swiper init failed:', e); //
      }
    }
    trySwiper(); //
  }

  /** @param {number} attempt */
  function initGallery(attempt=0){ //
  const gallery=document.querySelector('.gallery-swiper'); //
    if(!gallery) return; //
  if(gallery && gallery instanceof HTMLElement && gallery.dataset && gallery.dataset.initialized==='true') return; //
  if(typeof SwiperCtor === 'undefined'){ //
      if(attempt<40) return setTimeout(()=>initGallery(attempt+1),120); //
      return; // fallback: static layout //
    }
  if(gallery && gallery instanceof HTMLElement && gallery.dataset) gallery.dataset.initialized='true'; //
    try {
  if(SwiperCtor) new SwiperCtor('.gallery-swiper',{ //
        loop:true, //
        slidesPerView:1, //
        centeredSlides:false, //
        spaceBetween:0, //
        effect:'fade', //
        fadeEffect:{ crossFade:true }, //
        autoplay:{ delay:4500, disableOnInteraction:false }, //
        pagination:{ el:'.gallery-swiper .swiper-pagination', clickable:true }, //
        navigation:{ nextEl:'.gallery-swiper .swiper-button-next', prevEl:'.gallery-swiper .swiper-button-prev' }, //
        keyboard:{ enabled:true } //
      });
    } catch(e){ console.error('Gallery Swiper init failed:', e); } //
  }

  // initFAQ function REMOVED

  /** @param {() => void} fn */
  function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', fn); else fn(); } //
  ready(()=>{ initReviews(); initGallery(); /* initFAQ() call REMOVED */ }); //
})();