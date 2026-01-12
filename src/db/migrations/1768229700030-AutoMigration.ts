import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1768229700030 implements MigrationInterface {
    name = 'AutoMigration1768229700030'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "stock_metadata" ("stock_id" character varying(10) NOT NULL, "stock_name" character varying(100) NOT NULL, "missing_days" integer NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "last_seen" date, "note" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_51e004712677cd4a9922fca176f" PRIMARY KEY ("stock_id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "stock_metadata"`);
    }

}
