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
) {
  const rates = Api.request('get', `${vendor}/${country}`, {
    width,
    height,
    length,
    weight,
  });

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
    case 'skladusa':
      return getAgentRate(
        vendor,
        country,
        width,
        height,
        length,
        weight,
        searchPattern,
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
): number[][] {
  searchPatterns = searchPatterns || ['\\w+'];
  const result = [];
  for (const [width, height, length, weight] of parameters) {
    const row = [];

    for (const searchPattern of searchPatterns) {
      const rate = parse(
        vendor,
        country,
        width,
        height,
        length,
        weight,
        searchPattern,
      );
      row.push(rate);
    }

    result.push(row);
  }
  return result;
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
