import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class CacheEntity {
  @PrimaryColumn()
  key: string;

  @Column({ type: 'jsonb' })
  value: any;

  @Column({ type: 'timestamp' })
  expired: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
