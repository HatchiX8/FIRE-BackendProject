import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1768827962961 implements MigrationInterface {
    name = 'AutoMigration1768827962961'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "deals" DROP CONSTRAINT "FK_5cf0f8f1822d7ecc44eed1db44f"`);
        await queryRunner.query(`CREATE TABLE "lots" ("lot_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "stock_id" character varying(10) NOT NULL, "stock_name" character varying(50) NOT NULL, "buy_date" date NOT NULL, "buy_price" numeric(12,4) NOT NULL, "buy_quantity" integer NOT NULL, "remaining_quantity" integer NOT NULL, "buy_amount" numeric(14,2) NOT NULL, "note" character varying(100), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a45e2701b70fe721cad8cc8a1a8" PRIMARY KEY ("lot_id"))`);
        await queryRunner.query(`CREATE INDEX "idx_lots_user_open" ON "lots" ("user_id") WHERE remaining_quantity > 0`);
        await queryRunner.query(`CREATE INDEX "idx_lots_stock" ON "lots" ("stock_id") `);
        await queryRunner.query(`CREATE INDEX "idx_lots_user_stock" ON "lots" ("user_id", "stock_id") `);
        await queryRunner.query(`ALTER TABLE "deals" ADD "lot_id" uuid`);
        await queryRunner.query(`ALTER TABLE "deals" DROP CONSTRAINT "PK_37d7d76a2c3461664e4277d368d"`);
        await queryRunner.query(`ALTER TABLE "deals" ADD CONSTRAINT "PK_c832ac4f9b1ef2c1e9989dd716c" PRIMARY KEY ("trade_id")`);
        await queryRunner.query(`CREATE INDEX "idx_deals_user_date" ON "deals" ("user_id", "deal_date") `);
        await queryRunner.query(`CREATE INDEX "idx_deals_user_type" ON "deals" ("user_id", "type") `);
        await queryRunner.query(`CREATE INDEX "idx_deals_lot" ON "deals" ("lot_id") `);
        await queryRunner.query(`ALTER TABLE "deals" ADD CONSTRAINT "FK_5cf0f8f1822d7ecc44eed1db44f" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "deals" ADD CONSTRAINT "FK_fe882347c651bdc393638f51f72" FOREIGN KEY ("lot_id") REFERENCES "lots"("lot_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lots" ADD CONSTRAINT "FK_0d5475dec78022776a348ce133f" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lots" DROP CONSTRAINT "FK_0d5475dec78022776a348ce133f"`);
        await queryRunner.query(`ALTER TABLE "deals" DROP CONSTRAINT "FK_fe882347c651bdc393638f51f72"`);
        await queryRunner.query(`ALTER TABLE "deals" DROP CONSTRAINT "FK_5cf0f8f1822d7ecc44eed1db44f"`);
        await queryRunner.query(`DROP INDEX "public"."idx_deals_lot"`);
        await queryRunner.query(`DROP INDEX "public"."idx_deals_user_type"`);
        await queryRunner.query(`DROP INDEX "public"."idx_deals_user_date"`);
        await queryRunner.query(`ALTER TABLE "deals" DROP CONSTRAINT "PK_c832ac4f9b1ef2c1e9989dd716c"`);
        await queryRunner.query(`ALTER TABLE "deals" ADD CONSTRAINT "PK_37d7d76a2c3461664e4277d368d" PRIMARY KEY ("trade_id", "user_id")`);
        await queryRunner.query(`ALTER TABLE "deals" DROP COLUMN "lot_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_lots_user_stock"`);
        await queryRunner.query(`DROP INDEX "public"."idx_lots_stock"`);
        await queryRunner.query(`DROP INDEX "public"."idx_lots_user_open"`);
        await queryRunner.query(`DROP TABLE "lots"`);
        await queryRunner.query(`ALTER TABLE "deals" ADD CONSTRAINT "FK_5cf0f8f1822d7ecc44eed1db44f" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
