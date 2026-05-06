import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertDetectionAcqDateTimeToBoliviaTimezone20260323110000 implements MigrationInterface {
  public readonly name =
    'ConvertDetectionAcqDateTimeToBoliviaTimezone20260323110000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      WITH "converted" AS (
        SELECT
          "id",
          (
            (
              ("acq_date"::text || ' ' || LPAD("acq_time"::text, 4, '0'))::timestamp
              AT TIME ZONE 'UTC'
            )
            AT TIME ZONE 'America/La_Paz'
          ) AS "local_ts"
        FROM "detections"
      )
      UPDATE "detections" AS "d"
      SET
        "acq_date" = "converted"."local_ts"::date,
        "acq_time" = (
          EXTRACT(HOUR FROM "converted"."local_ts")::integer * 100
          + EXTRACT(MINUTE FROM "converted"."local_ts")::integer
        )
      FROM "converted"
      WHERE "d"."id" = "converted"."id"
    `);

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
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      WITH "converted" AS (
        SELECT
          "id",
          (
            (
              ("acq_date"::text || ' ' || LPAD("acq_time"::text, 4, '0'))::timestamp
              AT TIME ZONE 'America/La_Paz'
            )
            AT TIME ZONE 'UTC'
          ) AS "utc_ts"
        FROM "detections"
      )
      UPDATE "detections" AS "d"
      SET
        "acq_date" = "converted"."utc_ts"::date,
        "acq_time" = (
          EXTRACT(HOUR FROM "converted"."utc_ts")::integer * 100
          + EXTRACT(MINUTE FROM "converted"."utc_ts")::integer
        )
      FROM "converted"
      WHERE "d"."id" = "converted"."id"
    `);

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
    `);
  }
}
