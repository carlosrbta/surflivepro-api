import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module.js';
import { EventMembership } from './entities/event-membership.entity.js';
import { Event } from './entities/event.entity.js';
import { EventPolicy } from './event.policy.js';
import { EventsController } from './events.controller.js';
import { EventsService } from './events.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Event, EventMembership]), AuditModule],
  controllers: [EventsController],
  providers: [EventsService, EventPolicy],
  exports: [EventsService],
})
export class EventsModule {}
