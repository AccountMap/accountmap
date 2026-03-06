/**
 * Limits for accounts and identities (connections) to stay within
 * Render.com free/lowest-tier PostgreSQL (e.g. 1GB, 90-day).
 * Override via env: MAX_ACCOUNTS, MAX_IDENTITIES (e.g. on Render: Environment tab).
 */
const envNum = (key: string, fallback: number): number => {
  const v = process.env[key];
  if (v === undefined || v === "") return fallback;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? fallback : Math.max(0, n);
};

export const MAX_ACCOUNTS = envNum("MAX_ACCOUNTS", 100);
export const MAX_IDENTITIES = envNum("MAX_IDENTITIES", 50);
