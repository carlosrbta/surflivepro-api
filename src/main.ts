import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { toNodeHandler } from 'better-auth/node';
import { json } from 'express';
import { auth } from './auth/auth.js';
import { AppModule } from './app.module.js';
import type { EnvConfig } from './config/env.validation.js';

async function bootstrap(): Promise<void> {
  // Better Auth parses the request body itself, so its routes must be
  // mounted before Nest's global body parser — hence bodyParser: false here
  // and an explicit express.json() for everything else below.
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  const configService = app.get(ConfigService<EnvConfig, true>);

  app.enableCors({
    origin: configService.get('CORS_ORIGIN', { infer: true }),
    credentials: true,
  });

  app.use('/api/auth/*splat', toNodeHandler(auth));
  app.use(json());

  const port = configService.get('PORT', { infer: true });
  await app.listen(port);
}

void bootstrap();
