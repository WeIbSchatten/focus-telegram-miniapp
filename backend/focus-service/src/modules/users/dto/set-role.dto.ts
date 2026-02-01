import { IsEnum } from 'class-validator';
import { UserRole } from '../../../shared/constants/roles.constant';

export class SetRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}
