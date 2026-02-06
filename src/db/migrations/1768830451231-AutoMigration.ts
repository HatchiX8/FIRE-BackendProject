import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1768830451231 implements MigrationInterface {
    name = 'AutoMigration1768830451231'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "deals" DROP COLUMN "note"`);
        await queryRunner.query(`ALTER TABLE "deals" ADD "is_voided" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "deals" ADD "voided_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "lots" ADD "is_voided" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "lots" ADD "voided_at" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lots" DROP COLUMN "voided_at"`);
        await queryRunner.query(`ALTER TABLE "lots" DROP COLUMN "is_voided"`);
        await queryRunner.query(`ALTER TABLE "deals" DROP COLUMN "voided_at"`);
        await queryRunner.query(`ALTER TABLE "deals" DROP COLUMN "is_voided"`);
        await queryRunner.query(`ALTER TABLE "deals" ADD "note" text`);
    }

}
