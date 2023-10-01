import Api from './api';

function getAgentRate(
  vendor: string,
  country: string,
  width: number,
  height: number,
  length: number,
  weight: number,
  productIndex?: number,
) {
  const rates = Api.request('get', `${vendor}/${country}`, {
    width,
    height,
    length,
    weight,
  });

  const rateValues = Object.values(rates);

  if (!productIndex) return Object.entries(rates);

  if (productIndex > rateValues.length || productIndex < 1)
    throw `There is no rate with index "${productIndex}" for vendor "${vendor}". Found ${rateValues.length} product rates.`;

  return rates[productIndex - 1];
}

/**
 * A custom function that parse vendor shipment rates
 *
 * @param {string} vendor Accepted values: NovaGlobal, DhlExpress, WesternBid, SellerOnline, SkladUsa
 * @param {string} country Accepted values: USA, Canada, Australia, New Zealand, UK, Germany, France, Italy, Netherlands, Spain
 * @param {number} width
 * @param {number} height
 * @param {number} length
 * @param {number} weight
 * @param {number} [productIndex]
 * @return {number}
 * @customfunction
 */
export function parse(
  vendor: string,
  country: string,
  width: number,
  height: number,
  length: number,
  weight: number,
  productIndex?: number,
) {
  vendor = vendor.toLowerCase().trim();

  switch (vendor) {
    case 'novaglobal':
    case 'dhlexpress':
      return Api.request('get', `${vendor}/${country}`, {
        width,
        height,
        length,
        weight,
      });
    case 'westernbid':
    case 'selleronline':
    case 'skladusa':
      return getAgentRate(
        vendor,
        country,
        width,
        height,
        length,
        weight,
        productIndex,
      );
    default:
      throw `Unknown vendor "${vendor}"`;
  }
}
