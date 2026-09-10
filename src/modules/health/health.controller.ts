import { Controller, Get } from '@nestjs/common';

import { Public } from '../../auth/decorators/public.decorator.js';
import type { HealthStatus } from '../../types/index.js';
import { healthStatusSchema } from '../../validation/healthStatusSchema.js';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check(): HealthStatus {
    const status: HealthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };

    return healthStatusSchema.parse(status);
  }
}
