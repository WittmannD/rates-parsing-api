import { IsBase64, IsDefined, IsInt, IsOptional, IsString, Min, NotEquals, ValidateIf } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { decodeBase64JSON } from '../../common/helpers';

export class ParsingQueryDTO {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  width: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  height: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  length: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  weight: number;

  @IsString()
  @IsOptional()
  seed?: string;

  @NotEquals(null)
  @ValidateIf((object, value) => value !== undefined)
  @Transform(({ value }) => decodeBase64JSON(value))
  requestData?: Record<string, any>;
}
