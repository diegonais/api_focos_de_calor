import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateViirsDetailsTable20260316110200
  implements MigrationInterface
{
  public readonly name = 'CreateViirsDetailsTable20260316110200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'viirs_details',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'detection_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'bright_ti4',
            type: 'numeric',
            precision: 10,
            scale: 3,
            isNullable: false,
          },
          {
            name: 'bright_ti5',
            type: 'numeric',
            precision: 10,
            scale: 3,
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

    await queryRunner.createForeignKey(
      'viirs_details',
      new TableForeignKey({
        name: 'FK_viirs_details_detection_id',
        columnNames: ['detection_id'],
        referencedTableName: 'detections',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createIndex(
      'viirs_details',
      new TableIndex({
        name: 'UQ_viirs_details_detection_id',
        columnNames: ['detection_id'],
        isUnique: true,
      }),
    );

    await queryRunner.query(`
      CREATE TRIGGER "TRG_viirs_details_set_updated_at"
      BEFORE UPDATE ON "viirs_details"
      FOR EACH ROW
      EXECUTE FUNCTION "public"."set_updated_at"()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS "TRG_viirs_details_set_updated_at" ON "viirs_details"
    `);
    await queryRunner.dropIndex('viirs_details', 'UQ_viirs_details_detection_id');
    await queryRunner.dropForeignKey('viirs_details', 'FK_viirs_details_detection_id');
    await queryRunner.dropTable('viirs_details');
  }
}
