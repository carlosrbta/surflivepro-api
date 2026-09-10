import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity.js';

export type EventStatus = 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';

/**
 * Deliberately minimal — just enough to anchor EventMembership and
 * organization-isolation checks for this auth task. The full
 * Competition/Event domain (dates, location, categories, heats) is future
 * work (see documentation/AUTH-IMPLEMENTATION.md §5, §17).
 */
@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  @Index()
  organizationId!: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 32, default: 'DRAFT' })
  status!: EventStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
