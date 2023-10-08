import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppService } from './app.service';
import { ParsingModule } from './parsing/parsing.module';
import { ConfigModule } from '@nestjs/config';
import Config from './common/config';
import { HttpLoggerMiddleware } from './common/middlewares/http-logger.middleware';
import { ParsingController } from './parsing/parsing.controller';

@Module({
  imports: [
    ParsingModule,
    ConfigModule.forRoot({ isGlobal: true, load: [Config] }),
  ],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer.apply(HttpLoggerMiddleware).forRoutes(ParsingController);
  }
}
