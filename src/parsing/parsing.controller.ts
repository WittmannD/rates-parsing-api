import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
import { ParsingService } from './parsing.service';
import { ParsingParams } from './dto/parsing-params';
import { ParsingQueryDTO } from './dto/parsing-query.dto';
import { BatchParsingQueryDTO } from './dto/batch-parsing-query.dto';

@Controller('parsing')
export class ParsingController {
  private readonly logger = new Logger(ParsingController.name);
  constructor(private readonly parsingService: ParsingService) {}

  @Get(':vendor/:country')
  async parse(@Param() params: ParsingParams, @Query() query: ParsingQueryDTO) {
    const { vendor, country } = params;
    const { width, height, length, weight, requestData, seed } = query;

    return this.parsingService.parse(
      vendor,
      country,
      { width, height, length },
      weight,
      requestData,
      seed,
    );
  }

  @Get('batch/:vendor/:country')
  async batchParse(
    @Param() params: ParsingParams,
    @Query() query: BatchParsingQueryDTO,
  ) {
    const { vendor, country } = params;
    const { parameters, requestData, seed } = query;

    return this.parsingService.batchParse(
      vendor,
      country,
      parameters,
      requestData,
      seed,
    );
  }
}
