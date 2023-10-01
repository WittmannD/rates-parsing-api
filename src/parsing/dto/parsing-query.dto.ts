import { IsInt, Min } from 'class-validator';

export class ParsingQueryDTO {
  @IsInt()
  @Min(1)
  width: number;

  @IsInt()
  @Min(1)
  height: number;

  @IsInt()
  @Min(1)
  length: number;

  @IsInt()
  @Min(1)
  weight: number;
}
