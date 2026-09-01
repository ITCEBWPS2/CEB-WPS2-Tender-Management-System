import '@testing-library/jest-dom';

// Polyfill / Mock ResizeObserver for jsdom environments (used by Recharts / UI components)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
