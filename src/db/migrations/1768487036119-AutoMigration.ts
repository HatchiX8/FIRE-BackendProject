import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1768487036119 implements MigrationInterface {
    name = 'AutoMigration1768487036119'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_capitals" ("user_id" uuid NOT NULL, "total_invest" numeric(12,2) NOT NULL DEFAULT '0', "cost_total" numeric(12,2) NOT NULL DEFAULT '0', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_82b9636645819165595ab57a8d3" PRIMARY KEY ("user_id"))`);
        await queryRunner.query(`ALTER TABLE "user_capitals" ADD CONSTRAINT "FK_82b9636645819165595ab57a8d3" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_capitals" DROP CONSTRAINT "FK_82b9636645819165595ab57a8d3"`);
        await queryRunner.query(`DROP TABLE "user_capitals"`);
    }

}
