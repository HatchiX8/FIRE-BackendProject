import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1766668894791 implements MigrationInterface {
    name = 'AutoMigration1766668894791'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_url"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "avatar_url" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_url"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "avatar_url" character varying(255)`);
    }

}
