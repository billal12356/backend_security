import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();
  app.use(cookieParser());

  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : true;

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3000);
  const host = '0.0.0.0';

  await app.listen(port, host);
  logger.log(
    `Application running on http://${host}:${port} [${process.env.NODE_ENV ?? 'development'}]`,
  );
}

await bootstrap();
