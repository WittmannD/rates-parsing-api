import { Module } from '@nestjs/common';
import { ParsingService } from './parsing.service';
import { ParsingController } from './parsing.controller';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { create } from 'cache-manager-sqlite';
import { IsAcceptableCountry } from '../common/validatots/is-acceptable-country.validator';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    HttpModule.register({
      timeout: 60 * 2 * 1000, // 2 minutes
      maxRedirects: 10,
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        ttl: configService.get('cacheTTL'), // 1 day
        store: create({
          path: './cache.db',
        }),
        max: configService.get('cacheMaxItems'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ParsingController],
  providers: [ParsingService, IsAcceptableCountry],
})
export class ParsingModule {}
