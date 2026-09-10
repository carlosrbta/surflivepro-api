import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import type { OrganizationRole } from '../../../auth/authorization/roles.js';
import { Organization } from './organization.entity.js';

export type MembershipStatus = 'active' | 'inactive';

/**
 * User <-> Organization relation (doc §5). One role per (organization, user) —
 * unlike EventMembership, the doc doesn't ask for multiple org roles per user.
 */
@Entity('organization_memberships')
@Unique(['organizationId', 'userId'])
export class OrganizationMembership {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  @Index()
  organizationId!: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  /** References Better Auth's `user.id` — no DB-level FK across the two schemas. */
  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  @Index()
  userId!: string;

  @Column({ type: 'varchar', length: 32 })
  role!: OrganizationRole;

  @Column({ type: 'varchar', length: 16, default: 'active' })
  status!: MembershipStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
