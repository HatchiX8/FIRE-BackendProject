import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1766667956071 implements MigrationInterface {
    name = 'AutoMigration1766667956071'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "user_id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "PK_96aac72f1574b88752e9fb00089" PRIMARY KEY ("user_id")`);
        await queryRunner.query(`ALTER TABLE "users" ADD "google_id" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "user_nickname" character varying(30)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "user_email" character varying(150) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD "role" character varying(20) NOT NULL DEFAULT 'guest'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "is_active" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "users" ADD "upgrade_status" character varying(20) NOT NULL DEFAULT 'none'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "avatar_url" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "user_note" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "last_login_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" ADD "reviewer_id" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD "reviewed_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_user_email" ON "users" ("user_email") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_user_google_id" ON "users" ("google_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_user_google_id"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_user_email"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "reviewed_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "reviewer_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_login_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "user_note"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_url"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "upgrade_status"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_active"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "user_email"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "user_nickname"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "google_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "PK_96aac72f1574b88752e9fb00089"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" ADD "name" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "users" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")`);
    }

}
