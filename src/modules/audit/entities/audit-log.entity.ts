import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type AuditResult = 'SUCCESS' | 'DENIED';

@Entity('audit_log')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'actor_user_id', type: 'varchar', length: 255 })
  @Index()
  actorUserId!: string;

  @Column({ type: 'varchar', length: 64 })
  @Index()
  action!: string;

  @Column({ type: 'varchar', length: 64 })
  resource!: string;

  @Column({ name: 'resource_id', type: 'varchar', length: 255, nullable: true })
  resourceId!: string | null;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  @Index()
  organizationId!: string | null;

  @Column({ name: 'event_id', type: 'uuid', nullable: true })
  @Index()
  eventId!: string | null;

  @Column({ type: 'varchar', length: 16 })
  result!: AuditResult;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip!: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 512, nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt!: Date;
}
