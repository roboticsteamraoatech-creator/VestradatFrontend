/**
 * Single source of truth for the backend API base URL.
 * Set NEXT_PUBLIC_BACKEND_API in your .env.local to override.
 */
export const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API as string;
