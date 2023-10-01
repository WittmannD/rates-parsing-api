// USA
// Canada
// Australia
// New Zealand
// UK
// Germany
// France
// Italy
// Netherlands
// Spain

import { format } from 'date-fns';
import {
  getCountryCode,
  getDhlAddress,
  getSellerOnlineAddress,
  getSkladUsaAddress,
  getWesternBidAddress,
  localizeCountry,
} from './helpers';

export interface ParcelDimensions {
  width: number;
  height: number;
  length: number;
}

const Cast = {
  novaGlobal(country: string, dimensions: ParcelDimensions, weight: number) {
    return {
      pickup_country: 'Україна',
      destination_country: localizeCountry(country),
      ...dimensions,
      weight: weight / 1000, // grams to kg
      type: 'Вантаж',
      page_num: 1,
      lang: 'Українська',
      status: 'calc',
    };
  },

  dhlExpress(country: string, dimensions: ParcelDimensions, weight: number) {
    const { width, height, length } = dimensions;

    return {
      fromAddress: getDhlAddress('ukraine'),
      toAddress: getDhlAddress(country),
      globalMailShipment: false,
      dutiable: true,
      type: 'PACKAGE',
      shipmentCurrency: 'EUR',
      insuranceCurrency: 'USD',
      extendedLiability: null,
      packages: [
        {
          packaging: {
            pallet: false,
            packageType: 'CUSTOM',
            width,
            height,
            length,
            fixedWeight: false,
            units: 'METRIC',
            shipmentType: 'BOTH',
            maxQuantity: 99,
            maxWidth: 120,
            maxHeight: 120,
            maxLength: 200,
            name: 'Your Own Package',
            id: 'OWN',
          },
          weight: weight / 1000, // grams to kg
          quantity: 1,
        },
      ],
      totalDeclaredValue: 5,
      shippingDate: format(new Date(), 'yyyy-MM-dd'), // '2023-09-29'
    };
  },

  skladUsa(country: string, dimensions: ParcelDimensions, weight: number) {
    return {
      'form[from_country]': 1,
      ...getSkladUsaAddress(country),
      'form[weight]': weight / 1000, // grams to kg
      'form[height]': dimensions.height,
      'form[width]': dimensions.width,
      'form[lenght]': dimensions.length,
      'form[clientPP][]': 'No',
      'form[save]': '',
    };
  },

  sellerOnline(country: string, dimensions: ParcelDimensions, weight: number) {
    return {
      weight: weight / 1000, // gram to kg
      ...getSellerOnlineAddress(country),
      dimensions: {
        length: 10,
        width: 10,
        height: 16,
      },
    };
  },

  westernBid(country: string, dimensions: ParcelDimensions, weight: number) {
    return {
      lang: 'uk',
      version: 'v2',
      FromCountryCode: getCountryCode('ukraine'),
      ...getWesternBidAddress(country),
      NullLength: dimensions.length,
      NullWidth: dimensions.width,
      NullHeight: dimensions.height,
      NullWeight: weight / 1000, // grams to kg
      'X-Requested-With': 'XMLHttpRequest',
      _: Date.now(),
    };
  },
};

export default Cast;
