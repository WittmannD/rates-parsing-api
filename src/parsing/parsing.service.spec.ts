import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ParsingService } from './parsing.service';
import { Country } from '../common/country';
import { Vendor } from '../common/enums';

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
    const vendors = [
      Vendor.NOVA_GLOBAL,
      Vendor.DHL_EXPRESS,
      Vendor.SELLER_ONLINE,
      Vendor.SKLAD_USA,
      Vendor.WESTERN_BID,
    ];
    const countries = [
      'US',
      'CA',
      'AU',
      'NZ',
      'GB',
      'DE',
      'FR',
      'IT',
      'NL',
      'ES',
    ];

    for (const country of countries) {
      for (const vendor of vendors) {
        const value = await service.parse(
          vendor,
          Country.get(country),
          {
            width: 10,
            height: 10,
            length: 10,
          },
          200,
        );

        if (typeof value !== 'number') {
          expect(value).toBeDefined();
          const values = Object.values(value);

          for (const val of values) {
            expect(typeof val).toBe('number');
          }
        }
      }
    }
  }, 100_000_000);
});
