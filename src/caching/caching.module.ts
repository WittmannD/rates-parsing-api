import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheEntity } from './entities/cache.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { CachingService } from './caching.service';

@Module({
  imports: [TypeOrmModule.forFeature([CacheEntity]), ScheduleModule.forRoot()],
  providers: [CachingService],
  exports: [CachingService],
})
export class CachingModule {}
