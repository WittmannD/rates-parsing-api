import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ParsingService } from './parsing.service';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Controller('parsing')
@UseInterceptors(CacheInterceptor)
export class ParsingController {
  constructor(private readonly parsingService: ParsingService) {}

  @Get(':vendor/:country')
  async parse(
    @Param('vendor') vendor: string,
    @Param('country') country: string,
    @Query('width', new ParseIntPipe()) width: number,
    @Query('height', new ParseIntPipe()) height: number,
    @Query('length', new ParseIntPipe()) length: number,
    @Query('weight', new ParseIntPipe()) weight: number,
  ) {
    console.log(vendor);
    switch (vendor.toLowerCase().trim()) {
      case 'novaglobal':
        return await this.parsingService.parseNovaGlobal(
          country,
          { width, height, length },
          weight,
        );
      case 'dhlexpress':
        return await this.parsingService.parseDhlExpress(
          country,
          { width, height, length },
          weight,
        );
      case 'westernbid':
        return await this.parsingService.parseWesternBid(
          country,
          { width, height, length },
          weight,
        );
      case 'selleronline':
        return await this.parsingService.parseSellerOnline(
          country,
          { width, height, length },
          weight,
        );
      case 'skladusa':
        return await this.parsingService.parseSkladUsa(
          country,
          { width, height, length },
          weight,
        );
      default:
        throw new BadRequestException(`Unknown vendor "${vendor}"`);
    }
  }
}
