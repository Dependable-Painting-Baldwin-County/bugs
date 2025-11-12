/**
 * Modern, strongly-typed autoplay controller that can be integrated with Swiper.
 * This is a clean-room implementation inspired by typical carousel autoplay behaviors
 * but intentionally rewritten for clarity, composability, and testability.
 *
 * Key features:
 * - Start, stop, pause, resume lifecycle
 * - Per-slide delay overrides via data attribute (default: data-autoplay-delay)
 * - Time-left tracking with RAF for smooth progress indicators
 * - Optional direction reversal and looping awareness (delegated to external swiper instance)
 * - Visibility + pointer (hover) pause support
 *
 * Integration contract (lightweight):
 * The external swiper-like instance should expose:
 *   - slides: HTMLElement[]
 *   - activeIndex: number
 *   - isBeginning: boolean
 *   - isEnd: boolean
 *   - loop?: boolean
 *   - rewind?: boolean
 *   - slideNext(speed?: number, internal?: boolean, emitEvents?: boolean): void
 *   - slidePrev(speed?: number, internal?: boolean, emitEvents?: boolean): void
 *   - el: HTMLElement (root element)
 *
 * Events emitted through provided callback emit(eventName: string, ...payload)
 */

export interface AutoplayConfig {
  enabled?: boolean;              // Whether autoplay starts automatically
  delay?: number;                 // Base delay in ms
  waitForTransition?: boolean;    // Delay resume until transition end
  disableOnInteraction?: boolean; // Stop autoplay entirely on user touch/drag
  stopOnLastSlide?: boolean;      // Do not loop past last slide
  reverseDirection?: boolean;     // Use previous slide instead of next
  pauseOnMouseEnter?: boolean;    // Pause when mouse enters root element
  progressAttribute?: string;     // Data attribute to read per-slide override
}

export interface SwiperLike {
  slides: HTMLElement[];
  activeIndex: number;
  isBeginning: boolean;
  isEnd: boolean;
  loop?: boolean;
  rewind?: boolean;
  slideNext: (speed?: number, internal?: boolean, emitEvents?: boolean) => void;
  slidePrev: (speed?: number, internal?: boolean, emitEvents?: boolean) => void;
  el: HTMLElement;
  speed?: number;
}

export interface AutoplayStateSnapshot {
  running: boolean;
  paused: boolean;
  timeLeft: number; // ms remaining before next transition
  currentDelay: number; // ms delay of active slide
}

export type EmitFn = (event: string, ...payload: unknown[]) => void;

/** Internal timer references */
interface Timers {
  timeout?: ReturnType<typeof setTimeout>;
  raf?: number;
}

export class SwiperAutoplayController {
  private swiper: SwiperLike;
  private config: Required<AutoplayConfig>;
  private emit: EmitFn;
  private timers: Timers = {};
  private startTimestamp = 0;
  private delayTotal = 0; // total per-cycle delay
  private delayCurrent = 0; // current countdown value (may be adjusted on pause)
  private pausedByInteraction = false;
  private pausedByPointerEnter = false;
  private slideChanged = false;
  private visibilityHandlerBound: () => void;
  private pointerEnterBound: (e: PointerEvent) => void;
  private pointerLeaveBound: (e: PointerEvent) => void;

  // Exposed state
  public state: AutoplayStateSnapshot = {
    running: false,
    paused: false,
    timeLeft: 0,
    currentDelay: 0,
  };

  constructor(swiper: SwiperLike, config: AutoplayConfig, emit: EmitFn) {
    this.swiper = swiper;
    this.emit = emit;
    // Apply defaults
    this.config = {
      enabled: false,
      delay: 3000,
      waitForTransition: true,
      disableOnInteraction: false,
      stopOnLastSlide: false,
      reverseDirection: false,
      pauseOnMouseEnter: false,
      progressAttribute: 'data-autoplay-delay',
      ...config,
    };
    // Bind handlers once
    this.visibilityHandlerBound = this.onVisibilityChange.bind(this);
    this.pointerEnterBound = this.onPointerEnter.bind(this);
    this.pointerLeaveBound = this.onPointerLeave.bind(this);
    if (this.config.enabled) {
      this.attachGlobalEvents();
      this.start();
    }
  }

