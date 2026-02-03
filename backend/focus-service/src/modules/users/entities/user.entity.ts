import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole, UserStatus } from '../../../shared/constants/roles.constant';

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

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

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

