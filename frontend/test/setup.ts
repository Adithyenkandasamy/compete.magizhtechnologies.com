import "@testing-library/jest-dom/vitest";

/**
 * Minimal matchMedia polyfill so framer-motion's `useReducedMotion()`
 * and CSS media queries work under jsdom in Vitest.
 */
if (typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
