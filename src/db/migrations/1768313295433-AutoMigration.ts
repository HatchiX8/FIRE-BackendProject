import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1768313295433 implements MigrationInterface {
    name = 'AutoMigration1768313295433'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "current_stock_prices" ("stock_id" character varying(10) NOT NULL, "stock_name" character varying(100) NOT NULL, "close_price" numeric(10,2) NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_cd54034ee0ee97d8c2c8fdf3006" PRIMARY KEY ("stock_id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "current_stock_prices"`);
    }

}
