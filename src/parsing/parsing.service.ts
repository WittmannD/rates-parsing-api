import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import Cast from '../common/cast';
import { firstValueFrom } from 'rxjs';
import * as _ from 'lodash';
import { stringify } from 'querystring';
import * as cheerio from 'cheerio';
import { getCSRFToken } from '../common/helpers';
import { Country } from '../common/country';
import { Vendor } from '../common/enums';
import { CachingService } from '../caching/caching.service';
import { TTLCache } from '../caching/caching.decorator';
import * as Limit from 'p-limit';
import { ConfigService } from '@nestjs/config';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class ParsingService {
  private readonly logger = new Logger(ParsingService.name);
  private readonly settings = {
    novaGlobal: {
      url: 'https://personal.novaposhtaglobal.ua/post-react',
    },
    dhlExpress: {
      url: 'https://mydhl.express.dhl/ua/api/rates/products',
    },
    skladUsa: {
      url: 'https://api-system.skladusa.com/en/web/calculator',
    },
    sellerOnline: {
      url: 'https://api.seller-online.com/v2/shipping/calculator/get-carriers',
    },
    westernBid: {
      form: 'https://www.westernbid.info/v1/shippingRate/calculator?version=v2&lang=uk',
      url: 'https://www.westernbid.info/v1/shippingRate/getCalculatorRates',
    },
  };

  constructor(
    private readonly cachingService: CachingService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async parseWesternBid(
    country: Country,
    dimensions: { width: number; height: number; length: number },
    weight: number,
    requestData?: Record<string, any>,
  ) {
    const csrfToken = await getCSRFToken(
      this.settings.westernBid.form,
      'form > [name=__RequestVerificationToken]',
    );
    let inputData = Cast.westernBid(country, dimensions, weight);
    inputData = _.merge(inputData, requestData);
    const observable = this.httpService.request({
      method: 'get',
      url: this.settings.westernBid.url,
      params: { ...inputData, __RequestVerificationToken: csrfToken },
    });
    const response = await firstValueFrom(observable);
    const rates = {};

    const $ = cheerio.load(response.data);
    const costRegex = /\$\s([\d.]+)/;

    $('div:has(.calc-text-wrapper + p)').each((index, div) => {
      const costParagraph = $(div).find('.calc-text-wrapper + p').first();

      if (costParagraph && costRegex.test(costParagraph.text())) {
        const productParagraph = $(div).find('.calc-text-wrapper > p').first();

        rates[productParagraph.text().trim()] = +costRegex.exec(
          costParagraph.text(),
        )[1];
      }
    });

    $('div:has(.calc-text-wrapper + .additional-calc)').each((index, div) => {
      const parentProductParagraph = $(div)
        .find('.calc-text-wrapper > p')
        .first();

      $(div)
        .find('div.additional-calc-item')
        .each((index, div) => {
          const costParagraph = $(div)
            .find('.additional-calc-right > p')
            .first();

          if (costParagraph && costRegex.test(costParagraph.text())) {
            const productParagraph = $(div)
              .find('.additional-calc-left > p')
              .first();

            const product = `${parentProductParagraph
              .text()
              .trim()} - ${productParagraph.text().trim()}`;

            rates[product] = +costRegex.exec(costParagraph.text())[1];
          }
        });
    });

    return rates;
  }

  async parseSellerOnline(
    country: Country,
    dimensions: { width: number; height: number; length: number },
    weight: number,
    requestData?: Record<string, any>,
  ) {
    let inputData = Cast.sellerOnline(country, dimensions, weight);
    inputData = _.merge(inputData, requestData);

    const observable = this.httpService.request({
      method: 'post',
      url: this.settings.sellerOnline.url,
      data: inputData,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
    });

    const rates = {};

    const response = await firstValueFrom(observable);

    for (const rate of response.data) {
      const product =
        `${_.get(rate, 'carrier_service.carrier')}: ${rate.ship_type} - ` +
        `${_.get(rate, 'carrier_service.name')}`;
      rates[product] = _.get(rate, 'rates.total');
    }

    return rates;
  }

  async parseSkladUsa(
    country: Country,
    dimensions: { width: number; height: number; length: number },
    weight: number,
    requestData?: Record<string, any>,
  ) {
    let inputData = Cast.skladUsa(country, dimensions, weight);
    inputData = _.merge(inputData, requestData);

    const observable = this.httpService.request({
      method: 'post',
      url: this.settings.skladUsa.url,
      data: stringify(inputData),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const response = await firstValueFrom(observable);

    const rates = {};

    const $ = cheerio.load(response.data);
    $('table.result-table').each((index, table) => {
      $(table)
        .find('tbody > tr')
        .each((index, tr) => {
          const td = $(tr).find('td:not(:first-child)');
          const product = td
            .first()
            .text()
            .trim()
            .replace(/\s\s/g, '')
            .replace('\n', '');
          const cost = td
            .last()
            .text()
            .replace(/\s\s/g, '')
            .replace('\n', '')
            .replace('$', '')
            .trim();

          if (/\d+/.test(cost)) rates[product] = +cost;
        });
    });

    return rates;
  }

  async parseDhlExpress(
    country: Country,
    dimensions: { width: number; height: number; length: number },
    weight: number,
    requestData?: Record<string, any>,
  ) {
    let inputData = Cast.dhlExpress(country, dimensions, weight);
    inputData = _.merge(inputData, requestData);

    const observable = this.httpService.request({
      method: 'post',
      url: this.settings.dhlExpress.url,
      data: inputData,
      headers: {
        'Content-Type': 'application/json',
        Referer: 'https://mydhl.express.dhl/ua/uk/shipment.html',
      },
    });

    const response = await firstValueFrom(observable);

    const item = _.find(response.data, {
      globalProductName: 'EXPRESS WORLDWIDE',
    });

    if (item) return _.get(item, 'payment.total.value');

    return _.get(response.data[0], 'payment.total.value');
  }

  async parseNovaGlobal(
    country: Country,
    dimensions: { width: number; height: number; length: number },
    weight: number,
    requestData?: Record<string, any>,
  ) {
    let inputData = Cast.novaGlobal(country, dimensions, weight);
    inputData = _.merge(inputData, requestData);

    const observable = this.httpService.request({
      method: 'post',
      url: this.settings.novaGlobal.url,
      data: inputData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const response = await firstValueFrom(observable);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [product, cost, terms] = response.data[0];

    return +cost;
  }

  @TTLCache()
  async parse(
    vendor: Vendor | string,
    country: Country | string,
    dimensions: { width: number; height: number; length: number },
    weight: number,
    requestData?: Record<string, any>,
    seed?: string,
  ) {
    country = typeof country === 'string' ? Country.get(country) : country;
    this.logger.log(
      `Getting rates of ${vendor} for ${country} with seed ${seed}`,
    );

    switch (vendor) {
      case Vendor.NOVA_GLOBAL:
        return await this.parseNovaGlobal(
          country,
          dimensions,
          weight,
          requestData,
        );
      case Vendor.DHL_EXPRESS:
        return await this.parseDhlExpress(
          country,
          dimensions,
          weight,
          requestData,
        );
      case Vendor.WESTERN_BID:
        return await this.parseWesternBid(
          country,
          dimensions,
          weight,
          requestData,
        );
      case Vendor.SELLER_ONLINE:
        return await this.parseSellerOnline(
          country,
          dimensions,
          weight,
          requestData,
        );
      case Vendor.SKLAD_USA:
        return await this.parseSkladUsa(
          country,
          dimensions,
          weight,
          requestData,
        );
      default:
        throw new BadRequestException(`Unknown vendor "${vendor}"`);
    }
  }

  async batchParse(
    vendor: Vendor,
    country: Country,
    parameters: [number, number, number, number][],
    requestData?: Record<string, any>,
    seed?: string,
  ) {
    this.logger.log(
      `Running of batch rates parsing of "${vendor}" for ${country} with seed ${seed}`,
    );

    const limit = Limit(
      this.configService.get<number>('main.workersLimit', 10),
    );

    const tasks = [];
    let i = 0;

    for (const [width, height, length, weight] of parameters) {
      tasks.push(
        limit(async () => ({
          index: i++,
          data: await this.parse(
            vendor,
            country,
            { width, height, length },
            weight,
            requestData,
            seed,
          ),
        })),
      );
    }

    const results = await Promise.allSettled(tasks);
    const rates = Array(parameters.length).fill(null);

    for (const result of results) {
      if (result.status === 'rejected') {
        this.logger.warn(`Error in tasks of batch parsing: ${result.reason}`);
        continue;
      }

      rates[result.value.index] = result.value.data || null;
    }

    return rates;
  }

  @Cron('0 12 * * 0')
  async updateCache() {
    const records = await this.cachingService.getExpired();
    const now = Date.now();

    const chunkSize = this.configService.get<number>('main.chunkSize', 160);

    this.logger.log(
      `Found ${records.length} cache records that need to be updated. Running the update strategy with the chunk size ${chunkSize}...`,
    );

    for (let i = 0; i < records.length / chunkSize; i++) {
      const offset = i * chunkSize;
      const chunk = records.slice(offset, i + chunkSize);
      const timeout = setTimeout(
        () => {
          const limit = Limit(
            this.configService.get<number>('main.workersLimit', 10),
          );

          const tasks = chunk.map(({ key }) => {
            const parameters = JSON.parse(key);
            return limit(() =>
              this.parse(
                ...(parameters as Parameters<typeof this.parse>),
              ).catch((err) => this.logger.warn(`${err}`)),
            );
          });

          Promise.allSettled(tasks);
        },
        (i + 1) * 60_000,
      );
      this.schedulerRegistry.addTimeout(`${now}_${i}`, timeout);
    }
  }
}
