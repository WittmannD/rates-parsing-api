import { ParsingService } from '../src/parsing/parsing.service';

const Helpers = {
  querystring(obj: Record<string, any>) {
    return Object.entries(obj)
      .flatMap(([k, v]) =>
        Array.isArray(v)
          ? v.map((e) => `${k}=${encodeURIComponent(e)}`)
          : `${k}=${encodeURIComponent(v)}`,
      )
      .join('&');
  },

  colA1ToIndex(colA1: string, index: number) {
    if (typeof colA1 !== 'string' || colA1.length > 2)
      throw new Error('Expected column label.');

    // Ensure index is (default) 0 or 1, no other values accepted.
    index = index || 0;
    index = index == 0 ? 0 : 1;

    const A = 'A'.charCodeAt(0);

    let number = colA1.charCodeAt(colA1.length - 1) - A;
    if (colA1.length == 2) {
      number += 26 * (colA1.charCodeAt(0) - A + 1);
    }
    return number + index;
  },

  rowA1ToIndex(rowA1: string, index: number) {
    // Ensure index is (default) 0 or 1, no other values accepted.
    index = index || 0;
    index = index == 0 ? 0 : 1;

    return Number(rowA1) - 1 + index;
  },

  chunks(array: any[], size: number) {
    const _chunks = [];

    for (let i = 0; i < array.length; i += size) {
      _chunks.push(array.slice(i, i + size));
    }

    return _chunks;
  },

  cellA1ToIndex(cellA1: string, index: number) {
    index = index || 0;
    index = index == 0 ? 0 : 1;

    const match = cellA1.match(/(^[A-Z]+)|([0-9]+$)/gm);

    if (match.length != 2) throw new Error('Invalid cell reference');

    const colA1 = match[0];
    const rowA1 = match[1];

    return {
      row: this.rowA1ToIndex(rowA1, index),
      col: this.colA1ToIndex(colA1, index),
    };
  },

  md5(inputString: string) {
    return Utilities.computeDigest(
      Utilities.DigestAlgorithm.MD5,
      inputString,
    ).reduce(
      (output, byte) => output + (byte & 255).toString(16).padStart(2, '0'),
      '',
    );
  },

  compressQueryParameter(obj: Record<any, any>) {
    const jsonString = JSON.stringify(obj);
    const textBlob = Utilities.newBlob(jsonString);
    const gzipBlob = Utilities.gzip(textBlob);
    return Utilities.base64Encode(gzipBlob.getBytes());
  },

  getObjectSig(obj: Record<any, any>) {
    const orderedObj = Object.fromEntries(Object.entries(obj).sort());
    return this.md5(JSON.stringify(orderedObj));
  },

  getRegexGroup(text: string, pattern: string, index: number) {
    return new RegExp(pattern).exec(text)?.[index];
  },
};

export default Helpers;
