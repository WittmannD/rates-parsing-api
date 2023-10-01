import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ParsingModule } from './parsing/parsing.module';

@Module({
  imports: [ParsingModule],
  providers: [AppService],
})
export class AppModule {}
