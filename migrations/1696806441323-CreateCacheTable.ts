import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCacheTable1696806441323 implements MigrationInterface {
  name = 'CreateCacheTable1696806441323';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "cache_entity" ("key" character varying NOT NULL, "value" jsonb NOT NULL, "expired" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5f0319b06c76e8279ea0d98383e" PRIMARY KEY ("key"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "cache_entity"`);
  }
}
