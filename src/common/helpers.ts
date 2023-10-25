import { unzipSync } from 'node:zlib';
import axios, { AxiosError } from 'axios';

import * as cheerio from 'cheerio';
import { Country } from './country';
import { createHash } from 'node:crypto';

const addresses = {
  UA: {
    localization: 'Україна',
    zipCode: '02000',
    city: 'kyiv',
  },
  US: {
    localization: 'Сполучені Штати',
    zipCode: '20001',
    city: 'washington',
    state: 'DC',
  },
  CA: {
    localization: 'Канада',
    zipCode: 'M5A 2W1',
    city: 'toronto',
    state: 'ON',
  },
  AU: {
    localization: 'Австралія',
    zipCode: '2000',
    city: 'sydney',
    state: 'NSW',
  },
  NZ: {
    localization: 'Нова Зеландія',
    zipCode: '5016',
    city: 'wellington',
  },
  GB: {
    localization: 'Велика Британія',
    zipCode: 'E1 0AA',
    city: 'london',
  },
  DE: {
    localization: 'Німеччина',
    zipCode: '10026',
    city: 'berlin',
  },
  FR: {
    localization: 'Франція',
    zipCode: '75001',
    city: 'paris',
  },
  IT: {
    localization: 'Італія',
    zipCode: '00118',
    city: 'rome',
  },
  NL: {
    localization: 'Нідерланди',
    zipCode: '1011',
    city: 'amsterdam',
  },
  ES: {
    localization: 'Іспанія',
    zipCode: '28001',
    city: 'madrid',
  },
};

export function prettifyAxiosError(err: any) {
  if (!(err instanceof AxiosError) || !err.response) return err;

  const content =
    typeof err.response.data === 'string'
      ? err.response.data.slice(0, 1000)
      : err.response.data;

  const headers = Object(err.response.headers);
  const config = err.response.config;

  return {
    message: err.message,
    statusText: err.response.statusText,
    config,
    headers,
    content,
  };
}

export function getLocalizedCountryName(country: Country) {
  return addresses[country.code].localization;
}

export function getDhlAddress(country: Country) {
  const data = {
    UA: {
      countryCode: 'UA',
      postCode: '02000',
      cityName: 'Kyiv',
      addressLine1: 'Kyiv',
      serviceAreaCode: 'IEV',
      facilityId: 'IEVIEV',
      residentialAddress: false,
    },
    US: {
      countryCode: 'US',
      postCode: '20001',
      cityName: 'Washington',
      addressLine1: '',
      serviceAreaCode: 'DCA',
      facilityId: 'DCANVA',
      residentialAddress: false,
    },
    CA: {
      countryCode: 'CA',
      postCode: 'M1E 5K',
      cityName: 'TORONTO',
      addressLine1: '',
      serviceAreaCode: 'YHM',
      facilityId: 'YHMTZE',
      residentialAddress: false,
    },
    AU: {
      countryCode: 'AU',
      postCode: '2000',
      cityName: 'SYDNEY',
      addressLine1: '',
      serviceAreaCode: 'SYD',
      facilityId: 'SYDSSE',
      residentialAddress: false,
    },
    NZ: {
      countryCode: 'NZ',
      postCode: '5016',
      cityName: 'WELLINGTON',
      addressLine1: '',
      serviceAreaCode: 'WLG',
      facilityId: 'WLGSVC',
      residentialAddress: false,
    },
    GB: {
      countryCode: 'GB',
      postCode: 'E1 0AA',
      cityName: 'LONDON',
      addressLine1: '',
      serviceAreaCode: 'ZLS',
      facilityId: 'ZLSZLS',
      residentialAddress: false,
    },
    DE: {
      countryCode: 'DE',
      postCode: '10117',
      cityName: 'BERLIN',
      addressLine1: '',
      serviceAreaCode: 'BER',
      facilityId: 'BER015',
      residentialAddress: false,
    },
    FR: {
      countryCode: 'FR',
      postCode: '75001',
      cityName: 'PARIS',
      addressLine1: '',
      serviceAreaCode: 'CDG',
      facilityId: 'CDGGVL',
      residentialAddress: false,
    },
    IT: {
      countryCode: 'IT',
      postCode: '00118',
      cityName: 'ROME',
      addressLine1: '',
      serviceAreaCode: 'ROM',
      facilityId: 'ROMSCD',
      residentialAddress: false,
    },
    NL: {
      countryCode: 'NL',
      postCode: '1011',
      cityName: 'AMSTERDAM',
      addressLine1: '',
      serviceAreaCode: 'AMS',
      facilityId: 'AMSCTY',
      residentialAddress: false,
    },
    ES: {
      countryCode: 'ES',
      postCode: '28001',
      cityName: 'MADRID',
      addressLine1: '',
      serviceAreaCode: 'MAD',
      facilityId: 'MADMAD',
      residentialAddress: false,
    },
  };

  return data[country.code];
}

export function getSkladUsaAddress(country: Country) {
  const address = addresses[country.code];

  const options = {
    US: '223',
    AU: '13',
    CA: '38',
    FR: '74',
    DE: '81',
    IT: '105',
    NL: '150',
    NZ: '153',
    ES: '195',
    GB: '222',
  };

  return {
    'form[region]': options[country.code],
    'form[state]': 3628, // DC
    'form[city]': address.city,
    'form[zip]': address.zipCode,
  };
}

export function getSellerOnlineAddress(country: Country) {
  const address = addresses[country.code];

  const data = {
    country: country.code,
    zip: address.zipCode,
  };

  if ('state' in address) {
    data['state'] = address.state;
  }

  return data;
}

export function getWesternBidAddress(country: Country) {
  const address = addresses[country.code];

  return {
    ToCountryCode: country.code,
    ToZipCode: address.zipCode,
  };
}

export async function getCSRFToken(url: string, selector: string) {
  const response = await axios.request({
    method: 'get',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
    },
    url,
  });

  const $ = cheerio.load(response.data);
  return $(selector).first().val();
}

export function decodeBase64JSON(str: string) {
  try {
    const decoded = Buffer.from(str, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (e: any) {
    return null;
  }
}

export function decodeGzipJSON(str: string) {
  try {
    const compressed = Buffer.from(str, 'base64url');
    const decompressed = unzipSync(compressed);
    return JSON.parse(decompressed.toString('utf8'));
  } catch (e: any) {
    return null;
  }
}
export function getObjectSig(obj: any) {
  const orderedObj = Object.fromEntries(Object.entries(obj).sort());
  const jsonObj = JSON.stringify(orderedObj);
  return createHash('md5').update(jsonObj).digest('hex');
}

export function getArgumentsSig(args: IArguments) {
  return createHash('md5')
    .update(JSON.stringify(Array.from(args)))
    .digest('hex');
}
