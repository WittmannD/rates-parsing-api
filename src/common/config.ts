import { registerAs } from '@nestjs/config';

export default registerAs('main', () => ({
  port: process.env.PORT || 3000,
  acceptableCountries: process.env.ACCEPTABLE_COUNTRIES?.trim().split(
    /\s*,\s*/,
  ) || ['us', 'ca', 'au', 'gb', 'fr', 'nz', 'de', 'it', 'es', 'nl'],
  cacheMaxItems: +process.env.CACHE_MAX_ITEMS || 40_000,
  cacheTTL: +process.env.CACHE_TTL || 1000 * 60 * 60 * 24 * 2, // = 2 days,
  workersLimit: +process.env.WORKERS_LIMIT || 10,
}));
