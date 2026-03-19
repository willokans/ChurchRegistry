import '@testing-library/jest-dom';

// Frontend runtime requires a configured backend base URL.
process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

// ResizeObserver is not available in jsdom; certificate pages use it for embed scaling.
class ResizeObserverMock {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
