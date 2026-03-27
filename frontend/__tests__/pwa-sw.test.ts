import fs from 'fs';
import path from 'path';
import vm from 'vm';

type SWHandlers = Record<string, (event: any) => void>;

function loadServiceWorkerScript(helpers: {
  origin: string;
  fetchImpl: (input: any, init?: any) => Promise<any>;
  cachesImpl?: Partial<{
    open: (name: string) => Promise<any>;
    keys: () => Promise<string[]>;
    delete: (key: string) => Promise<boolean>;
  }>;
}) {
  const handlers: SWHandlers = {};

  const mockCache = {
    match: jest.fn(async () => undefined),
    put: jest.fn(async () => undefined),
  };

  const mockCaches = {
    open: jest.fn(async () => mockCache),
    keys: jest.fn(async () => []),
    delete: jest.fn(async () => true),
    ...(helpers.cachesImpl ?? {}),
  };

  const self = {
    location: { origin: helpers.origin },
    addEventListener: (type: string, cb: (event: any) => void) => {
      handlers[type] = cb;
    },
    // Provided for script-defined handlers; these are not triggered in this test.
    skipWaiting: jest.fn(),
    clients: { claim: jest.fn() },
  };

  const Response = {
    error: () => ({ ok: false }),
  };

  const sandbox = {
    self,
    caches: mockCaches,
    fetch: helpers.fetchImpl,
    Response,
    URL,
    // avoid ReferenceError for eslint-disable blocks in some environments
    console,
    Promise,
    setTimeout,
    clearTimeout,
  };

  const swPath = path.join(process.cwd(), 'public', 'sw.js');
  const swCode = fs.readFileSync(swPath, 'utf-8');
  vm.runInNewContext(swCode, sandbox, { filename: 'sw.js' });

  return { handlers, caches: mockCaches, cache: mockCache, sandbox };
}

function createResponse(ok: boolean) {
  return {
    ok,
    clone() {
      return this;
    },
  };
}

describe('PWA service worker shell caching', () => {
  const origin = 'https://church-registry.test';

  it('bypasses GET /api/* (never responds from the SW cache)', async () => {
    const fetchImpl = jest.fn(async () => createResponse(true));
    const { handlers, caches } = loadServiceWorkerScript({ origin, fetchImpl });

    const respondWith = jest.fn();
    const event = {
      request: { method: 'GET', url: `${origin}/api/some-endpoint`, mode: 'navigate' },
      respondWith,
    };

    handlers.fetch(event);

    expect(respondWith).not.toHaveBeenCalled();
    expect(caches.open).not.toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('treats create-flow navigations as offline-eligible documents', async () => {
    const fetchImpl = jest.fn(async () => createResponse(true));
    const { handlers, caches, cache } = loadServiceWorkerScript({ origin, fetchImpl });

    const respondWith = jest.fn((p: Promise<any>) => p);
    const event = {
      request: { method: 'GET', url: `${origin}/baptisms/new`, mode: 'navigate' },
      respondWith,
    };

    handlers.fetch(event);

    expect(respondWith).toHaveBeenCalledTimes(1);
    const promise = respondWith.mock.calls[0][0] as Promise<any>;
    await promise;

    // Network-first path should attempt to open the static cache.
    expect(caches.open).toHaveBeenCalledWith(expect.any(String));
    expect(cache.put).toHaveBeenCalled();
  });

  it('does not offline-cache arbitrary navigations (documents)', async () => {
    const fetchImpl = jest.fn(async () => createResponse(true));
    const { handlers, caches } = loadServiceWorkerScript({ origin, fetchImpl });

    const respondWith = jest.fn();
    const event = {
      request: { method: 'GET', url: `${origin}/dashboard`, mode: 'navigate' },
      respondWith,
    };

    handlers.fetch(event);

    expect(respondWith).not.toHaveBeenCalled();
    expect(caches.open).not.toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('cache-first caches app-shell assets (/_next/static, /icons, /images)', async () => {
    const fetchImpl = jest.fn(async () => createResponse(true));
    const { handlers, caches, cache } = loadServiceWorkerScript({ origin, fetchImpl });

    const respondWith = jest.fn((p: Promise<any>) => p);
    const event = {
      request: { method: 'GET', url: `${origin}/_next/static/chunks/app.js`, mode: 'no-cors' },
      respondWith,
    };

    handlers.fetch(event);

    expect(respondWith).toHaveBeenCalledTimes(1);
    const promise = respondWith.mock.calls[0][0] as Promise<any>;
    await promise;

    expect(caches.open).toHaveBeenCalledWith(expect.any(String));
    expect(cache.put).toHaveBeenCalled();
  });
});

