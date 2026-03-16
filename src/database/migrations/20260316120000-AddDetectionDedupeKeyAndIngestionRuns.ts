import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class AddDetectionDedupeKeyAndIngestionRuns20260316120000
  implements MigrationInterface
{
  public readonly name = 'AddDetectionDedupeKeyAndIngestionRuns20260316120000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'detections',
      new TableColumn({
        name: 'dedupe_key',
        type: 'varchar',
        length: '64',
        isNullable: true,
      }),
    );

    await queryRunner.query(`
      UPDATE "detections"
      SET "dedupe_key" = encode(
        digest(
          concat_ws(
            '|',
            "source_type",
            "satellite",
            "instrument",
            "acq_date"::text,
            LPAD("acq_time"::text, 4, '0'),
            "latitude"::text,
            "longitude"::text,
            "scan"::text,
            "track"::text,
            "confidence",
            "version",
            "frp"::text,
            "daynight"
          ),
          'sha256'
        ),
        'hex'
      )
      WHERE "dedupe_key" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "detections"
      ALTER COLUMN "dedupe_key" SET NOT NULL
    `);

    await queryRunner.createIndex(
      'detections',
      new TableIndex({
        name: 'UQ_detections_dedupe_key',
        columnNames: ['dedupe_key'],
        isUnique: true,
      }),
    );

    await queryRunner.query(`
      CREATE TYPE "public"."ingestion_runs_status_enum" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED', 'SKIPPED')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."ingestion_runs_trigger_enum" AS ENUM ('BOOT', 'SCHEDULED')
    `);

    await queryRunner.createTable(
      new Table({
        name: 'ingestion_runs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'status',
            type: 'enum',
            enumName: 'ingestion_runs_status_enum',
            enum: ['RUNNING', 'SUCCEEDED', 'FAILED', 'SKIPPED'],
            isNullable: false,
          },
          {
            name: 'trigger',
            type: 'enum',
            enumName: 'ingestion_runs_trigger_enum',
            enum: ['BOOT', 'SCHEDULED'],
            isNullable: false,
          },
          {
            name: 'sources',
            type: 'text',
            isArray: true,
            isNullable: false,
          },
          {
            name: 'lookback_days',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'fetched_count',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'inserted_count',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'duplicate_count',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'duration_ms',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'started_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'finished_at',
            type: 'timestamptz',
            isNullable: true,
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
      'ingestion_runs',
      new TableIndex({
        name: 'IDX_ingestion_runs_started_at',
        columnNames: ['started_at'],
      }),
    );

    await queryRunner.createIndex(
      'ingestion_runs',
      new TableIndex({
        name: 'IDX_ingestion_runs_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.query(`
      CREATE TRIGGER "TRG_ingestion_runs_set_updated_at"
      BEFORE UPDATE ON "ingestion_runs"
      FOR EACH ROW
      EXECUTE FUNCTION "public"."set_updated_at"()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS "TRG_ingestion_runs_set_updated_at" ON "ingestion_runs"
    `);
    await queryRunner.dropIndex('ingestion_runs', 'IDX_ingestion_runs_status');
    await queryRunner.dropIndex('ingestion_runs', 'IDX_ingestion_runs_started_at');
    await queryRunner.dropTable('ingestion_runs');
    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."ingestion_runs_trigger_enum"
    `);
    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."ingestion_runs_status_enum"
    `);
    await queryRunner.dropIndex('detections', 'UQ_detections_dedupe_key');
    await queryRunner.dropColumn('detections', 'dedupe_key');
  }
}
