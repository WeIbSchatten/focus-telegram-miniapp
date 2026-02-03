import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserStatus } from '../../../shared/constants/roles.constant';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 32, nullable: true, unique: true })
  telegramUserId!: string | null;

  @Column()
  passwordHash!: string;

  @Column({ type: 'varchar', length: 100 })
  fullName!: string;

  /** Роли через запятую (TypeORM simple-array). Значения: admin, moderator, teacher, student, user. */
  @Column({ type: 'simple-array', default: 'user' })
  roles!: string[];

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING })
  status!: UserStatus;

  @Column({ type: 'boolean', default: false })
  hasKidsAccess!: boolean;

  @Column({ type: 'boolean', default: true })
  hasSenseAccess!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

