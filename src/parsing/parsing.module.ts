import { Module } from '@nestjs/common';
import { ParsingService } from './parsing.service';
import { ParsingController } from './parsing.controller';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { create } from 'cache-manager-sqlite';

@Module({
  imports: [
    HttpModule.register({
      timeout: 60 * 2 * 1000, // 2 minutes
      maxRedirects: 10,
    }),
    CacheModule.register({
      ttl: 60 * 60 * 24, // 1 day
      store: create({
        path: './cache.db',
      }),
    }),
  ],
  controllers: [ParsingController],
  providers: [ParsingService],
})
export class ParsingModule {}
