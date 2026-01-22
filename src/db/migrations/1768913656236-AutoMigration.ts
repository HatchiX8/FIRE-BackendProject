import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1768913656236 implements MigrationInterface {
    name = 'AutoMigration1768913656236'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "deals" ADD "realized_pnl" numeric(14,2) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "deals" DROP COLUMN "realized_pnl"`);
    }

}
