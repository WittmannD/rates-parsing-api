import axios from 'axios';
import * as cheerio from 'cheerio';

const addresses = {
  UA: {
    zipCode: '02000',
    city: 'kyiv',
  },
  US: {
    zipCode: '20001',
    city: 'washington',
    state: 'DC',
  },
  CA: {
    zipCode: 'M1E 5K',
    city: 'toronto',
    state: 'ON',
  },
  AU: {
    zipCode: '2000',
    city: 'sydney',
    state: 'NSW',
  },
  NZ: {
    zipCode: '5016',
    city: 'wellington',
  },
  GB: {
    zipCode: 'E1 0AA',
    city: 'london',
  },
  DE: {
    zipCode: '10026',
    city: 'berlin',
  },
  FR: {
    zipCode: '75001',
    city: 'paris',
  },
  IT: {
    zipCode: '00118',
    city: 'rome',
  },
  NL: {
    zipCode: '1011',
    city: 'amsterdam',
  },
  ES: {
    zipCode: '28001',
    city: 'madrid',
  },
};

export function localizeCountry(country: string) {
  switch (country.toLowerCase().trim()) {
    case 'usa':
    case 'united states of america':
      return 'Сполучені Штати';
    case 'canada':
      return 'Канада';
    case 'australia':
      return 'Австралія';
    case 'new zealand':
      return 'Нова Зеландія';
    case 'uk':
    case 'united kingdom':
    case 'great britain':
    case 'england':
      return 'Велика Британія';
    case 'germany':
      return 'Німеччина';
    case 'france':
      return 'Франція';
    case 'italy':
      return 'Італія';
    case 'netherlands':
      return 'Нідерланди';
    case 'spain':
      return 'Іспанія';
    default:
      return null;
  }
}

export function getCountryCode(country: string) {
  switch (country.toLowerCase().trim()) {
    case 'ukraine':
      return 'UA';
    case 'usa':
    case 'united states of america':
      return 'US';
    case 'canada':
      return 'CA';
    case 'australia':
      return 'AU';
    case 'new zealand':
      return 'NZ';
    case 'uk':
    case 'united kingdom':
    case 'england':
      return 'GB';
    case 'germany':
      return 'DE';
    case 'france':
      return 'FR';
    case 'italy':
      return 'IT';
    case 'netherlands':
      return 'NL';
    case 'spain':
      return 'ES';
    default:
      return null;
  }
}

export function getDhlAddress(country: string) {
  const code = getCountryCode(country);

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
      postCode: '10026',
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

  return data[code];
}

export function getSkladUsaAddress(country: string) {
  const countryCode = getCountryCode(country);
  const address = addresses[countryCode];

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
    'form[region]': options[countryCode],
    'form[state]': 3628, // DC
    'form[city]': address.city,
    'form[zip]': address.zipCode,
  };
}

export function getSellerOnlineAddress(country: string) {
  const countryCode = getCountryCode(country);
  const address = addresses[countryCode];

  const data = {
    country: countryCode,
    zip: address.zipCode,
  };

  if ('state' in address) {
    data['state'] = address.state;
  }

  return data;
}

export function getWesternBidAddress(country: string) {
  const countryCode = getCountryCode(country);
  const address = addresses[countryCode];

  return {
    ToCountryCode: countryCode,
    ToZipCode: address.zipCode,
  };
}

export async function getCSRFToken(url: string, selector: string) {
  const response = await axios.request({
    method: 'get',
    url,
  });

  const $ = cheerio.load(response.data);
  return $(selector).first().val();
}
