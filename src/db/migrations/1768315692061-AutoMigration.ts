import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1768315692061 implements MigrationInterface {
    name = 'AutoMigration1768315692061'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "current_stock_prices" ALTER COLUMN "close_price" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "current_stock_prices" ALTER COLUMN "close_price" SET NOT NULL`);
    }

}
