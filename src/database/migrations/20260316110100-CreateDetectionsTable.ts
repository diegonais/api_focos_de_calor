import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateDetectionsTable20260316110100 implements MigrationInterface {
  public readonly name = 'CreateDetectionsTable20260316110100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    await queryRunner.query(`
      CREATE TYPE "public"."detections_source_type_enum" AS ENUM ('VIIRS', 'MODIS')
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION "public"."set_updated_at"()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updated_at" = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await queryRunner.createTable(
      new Table({
        name: 'detections',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'source_type',
            type: 'enum',
            enumName: 'detections_source_type_enum',
            enum: ['VIIRS', 'MODIS'],
            isNullable: false,
          },
          {
            name: 'latitude',
            type: 'numeric',
            precision: 10,
            scale: 6,
            isNullable: false,
          },
          {
            name: 'longitude',
            type: 'numeric',
            precision: 10,
            scale: 6,
            isNullable: false,
          },
          {
            name: 'scan',
            type: 'numeric',
            precision: 8,
            scale: 3,
            isNullable: false,
          },
          {
            name: 'track',
            type: 'numeric',
            precision: 8,
            scale: 3,
            isNullable: false,
          },
          {
            name: 'acq_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'acq_time',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'satellite',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'instrument',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'confidence',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'version',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'frp',
            type: 'numeric',
            precision: 10,
            scale: 3,
            isNullable: false,
          },
          {
            name: 'daynight',
            type: 'char',
            length: '1',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'detections',
      new TableIndex({
        name: 'IDX_detections_acq_date',
        columnNames: ['acq_date'],
      }),
    );
    await queryRunner.createIndex(
      'detections',
      new TableIndex({
        name: 'IDX_detections_latitude_longitude',
        columnNames: ['latitude', 'longitude'],
      }),
    );
    await queryRunner.createIndex(
      'detections',
      new TableIndex({
        name: 'IDX_detections_satellite',
        columnNames: ['satellite'],
      }),
    );
    await queryRunner.createIndex(
      'detections',
      new TableIndex({
        name: 'IDX_detections_source_type',
        columnNames: ['source_type'],
      }),
    );

    await queryRunner.query(`
      CREATE TRIGGER "TRG_detections_set_updated_at"
      BEFORE UPDATE ON "detections"
      FOR EACH ROW
      EXECUTE FUNCTION "public"."set_updated_at"()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS "TRG_detections_set_updated_at" ON "detections"
    `);
    await queryRunner.dropIndex('detections', 'IDX_detections_source_type');
    await queryRunner.dropIndex('detections', 'IDX_detections_satellite');
    await queryRunner.dropIndex('detections', 'IDX_detections_latitude_longitude');
    await queryRunner.dropIndex('detections', 'IDX_detections_acq_date');
    await queryRunner.dropTable('detections');
    await queryRunner.query(`
      DROP FUNCTION IF EXISTS "public"."set_updated_at"
    `);
    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."detections_source_type_enum"
    `);
  }
}
