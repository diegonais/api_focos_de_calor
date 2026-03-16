import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum IngestionRunStatus {
  RUNNING = 'RUNNING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

export enum IngestionRunTrigger {
  BOOT = 'BOOT',
  SCHEDULED = 'SCHEDULED',
}

@Entity({ name: 'ingestion_runs' })
@Index('IDX_ingestion_runs_started_at', ['startedAt'])
@Index('IDX_ingestion_runs_status', ['status'])
export class IngestionRun {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: IngestionRunStatus,
    enumName: 'ingestion_runs_status_enum',
  })
  status!: IngestionRunStatus;

  @Column({
    type: 'enum',
    enum: IngestionRunTrigger,
    enumName: 'ingestion_runs_trigger_enum',
  })
  trigger!: IngestionRunTrigger;

  @Column({ type: 'text', array: true })
  sources!: string[];

  @Column({ name: 'lookback_days', type: 'integer' })
  lookbackDays!: number;

  @Column({ name: 'fetched_count', type: 'integer', default: 0 })
  fetchedCount!: number;

  @Column({ name: 'inserted_count', type: 'integer', default: 0 })
  insertedCount!: number;

  @Column({ name: 'duplicate_count', type: 'integer', default: 0 })
  duplicateCount!: number;

  @Column({ name: 'duration_ms', type: 'integer', nullable: true })
  durationMs!: number | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({
    name: 'started_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  startedAt!: Date;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt!: Date | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}
