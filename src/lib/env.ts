function parseCsv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export const env = {
  get PORT(): number {
    return parseInt(process.env.PORT || '3000', 10);
  },
  get NODE_ENV(): string {
    return process.env.NODE_ENV || 'development';
  },
  get API_PREFIX(): string {
    return process.env.API_PREFIX || '/api/v1';
  },
  get CORS_ORIGIN(): string {
    return process.env.CORS_ORIGIN || '*';
  },
  get DATABASE_URL(): string {
    return process.env.DATABASE_URL || '';
  },
  get DATABASE_URL_UNPOOLED(): string {
    return process.env.DATABASE_URL_UNPOOLED || process.env.DIRECT_URL || '';
  },
  get NEON_AUTH_BASE_URL(): string {
    return process.env.NEON_AUTH_BASE_URL || '';
  },
  get NEON_AUTH_JWKS_URL(): string {
    return process.env.NEON_AUTH_JWKS_URL || '';
  },
  get API_KEYS(): string[] {
    return [...parseCsv(process.env.API_KEY), ...parseCsv(process.env.API_KEYS)];
  },
  get RATE_LIMIT_MAX(): number {
    return parseInt(process.env.RATE_LIMIT_MAX || '100', 10);
  },
  get RATE_LIMIT_WINDOW_MS(): number {
    return parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
  },
  get isDev(): boolean {
    return (process.env.NODE_ENV || 'development') === 'development';
  },
  get isProd(): boolean {
    return process.env.NODE_ENV === 'production';
  },
};
