import { vi } from "vitest";

/**
 * JSDOM doesn't implement PointerEvent so we need to mock our own implementation
 * Default to mouse left click interaction
 * https://github.com/radix-ui/primitives/issues/1822
 * https://github.com/jsdom/jsdom/pull/2666
 */
class MockPointerEvent extends Event {
  button: number;
  ctrlKey: boolean;
  pointerType: string;

  constructor(type: string, props: PointerEventInit) {
    super(type, props);
    this.button = props.button || 0;
    this.ctrlKey = props.ctrlKey || false;
    this.pointerType = props.pointerType || 'mouse';
  }
}

 
window.PointerEvent = MockPointerEvent as any;
window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();
window.HTMLElement.prototype.hasPointerCapture = vi.fn();

/**
 * Embla (the carousel behind PostGallery) observes its viewport for size and
 * visibility changes. JSDOM implements neither observer, and embla throws
 * rather than degrading, so anything rendering a gallery needs these stubs.
 * They never fire: jsdom reports every element as zero-sized, so a test can
 * assert on what a carousel renders but not drive it between slides.
 */
class MockObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

window.IntersectionObserver = MockObserver as unknown as typeof IntersectionObserver;
window.ResizeObserver = MockObserver as unknown as typeof ResizeObserver;
