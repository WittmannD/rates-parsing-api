import { IsEnum, Validate } from 'class-validator';
import { Vendor } from '../../common/enums';
import { Transform } from 'class-transformer';
import { Country } from '../../common/country';
import { IsAcceptableCountry } from '../../common/validatots/is-acceptable-country.validator';

export class ParsingParams {
  @IsEnum(Vendor)
  vendor: Vendor;

  @Validate(IsAcceptableCountry, { message: 'Invalid country' })
  @Transform(({ value }) => Country.get(value))
  country: Country;
}
