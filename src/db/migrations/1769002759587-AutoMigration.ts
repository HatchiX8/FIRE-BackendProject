import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1769002759587 implements MigrationInterface {
    name = 'AutoMigration1769002759587'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_capitals" DROP COLUMN "cost_total"`);
        await queryRunner.query(`ALTER TABLE "deals" ADD "note" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "lots" ADD "remaining_cost" numeric(14,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "deals" DROP CONSTRAINT "FK_fe882347c651bdc393638f51f72"`);
        await queryRunner.query(`ALTER TABLE "deals" ALTER COLUMN "lot_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "deals" ADD CONSTRAINT "FK_fe882347c651bdc393638f51f72" FOREIGN KEY ("lot_id") REFERENCES "lots"("lot_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "deals" DROP CONSTRAINT "FK_fe882347c651bdc393638f51f72"`);
        await queryRunner.query(`ALTER TABLE "deals" ALTER COLUMN "lot_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "deals" ADD CONSTRAINT "FK_fe882347c651bdc393638f51f72" FOREIGN KEY ("lot_id") REFERENCES "lots"("lot_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lots" DROP COLUMN "remaining_cost"`);
        await queryRunner.query(`ALTER TABLE "deals" DROP COLUMN "note"`);
        await queryRunner.query(`ALTER TABLE "user_capitals" ADD "cost_total" numeric(12,2) NOT NULL DEFAULT '0'`);
    }

}
