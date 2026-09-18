import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Increase payload limit for media / base64 image uploads
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // origin: true tự động phản hồi theo Origin request, cho phép cả Netlify, Vercel lẫn localhost
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Server successfully started on http://localhost:${port}/api`);
  logger.log(`WebSocket Gateway available at ws://localhost:${port}/escrow`);
}
void bootstrap();
