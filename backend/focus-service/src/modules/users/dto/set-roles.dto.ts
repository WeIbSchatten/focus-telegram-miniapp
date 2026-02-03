import { IsArray, IsIn, IsString } from 'class-validator';
import { UserRole } from '../../../shared/constants/roles.constant';

const VALID_ROLES = Object.values(UserRole) as string[];

export class SetRolesDto {
  @IsArray()
  @IsString({ each: true })
  @IsIn(VALID_ROLES, { each: true })
  roles!: string[];
}