  /** Read per-slide override if present */
  private readActiveSlideDelay(): number {
    const slide = this.swiper.slides[this.swiper.activeIndex];
    if (!slide) return this.config.delay;
    const override = slide.getAttribute(this.config.progressAttribute);
    if (!override) return this.config.delay;
    const parsed = parseInt(override, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : this.config.delay;
  }

  /** Snapshot emission helper */
  private updateTimeLeft(): void {
    if (!this.state.running) return;
    if (this.state.paused) {
      // keep previous timeLeft unchanged during paused cycles
    } else {
      const now = performance.now();
      const remaining = this.startTimestamp + this.delayCurrent() - now;
      this.state.timeLeft = remaining > 0 ? remaining : 0;
    }
    this.emit('autoplayTimeLeft', this.state.timeLeft, this.state.timeLeft / this.delayTotal);
    this.timers.raf = requestAnimationFrame(() => this.updateTimeLeft());
  }

  /** Current delay considering pause adjustments */
  private delayCurrent(): number {
    return this.delayCurrent; // naming difference: keep method for clarity
  }

  /** Start autoplay cycle */
  public start(): void {
    if (this.state.running) return;
    this.state.running = true;
    this.slideChanged = false;
    this.scheduleNext();
    this.emit('autoplayStart');
  }

  /** Stop autoplay completely */
  public stop(): void {
    if (!this.state.running) return;
    this.clearTimers();
    this.state.running = false;
    this.state.paused = false;
    this.emit('autoplayStop');
  }

  /** Pause keeping remaining time; internal flag means interactive vs programmatic */
  public pause(internal = false, reset = false): void {
    if (!this.state.running || this.state.paused) return;
    if (!internal) this.pausedByInteraction = true;
    this.clearTimeoutOnly();
    this.state.paused = true;
    if (reset) {
      if (this.slideChanged) {
        this.delayCurrent = this.config.delay;
      }
      this.slideChanged = false;
      this.emit('autoplayPause');
      if (this.config.waitForTransition) {
        this.swiper.el.addEventListener('transitionend', this.onTransitionEnd, { once: true });
      } else {
        this.resume();
      }
      return;
    }
    const now = performance.now();
    const remaining = this.startTimestamp + this.delayCurrent - now;
    this.delayCurrent = remaining > 0 ? remaining : 0;
    this.emit('autoplayPause');
    if (this.config.waitForTransition) {
      this.swiper.el.addEventListener('transitionend', this.onTransitionEnd, { once: true });
    } else {
      this.resume();
    }
  }

  /** Resume autoplay after pause */
  public resume(): void {
    if (!this.state.running || !this.state.paused) return;
    if (this.swiper.isEnd && !this.swiper.loop && this.delayCurrent <= 0 && this.config.stopOnLastSlide) return;
    this.state.paused = false;
    this.startTimestamp = performance.now();
    // If resumed via interaction keep remaining delay; else schedule fresh
    if (this.pausedByInteraction) {
      this.pausedByInteraction = false;
      this.scheduleNext(this.delayCurrent);
    } else {
      this.scheduleNext();
    }
    this.emit('autoplayResume');
  }

  /** Transition end handler used when waiting before resuming */
  private onTransitionEnd = (): void => {
    if (this.pausedByPointerEnter) return; // still hovered
    this.resume();
  };

  /** Schedule the next slide advancement */
  private scheduleNext(forceDelay?: number): void {
    this.clearTimeoutOnly();
    const base = typeof forceDelay === 'number' ? forceDelay : this.readActiveSlideDelay();
    this.delayTotal = base;
    this.delayCurrent = base;
    this.state.currentDelay = base;
    this.startTimestamp = performance.now();
    this.updateTimeLeft();
    if (base <= 0) {
      requestAnimationFrame(() => this.advance());
    } else {
      this.timers.timeout = setTimeout(() => this.advance(), base);
    }
  }

  /** Perform the actual slide change */
  private advance(): void {
    if (!this.state.running) return;
    const speed = this.swiper.speed ?? 0;
    if (this.config.reverseDirection) {
      if (!this.swiper.isBeginning || this.swiper.loop || this.swiper.rewind) {
        this.swiper.slidePrev(speed, true, true);
        this.emit('autoplay');
      } else if (!this.config.stopOnLastSlide) {
        // Jump to last if allowed
        const lastIndex = this.swiper.slides.length - 1;
        if (lastIndex >= 0) {
          this.swiper.slidePrev(speed, true, true); // reuse prev semantics
          this.emit('autoplay');
        }
      }
    } else {
      if (!this.swiper.isEnd || this.swiper.loop || this.swiper.rewind) {
        this.swiper.slideNext(speed, true, true);
        this.emit('autoplay');
      } else if (!this.config.stopOnLastSlide) {
        // Jump back to first
        const firstIndex = 0;
        if (firstIndex === 0) {
          this.swiper.slideNext(speed, true, true); // proceed anyway
          this.emit('autoplay');
        }
      }
    }
    if (this.state.running && !this.state.paused) {
      this.scheduleNext();
    }
  }

  /** External hook when slide changes (e.g., swiper event) */
  public onSlideChange(): void {
    if (!this.state.running) return;
    this.slideChanged = true;
  }

  /** Handle document visibility changes */
  private onVisibilityChange(): void {
    if (!this.state.running) return;
    const doc = document;
    if (doc.visibilityState === 'hidden') {
      this.pausedByInteraction = true;
      this.pause(true);
    } else if (doc.visibilityState === 'visible') {
      if (this.state.paused) this.resume();
    }
  }

  private onPointerEnter(e: PointerEvent): void {
    if (e.pointerType !== 'mouse') return;
    if (!this.config.pauseOnMouseEnter) return;
    this.pausedByInteraction = true;
    this.pausedByPointerEnter = true;
    if (this.state.paused) return;
    this.pause(true);
  }

  private onPointerLeave(e: PointerEvent): void {
    if (e.pointerType !== 'mouse') return;
    if (!this.config.pauseOnMouseEnter) return;
    this.pausedByPointerEnter = false;
    if (this.state.paused) this.resume();
  }

  /** Clean timers */
  private clearTimers(): void {
    this.clearTimeoutOnly();
    if (this.timers.raf) cancelAnimationFrame(this.timers.raf);
    this.timers.raf = undefined;
  }

  private clearTimeoutOnly(): void {
    if (this.timers.timeout) clearTimeout(this.timers.timeout);
    this.timers.timeout = undefined;
  }

  /** Attach global/document + element events */
  private attachGlobalEvents(): void {
    document.addEventListener('visibilitychange', this.visibilityHandlerBound);
    if (this.config.pauseOnMouseEnter) {
      this.swiper.el.addEventListener('pointerenter', this.pointerEnterBound);
      this.swiper.el.addEventListener('pointerleave', this.pointerLeaveBound);
    }
  }

  /** Detach events */
  public destroy(): void {
    this.stop();
    document.removeEventListener('visibilitychange', this.visibilityHandlerBound);
    this.swiper.el.removeEventListener('pointerenter', this.pointerEnterBound);
    this.swiper.el.removeEventListener('pointerleave', this.pointerLeaveBound);
  }
}

// Convenience factory aligning with original module usage style
export function createAutoplay(swiper: SwiperLike, config: AutoplayConfig, emit: EmitFn) {
  return new SwiperAutoplayController(swiper, config, emit);
}
