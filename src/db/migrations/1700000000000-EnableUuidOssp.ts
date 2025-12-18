import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableUuidOssp1700000000000 implements MigrationInterface {
  name = 'EnableUuidOssp1700000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
  }

  async down(): Promise<void> {}
}
