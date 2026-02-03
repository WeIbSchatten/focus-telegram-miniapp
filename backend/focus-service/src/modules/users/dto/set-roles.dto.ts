import { IsArray, IsEnum } from 'class-validator';
import { UserRole } from '../../../shared/constants/roles.constant';

export class SetRolesDto {
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles!: UserRole[];
}
