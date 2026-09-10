import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, type AuditResult } from './entities/audit-log.entity.js';

export interface RecordAuditEntryInput {
  actorUserId: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  organizationId?: string | null;
  eventId?: string | null;
  result: AuditResult;
  ip?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async record(input: RecordAuditEntryInput): Promise<void> {
    const entry = this.auditLogRepository.create({
      actorUserId: input.actorUserId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId ?? null,
      organizationId: input.organizationId ?? null,
      eventId: input.eventId ?? null,
      result: input.result,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    });

    await this.auditLogRepository.save(entry);
  }
}
