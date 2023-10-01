import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ParsingService } from './parsing.service';

describe('ParsingService', () => {
  let service: ParsingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule.register({
          timeout: 1000 * 60 * 2, // 2 min
        }),
      ],
      providers: [ParsingService],
    }).compile();

    service = module.get<ParsingService>(ParsingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be', async () => {
    const value = await service.parseNovaGlobal(
      'usa',
      { width: 10, height: 10, length: 12 },
      1000,
    );
    expect(value).toEqual(900);
  });

  it('should work', async () => {
    const value = await service.parseWesternBid(
      'usa',
      { width: 10, height: 10, length: 12 },
      1000,
    );
    console.log(value);
    expect(value).toBeDefined();
  }, 50000);
});
