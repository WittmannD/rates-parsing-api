import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ParsingModule } from './parsing/parsing.module';
import { ConfigModule } from '@nestjs/config';
import Config from './common/config';

@Module({
  imports: [
    ParsingModule,
    ConfigModule.forRoot({ isGlobal: true, load: [Config] }),
  ],
  providers: [AppService],
})
export class AppModule {}
