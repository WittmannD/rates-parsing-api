import {
  Controller,
  Get,
  Logger,
  Param,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ParsingService } from './parsing.service';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { ParsingParams } from './dto/parsing-params';
import { ParsingQueryDTO } from './dto/parsing-query.dto';

@Controller('parsing')
@UseInterceptors(CacheInterceptor)
export class ParsingController {
  private readonly logger = new Logger(ParsingController.name);
  constructor(private readonly parsingService: ParsingService) {}

  @Get(':vendor/:country')
  async parse(@Param() params: ParsingParams, @Query() query: ParsingQueryDTO) {
    const { vendor, country } = params;
    const { width, height, length, weight } = query;

    this.logger.log(`Getting rates of ${vendor} for country ${country}`)

    return this.parsingService.parse(
      vendor,
      country,
      { width, height, length },
      weight,
    );
  }
}
