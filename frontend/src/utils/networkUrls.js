/**
 * The ONLY place the backend origin is derived. Backend media paths
 * (/uploads/...) are resolved here — never re-derive the origin in a
 * component.
 */

const BACKEND_ORIGIN =
  import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:5000';

export const resolveMediaUrl = (path) => {
  if (!path) return '';

  if (path.startsWith('http') || path.startsWith('data:')) {
    return path;
  }

  return `${BACKEND_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
};
