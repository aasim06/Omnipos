import { getTenantHeaders } from './api';

let installed = false;

export function setupTenantInterceptor(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // Only inject tenant headers into our API routes
    if (url && (url.includes('/api/') || url.includes('/api'))) {
      const tenantHeaders = await getTenantHeaders();
      const headers = new Headers(init?.headers);

      for (const [key, val] of Object.entries(tenantHeaders)) {
        if (!headers.has(key) && val) {
          headers.set(key, val);
        }
      }

      return originalFetch(input, {
        ...init,
        headers,
      });
    }

    return originalFetch(input, init);
  };
}
