import { PartialType } from '@nestjs/mapped-types';
import { CreateParsingDto } from './create-parsing.dto';

export class UpdateParsingDto extends PartialType(CreateParsingDto) {}
