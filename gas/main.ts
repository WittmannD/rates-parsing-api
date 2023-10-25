import Api from './api';
import Helpers from './helpers';
import Events from './events';
import Application from './application';

function getAgentRate(
  vendor: string,
  country: string,
  width: number,
  height: number,
  length: number,
  weight: number,
  searchPattern?: string,
  requestData?: string,
) {
  const data = {
    width,
    height,
    length,
    weight,
  };

  if (requestData) data['requestData'] = requestData;

  const rates = Api.request('get', `${vendor}/${country}`, data);

  const entries = Object.entries(rates);

  if (!searchPattern) return entries;

  const rate = entries
    .sort()
    .find(([product]) => new RegExp(searchPattern).test(product));

  return rate?.[1];
}

/**
 * A custom function that returns matched groups
 *
 * @param {string} text
 * @param {string} pattern
 * @param {number} index
 * @return {number}
 * @customfunction
 */
export function regexGroup(text: string, pattern: string, index: number) {
  return Helpers.getRegexGroup(text, pattern, index);
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
 * @param {string} [searchPattern] [optional]
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
  searchPattern?: string,
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
      return getAgentRate(
        vendor,
        country,
        width,
        height,
        length,
        weight,
        searchPattern,
      );
    case 'skladusa':
      return getAgentRate(
        vendor,
        country,
        width,
        height,
        length,
        weight,
        searchPattern,
        'eyJmb3JtW2NsaWVudFBQXVtdIjoiWWVzIn0=',
      );
    default:
      throw `Unknown vendor "${vendor}"`;
  }
}

export function batchParse(
  vendor: string,
  country: string,
  parameters: [number, number, number, number][],
  searchPatterns?: string[],
): (number | null)[][] {
  searchPatterns = Array.isArray(searchPatterns?.[0])
    ? searchPatterns[0]
    : typeof searchPatterns === 'string'
    ? [searchPatterns]
    : searchPatterns;
  vendor = vendor.toLowerCase().trim();

  const data = {
    parameters: Helpers.compressQueryParameter(parameters),
  };

  if (vendor === 'skladusa')
    data['requestData'] = 'eyJmb3JtW2NsaWVudFBQXVtdIjoiWWVzIn0=';

  const result = Api.request('get', `batch/${vendor}/${country}`, data);

  if (
    vendor === 'skladusa' ||
    vendor === 'westernbid' ||
    vendor === 'selleronline'
  ) {
    if (!searchPatterns) {
      const columns = new Set();

      for (const rates of result) {
        if (rates === null) continue;

        for (const key of Object.keys(rates)) {
          columns.add(key);
        }
      }

      return result.map((rates: any) => {
        if (rates === null) return Array(columns.size).fill(null);

        return Array.from(columns).map((column) => {
          return (
            Object.entries(rates).find(
              ([product]) => column === product.trim(),
            )?.[1] || null
          );
        });
      });
    }

    return result.map((rates: any) => {
      if (rates === null) return Array(searchPatterns.length).fill(null);

      return searchPatterns.map((column) => {
        return (
          Object.entries(rates).find(([product]) =>
            new RegExp(column).test(product.trim()),
          )?.[1] || null
        );
      });
    });
  }

  console.log(result);

  return result.map((rate: number | null) => [rate]);
}

export function parseByReference(
  vendor: string,
  country: string,
  parametersRange: string,
  destinationCell: string,
  searchPatterns?: string[],
) {
  const spreadsheet = SpreadsheetApp.getActive();
  const range = spreadsheet.getRange(parametersRange);
  const parameters = range.getValues();

  if (parameters[0].length !== 4)
    throw `Invalid parameters range dimension; Expected (width, height, length, weight) 4 parameters, instead got ${parameters[0].length}`;

  const [cell, sheetName] = destinationCell.split('!').reverse();

  let destinationSheet: GoogleAppsScript.Spreadsheet.Sheet;

  if (sheetName) {
    destinationSheet = spreadsheet.getSheetByName(sheetName);
  } else {
    destinationSheet = spreadsheet.getActiveSheet();
  }

  const { row, col } = Helpers.cellA1ToIndex(cell, 1);
  const chunkSize = 5;
  let i = 0;

  for (const chunk of Helpers.chunks(parameters, chunkSize)) {
    const destinationRange = destinationSheet.getRange(
      row + chunkSize * i,
      col,
      chunk.length,
      searchPatterns.length || 1,
    );

    const result = batchParse(
      vendor,
      country,
      chunk as [number, number, number, number][],
      searchPatterns,
    );
    i++;

    destinationRange.setValues(result);
    SpreadsheetApp.flush();
  }

  return;
}

export function onOpen(e: any) {
  Events.onOpen(e);
}

export function openParsingDialog() {
  Application.openParsingDialog();
}

export function getSelectedRange() {
  const spreadsheet = SpreadsheetApp.getActive();
  const range = spreadsheet.getActiveRange();
  return range.getA1Notation();
}

export function getSelectedCell() {
  const spreadsheet = SpreadsheetApp.getActive();
  const cell = spreadsheet.getActiveCell();
  return cell.getA1Notation();
}
