import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { CacheEntity } from './src/caching/entities/cache.entity';
import { CreateCacheTable1696806441323 } from './migrations/1696806441323-CreateCacheTable';

config();

const configService = new ConfigService();

const url = configService.get('DATABASE_URL');

const credentials = url
  ? { url }
  : {
      host: configService.get('DATABASE_HOST'),
      port: configService.get('DATABASE_PORT'),
      username: configService.get('DATABASE_USER'),
      password: configService.get('DATABASE_PASS'),
      database: configService.get('DATABASE_NAME'),
    };

export default new DataSource({
  type: 'postgres',
  ...credentials,
  entities: [CacheEntity],
  ssl: {
    rejectUnauthorized: false,
  },
  migrations: [CreateCacheTable1696806441323],
});
