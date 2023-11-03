import * as countries from 'countryjs';

export class Country {
  constructor(private readonly _code: string) {}

  static get(id: string) {
    const codes =
      countries.ISOcodes(id.toUpperCase(), 'ISO2') ||
      countries.ISOcodes(id.toUpperCase(), 'ISO3') ||
      countries.ISOcodes(id, 'name');

    if (!codes) return null;

    return new Country(codes.alpha2);
  }

  get code(): string {
    return this._code;
  }

  get name(): string {
    return countries.name(this._code);
  }

  get names(): string[] {
    return [countries.name(this._code), ...countries.altSpellings(this._code)];
  }

  get capital(): string {
    return countries.capital(this._code);
  }

  toString() {
    return this._code;
  }

  toJSON() {
    return this._code;
  }
}
