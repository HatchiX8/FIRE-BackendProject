import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1769783799747 implements MigrationInterface {
    name = 'AutoMigration1769783799747'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stock_metadata" DROP CONSTRAINT "PK_51e004712677cd4a9922fca176f"`);
        await queryRunner.query(`ALTER TABLE "stock_metadata" DROP COLUMN "stock_id"`);
        await queryRunner.query(`ALTER TABLE "stock_metadata" ADD "stock_id" character varying(20) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "stock_metadata" ADD CONSTRAINT "PK_51e004712677cd4a9922fca176f" PRIMARY KEY ("stock_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stock_metadata" DROP CONSTRAINT "PK_51e004712677cd4a9922fca176f"`);
        await queryRunner.query(`ALTER TABLE "stock_metadata" DROP COLUMN "stock_id"`);
        await queryRunner.query(`ALTER TABLE "stock_metadata" ADD "stock_id" character varying(10) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "stock_metadata" ADD CONSTRAINT "PK_51e004712677cd4a9922fca176f" PRIMARY KEY ("stock_id")`);
    }

}
