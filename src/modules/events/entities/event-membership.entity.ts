import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import type { EventRole } from '../../../auth/authorization/roles.js';
import type { MembershipStatus } from '../../organizations/entities/organization-membership.entity.js';
import { Event } from './event.entity.js';

/**
 * User <-> Event relation (doc §5). Unlike OrganizationMembership, a user can
 * hold multiple roles on the same Event, so the unique constraint includes
 * `role` rather than being just (eventId, userId).
 */
@Entity('event_memberships')
@Unique(['eventId', 'userId', 'role'])
export class EventMembership {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'event_id', type: 'uuid' })
  @Index()
  eventId!: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event?: Event;

  /** References Better Auth's `user.id` — no DB-level FK across the two schemas. */
  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  @Index()
  userId!: string;

  @Column({ type: 'varchar', length: 32 })
  role!: EventRole;

  @Column({ type: 'varchar', length: 16, default: 'active' })
  status!: MembershipStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
