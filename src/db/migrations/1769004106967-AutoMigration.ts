import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1769004106967 implements MigrationInterface {
    name = 'AutoMigration1769004106967'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "deals" ADD "sell_cost" numeric(12,2) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "deals" DROP COLUMN "sell_cost"`);
    }

}
