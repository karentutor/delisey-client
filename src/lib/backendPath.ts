// client/src/lib/backendPath.ts
import { backendApi } from './backendApi';

/**
 * Builds a backend path that works whether your backendApi.baseURL is:
 * - http://localhost:4000        (needs /api prefix)
 * - http://localhost:4000/api    (does NOT need /api prefix)
 */
export function backendPath(path: string) {
  const p = path.startsWith('/') ? path : `/${path}`;
  const base = String(backendApi.defaults.baseURL || '').replace(/\/$/, '');

  // If baseURL already ends with "/api", do NOT add another "/api"
  const needsApiPrefix = !base.endsWith('/api');

  return `${needsApiPrefix ? '/api' : ''}${p}`;
}
