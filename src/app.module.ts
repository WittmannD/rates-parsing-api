import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppService } from './app.service';
import { ParsingModule } from './parsing/parsing.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Config from './common/config';
import { HttpLoggerMiddleware } from './common/middlewares/http-logger.middleware';
import { ParsingController } from './parsing/parsing.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [Config] }),
    TypeOrmModule.forRootAsync({
      useFactory: async (configService: ConfigService) => {
        const url = configService.get('DATABASE_URL');

        const credentials = url
          ? { url }
          : {
              host: configService.get('DATABASE_HOST'),
              port: configService.get('DATABASE_PORT'),
              username: configService.get('DATABASE_USER'),
              password: configService.get('DATABASE_PASS'),
              database: configService.get('DATABASE_NAME'),
            };

        return {
          type: 'postgres',
          ...credentials,
          ssl: {
            rejectUnauthorized: false,
          },
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: configService.get('NODE_ENV') === 'production',
        };
      },
      inject: [ConfigService],
    }),
    ParsingModule,
  ],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer.apply(HttpLoggerMiddleware).forRoutes(ParsingController);
  }
}
