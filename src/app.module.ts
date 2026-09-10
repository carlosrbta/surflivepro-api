import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module.js';
import { AuthGuard } from './auth/guards/auth.guard.js';
import { AuthorizationGuard } from './auth/guards/authorization.guard.js';
import { validateEnv } from './config/env.validation.js';
import { DatabaseModule } from './database/database.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { EventsModule } from './modules/events/events.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { OrganizationsModule } from './modules/organizations/organizations.module.js';
import { RealtimeModule } from './modules/realtime/realtime.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    DatabaseModule,
    AuthModule,
    AuditModule,
    OrganizationsModule,
    EventsModule,
    HealthModule,
    RealtimeModule,
  ],
  providers: [
    // Defense-in-depth for Nest-routed endpoints. Better Auth's own routes
    // are raw Express middleware (see main.ts) and use its own built-in
    // rateLimit config instead (doc decision — Nest guards never see them).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Controller -> AuthGuard -> AuthorizationGuard -> ... (doc §7).
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: AuthorizationGuard },
  ],
})
export class AppModule {}
