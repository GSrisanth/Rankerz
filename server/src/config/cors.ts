import { config } from './env.js';

/**
 * Validates whether an incoming HTTP or WebSocket origin is permitted.
 * Automatically permits:
 * - Direct/non-browser requests without origin header (curl, mobile, health checks)
 * - Configured CLIENT_URL from environment
 * - Official production domain: https://rankerz.vercel.app
 * - Any preview domain on Vercel (*.vercel.app)
 * - Local development origins (localhost:3000, 127.0.0.1:3000, localhost:5173)
 */
export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;

  const allowedStatic = [
    config.clientUrl,
    'https://rankerz.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];

  if (allowedStatic.includes(origin)) {
    return true;
  }

  if (origin.endsWith('.vercel.app')) {
    return true;
  }

  return false;
}
