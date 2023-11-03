import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ParsingService } from './parsing.service';
import { Country } from '../common/country';
import { CachingModule } from '../caching/caching.module';
import { ConfigModule } from '@nestjs/config';
import Config from '../common/config';
import { TypeOrmModule } from '@nestjs/typeorm';

describe('ParsingService', () => {
  let service: ParsingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule.register({
          timeout: 1000 * 60 * 2, // 2 min
        }),
        CachingModule,
        ConfigModule.forRoot({ isGlobal: true, load: [Config] }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [],
          synchronize: true,
        }),
      ],
      providers: [ParsingService],
    }).compile();

    service = module.get<ParsingService>(ParsingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return dhl rates', async () => {
    const result = await service.parseDhlExpress(
      Country.get('usa'),
      {
        width: 10,
        height: 10,
        length: 12,
      },
      200,
    );
    console.log(result);
    expect(result).toBeDefined();
    expect(result).not.toEqual(null);
  });

  it('should work', async () => {
    await service.updateCache();
  }, 100_000_000);
});
