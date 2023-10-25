import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CacheEntity } from './entities/cache.entity';
import { MoreThan, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
@Injectable()
export class CachingService {
  private readonly logger = new Logger(CachingService.name);
  private readonly ttl: number;
  private readonly size: number;

  constructor(
    @InjectRepository(CacheEntity)
    private readonly cacheRepository: Repository<CacheEntity>,
    private readonly configService: ConfigService,
  ) {
    this.ttl = configService.get<number>('main.cacheTTL');
    this.size = configService.get<number>('main.cacheMaxItems');
  }

  async get(key: string) {
    const record = await this.cacheRepository.findOne({
      where: {
        key,
        expired: MoreThan(new Date()),
      },
    });

    return record.value;
  }

  async has(key: string) {
    return await this.cacheRepository.exist({
      where: {
        key,
        expired: MoreThan(new Date()),
      },
    });
  }

  async put(key: string, value: any, ttl?: number) {
    const ttl_ms = ttl || this.ttl;

    const cacheEntity = this.cacheRepository.create({
      key,
      value,
      expired: new Date(Date.now() + ttl_ms),
    });

    await this.cacheRepository.save([cacheEntity]);
  }

  async remove(key: string) {
    await this.cacheRepository.delete({ key });
  }

  @Cron(CronExpression.EVERY_WEEK)
  async removeCache() {
    const rowsCount = await this.cacheRepository.count();

    if (rowsCount <= this.size) return;

    this.logger.log('Removing unnecessary cache...');

    const deletion = await this.cacheRepository
      .createQueryBuilder()
      .delete()
      .where(
        (qb) =>
          `key IN (${qb
            .createQueryBuilder()
            .select('key')
            .from(CacheEntity, 'ce')
            .orderBy('createdAt', 'ASC')
            .limit(rowsCount - this.size)
            .getQuery()})`,
      )
      .execute();

    this.logger.log(`Deleted ${deletion.affected} rows`);
  }
}
