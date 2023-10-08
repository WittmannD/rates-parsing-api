import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import Cast from '../common/cast';
import { firstValueFrom } from 'rxjs';
import * as _ from 'lodash';
import { stringify } from 'querystring';
import * as cheerio from 'cheerio';
import { getCSRFToken, prettifyAxiosError } from '../common/helpers';
import { Country } from '../common/country';
import { Vendor } from '../common/enums';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { AxiosError } from 'axios';

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

  constructor(private readonly httpService: HttpService) {}

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

  async parse(
    vendor: Vendor,
    country: Country,
    dimensions: { width: number; height: number; length: number },
    weight: number,
    requestData?: Record<string, any>,
  ) {
    try {
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
    } catch (e: any) {
      if (e instanceof HttpException) throw e;

      if (e instanceof AxiosError) {
        this.logger.error(prettifyAxiosError(e));
      } else {
        this.logger.error(
          `${e?.name || 'Unknown Error'}: ${e?.message}`,
          e?.stack || null,
        );
      }
    }
  }
}
