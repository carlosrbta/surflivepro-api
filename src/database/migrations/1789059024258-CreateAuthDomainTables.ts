import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Organizations, Organization/Event memberships, Events and the Audit Log.
 *
 * Better Auth owns its own tables (user/session/account/verification) via
 * its own migration tool (`pnpm auth:migrate`) — run that first. `user_id`
 * columns here are plain varchars referencing Better Auth's `user.id`, with
 * no DB-level FK across the two migration systems (see
 * documentation/AUTH-IMPLEMENTATION.md decisions).
 */
export class CreateAuthDomainTables1789059024258 implements MigrationInterface {
  name = 'CreateAuthDomainTables1789059024258';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE "organizations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_organizations" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "organization_memberships" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "organization_id" uuid NOT NULL,
        "user_id" varchar(255) NOT NULL,
        "role" varchar(32) NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_organization_memberships" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_organization_memberships_org_user" UNIQUE ("organization_id", "user_id"),
        CONSTRAINT "FK_organization_memberships_organization" FOREIGN KEY ("organization_id")
          REFERENCES "organizations" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_organization_memberships_organization_id" ON "organization_memberships" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_organization_memberships_user_id" ON "organization_memberships" ("user_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "organization_id" uuid NOT NULL,
        "name" varchar(255) NOT NULL,
        "status" varchar(32) NOT NULL DEFAULT 'DRAFT',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_events" PRIMARY KEY ("id"),
        CONSTRAINT "FK_events_organization" FOREIGN KEY ("organization_id")
          REFERENCES "organizations" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_events_organization_id" ON "events" ("organization_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "event_memberships" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "event_id" uuid NOT NULL,
        "user_id" varchar(255) NOT NULL,
        "role" varchar(32) NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_event_memberships" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_event_memberships_event_user_role" UNIQUE ("event_id", "user_id", "role"),
        CONSTRAINT "FK_event_memberships_event" FOREIGN KEY ("event_id")
          REFERENCES "events" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_event_memberships_event_id" ON "event_memberships" ("event_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_event_memberships_user_id" ON "event_memberships" ("user_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "audit_log" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "actor_user_id" varchar(255) NOT NULL,
        "action" varchar(64) NOT NULL,
        "resource" varchar(64) NOT NULL,
        "resource_id" varchar(255),
        "organization_id" uuid,
        "event_id" uuid,
        "result" varchar(16) NOT NULL,
        "ip" varchar(64),
        "user_agent" varchar(512),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_log" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_log_actor_user_id" ON "audit_log" ("actor_user_id")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_audit_log_action" ON "audit_log" ("action")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_log_organization_id" ON "audit_log" ("organization_id")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_audit_log_event_id" ON "audit_log" ("event_id")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_log_created_at" ON "audit_log" ("created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "audit_log"`);
    await queryRunner.query(`DROP TABLE "event_memberships"`);
    await queryRunner.query(`DROP TABLE "events"`);
    await queryRunner.query(`DROP TABLE "organization_memberships"`);
    await queryRunner.query(`DROP TABLE "organizations"`);
  }
}
