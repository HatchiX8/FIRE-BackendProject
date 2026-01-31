import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1768715736979 implements MigrationInterface {
    name = 'AutoMigration1768715736979'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "deals" ("trade_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "stock_id" character varying(30) NOT NULL, "stock_name" character varying(50) NOT NULL, "type" character varying(10) NOT NULL, "total_cost" numeric(12,2) NOT NULL, "price" numeric(12,2) NOT NULL, "quantity" integer NOT NULL, "note" text, "deal_date" date NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_37d7d76a2c3461664e4277d368d" PRIMARY KEY ("trade_id", "user_id"))`);
        await queryRunner.query(`ALTER TABLE "deals" ADD CONSTRAINT "FK_5cf0f8f1822d7ecc44eed1db44f" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "deals" DROP CONSTRAINT "FK_5cf0f8f1822d7ecc44eed1db44f"`);
        await queryRunner.query(`DROP TABLE "deals"`);
    }

}
