(function() {

  const REVIEWS_DATA = [
    { author: 'Mary Barnhill', rating: 5.0, body: 'Dependable Painting did a great job of transforming my house!! Outstanding paint job!!' },
    { author: 'Adam Lineberry', rating: 5.0, body: 'Contacted several painters for quotes and Dependable Painting LLC gave me the most reasonable one... They showed great attention to detail and their lines were razor sharp all throughout the house. They even went above and beyond and painted some spots my children left on the roof. On time, efficient, professional—highly recommend Alex and Megan!' },
    { author: 'Jeannie Bernardo', rating: 5.0, body: 'Very meticulous. My house has big dormers—no problem for them. It looks great and I am very pleased. Will use them again.' },
    { author: 'Gary Dunn', rating: 5.0, body: 'Professional and a pleasure to work with. Excellent work, on time each day and completed the job as promised.' },
    { author: 'Joseph Guarino', rating: 5.0, body: "Great working with Alex and his crew. Accommodating with scheduling and did a great job. We highly recommend and will use again." },
    { author: 'Sam Clunan', rating: 5.0, body: 'Very responsive. VERY trustworthy!' },
    { author: 'Bonnie Therrell', rating: 5.0, body: 'Very well pleased with the job they did.' },
    { author: 'Jeri Harrison', rating: 5.0, body: 'Excellent customer service, very professional staff, high quality of work. And DEPENDABLE like the name.' },
    { author: 'Kari Cramblitt', rating: 5.0, body: 'Wonderful experience! Very respectful and hardworking people. Will definitely be using them again.' },
    { author: 'Susan Turner', rating: 4.5, body: "They arrived when they said they would and the finished product was perfect. Highly recommend for any painting needs." },
    { author: 'Jena Cramblitt', rating: 4.5, body: 'Fantastic people! Went above and beyond—interior and exterior both look great. Will hire again.' },
    { author: 'Lisa Brunies', rating: 4.5, body: 'The name says it all—very dependable. Helped fix a mess left by another painter. Professional, polite, and skilled.' },
    { author: 'Loren Barraza', rating: 4.5, body: 'Absolutely fantastic and great communicators. Exterior looks amazing—fair pricing and quick turnaround.' },
    { author: 'Mary Godwin', rating: 4.4, body: 'Interior plus doors and porch—excellent work ethic, professional, punctual and personable.' },
    { author: 'kristmas1000', authorDisplay: 'Kristmas1000', rating: 4.0, body: 'Highly recommend. Fast, efficient, and walls look great.' },
    { author: 'Valery Smith', rating: 4.0, body: 'Incredible job. Extensive patch work + popcorn removal done perfectly. Prep, mud work, and finish all excellent.' },
    { author: 'Jane Penton', rating: 4.0, body: 'Used them twice—interior and exterior. Dependable, respectful, very pleased. Will use again.' },
    { author: 'Gina Lanaux', rating: 4.0, body: 'Easy to work with, highly professional, communicate well, fast and reasonable.' },
    { author: 'Patty Rowland', rating: 4.0, body: 'Whole interior repaint. Fast yet very good. Professional, respectful, neat—thrilled with the results.' }
  ];

  window.REVIEWS = Array.isArray(window.REVIEWS) ? window.REVIEWS : REVIEWS_DATA;

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function ready(fn) { 
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', fn); 
    else fn(); 
  }

  function initReviewsSwiper() {
    const swiper = document.querySelector('#reviews-swiper');
    if (!swiper) return;
    
    const wrapper = swiper.querySelector('.swiper-wrapper');
    if (!wrapper) return;
    
    // Populate review slides
    const list = window.REVIEWS;
    if (list && list.length) {
      list.forEach(r => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = `<article class="review-card"><p class="review-text">"${esc(r.body)}"</p><footer class="review-meta">— ${esc(r.author)}</footer></article>`;
        wrapper.appendChild(slide);
      });
    }
    
    // Initialize Swiper
    function tryInit(attempt = 0) {
      if (typeof window.Swiper === 'undefined') {
        if (attempt < 40) return setTimeout(() => tryInit(attempt + 1), 125);
        return;
      }
      
      try {
        new window.Swiper('#reviews-swiper', {
          loop: true,
          slidesPerView: 1,
          spaceBetween: 16,
          centeredSlides: true,
          autoplay: { delay: 4500, disableOnInteraction: true },
          keyboard: { enabled: true },
          navigation: { nextEl: '.reviews-next', prevEl: '.reviews-prev' },
          pagination: { el: '.reviews-dots', clickable: true },
          grabCursor: true
        });
      } catch(e) {
        console.error('Reviews Swiper init failed:', e);
      }
    }
    tryInit();
  }

  function initGallerySwiper() {
    const gallery = document.querySelector('#gallery-swiper');
    if (!gallery) return;
    
    function tryInit(attempt = 0) {
      if (typeof window.Swiper === 'undefined') {
        if (attempt < 40) return setTimeout(() => tryInit(attempt + 1), 120);
        return;
      }
      
      try {
        new window.Swiper('#gallery-swiper', {
          loop: true,
          slidesPerView: 1,
          spaceBetween: 16,
          autoplay: { delay: 3800, disableOnInteraction: true },
          keyboard: { enabled: true },
          navigation: { nextEl: '.gallery-next', prevEl: '.gallery-prev' },
          pagination: { el: '.gallery-dots', clickable: true },
          breakpoints: {
            640:  { slidesPerView: 2, spaceBetween: 14 },
            1024: { slidesPerView: 3, spaceBetween: 16 }
          },
          grabCursor: true
        });
      } catch(e) {
        console.error('Gallery Swiper init failed:', e);
      }
    }
    tryInit();
  }

  ready(() => {
    initReviewsSwiper();
    initGallerySwiper();
  });
})();
