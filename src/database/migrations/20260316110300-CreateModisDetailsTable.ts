import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateModisDetailsTable20260316110300
  implements MigrationInterface
{
  public readonly name = 'CreateModisDetailsTable20260316110300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'modis_details',
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
            name: 'brightness',
            type: 'numeric',
            precision: 10,
            scale: 3,
            isNullable: false,
          },
          {
            name: 'bright_t31',
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
      'modis_details',
      new TableForeignKey({
        name: 'FK_modis_details_detection_id',
        columnNames: ['detection_id'],
        referencedTableName: 'detections',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createIndex(
      'modis_details',
      new TableIndex({
        name: 'UQ_modis_details_detection_id',
        columnNames: ['detection_id'],
        isUnique: true,
      }),
    );

    await queryRunner.query(`
      CREATE TRIGGER "TRG_modis_details_set_updated_at"
      BEFORE UPDATE ON "modis_details"
      FOR EACH ROW
      EXECUTE FUNCTION "public"."set_updated_at"()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS "TRG_modis_details_set_updated_at" ON "modis_details"
    `);
    await queryRunner.dropIndex('modis_details', 'UQ_modis_details_detection_id');
    await queryRunner.dropForeignKey('modis_details', 'FK_modis_details_detection_id');
    await queryRunner.dropTable('modis_details');
  }
}
