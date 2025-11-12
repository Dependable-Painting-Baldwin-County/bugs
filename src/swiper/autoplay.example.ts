import { createAutoplay, SwiperAutoplayController, AutoplayConfig, SwiperLike } from './autoplay';

// This is a lightweight example assuming Swiper is already instantiated elsewhere.
// Replace the below mock with actual Swiper instance if integrating directly.

// Minimal mock for demonstration / testing without real Swiper dependency.
class MockSwiper implements SwiperLike {
  slides: HTMLElement[] = Array.from({ length: 3 }, (_, i) => {
    const el = document.createElement('div');
    el.className = 'swiper-slide';
    el.textContent = `Slide ${i + 1}`;
    if (i === 1) {
      // override second slide delay
      el.setAttribute('data-autoplay-delay', '5000');
    }
    return el;
  });
  activeIndex = 0;
  isBeginning = true;
  isEnd = false;
  loop = false;
  rewind = true;
  el: HTMLElement = document.createElement('div');
  speed = 400;
  constructor() {
    this.el.className = 'swiper';
    this.slides.forEach(s => this.el.appendChild(s));
    document.body.appendChild(this.el);
  }
  slideNext = () => {
    this.activeIndex = (this.activeIndex + 1) % this.slides.length;
    this.isBeginning = this.activeIndex === 0;
    this.isEnd = this.activeIndex === this.slides.length - 1;
  };
  slidePrev = () => {
    this.activeIndex = (this.activeIndex - 1 + this.slides.length) % this.slides.length;
    this.isBeginning = this.activeIndex === 0;
    this.isEnd = this.activeIndex === this.slides.length - 1;
  };
}

// Example emit function (could integrate with an event bus)
function emit(event: string, ...payload: unknown[]) {
  // eslint-disable-next-line no-console
  console.log('[autoplay event]', event, ...payload);
}

export function initExampleAutoplay(): SwiperAutoplayController {
  const swiper = new MockSwiper();
  const config: AutoplayConfig = {
    enabled: true,
    delay: 3000,
    pauseOnMouseEnter: true,
    disableOnInteraction: false,
    rewind: true,
  } as any; // additional properties may exist externally

  // Create controller
  const controller = createAutoplay(swiper, config, emit);

  // Patch in slideChange hook simulation
  setInterval(() => controller.onSlideChange(), 1000);

  return controller;
}

// Auto-run when loaded in a browser environment
if (typeof window !== 'undefined') {
  initExampleAutoplay();
}