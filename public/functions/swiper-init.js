import Swiper from 'swiper';

export function initCarousels() {
  new Swiper('#reviews-swiper', {
    loop: true,
    slidesPerView: 1,
    spaceBetween: 16,
    a11y: true,
    keyboard: { enabled: true },
    autoplay: { delay: 5000, disableOnInteraction: true },
    navigation: { nextEl: '.reviews-next', prevEl: '.reviews-prev' },
    pagination: { el: '.reviews-dots', clickable: true }
  });

  new Swiper('#gallery-swiper', {
    loop: true,
    slidesPerView: 1,
    spaceBetween: 10,
    a11y: true,
    keyboard: { enabled: true },
    autoplay: { delay: 4000, disableOnInteraction: true },
    navigation: { nextEl: '.gallery-next', prevEl: '.gallery-prev' },
    pagination: { el: '.gallery-dots', clickable: true },
    breakpoints: {
      640:  { slidesPerView: 2, spaceBetween: 12 },
      1024: { slidesPerView: 3, spaceBetween: 16 }
    }
  });
}
