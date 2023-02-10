import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.connectMicroservice({
    transport: Transport.TCP,
    options: { port: configService.get<number>('MS_PORT') },
  });
  await app.startAllMicroservices();
  await app.listen(configService.get<number>('PORT'));
}
bootstrap();
