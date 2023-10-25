import {
  IsArray,
  IsOptional,
  IsString,
  NotEquals,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { decodeBase64JSON, decodeGzipJSON } from '../../common/helpers';

export class BatchParsingQueryDTO {
  @NotEquals(null)
  @IsArray({ each: true })
  @Transform(({ value }) => {
    const decoded = decodeGzipJSON(value);
    return decoded?.map((row: Array<any>) => row?.map((val) => Number(val)));
  })
  parameters: [number, number, number, number][];

  @IsString()
  @IsOptional()
  seed?: string;

  @NotEquals(null)
  @ValidateIf((object, value) => value !== undefined)
  @Transform(({ value }) => decodeBase64JSON(value))
  requestData?: Record<string, any>;
}
