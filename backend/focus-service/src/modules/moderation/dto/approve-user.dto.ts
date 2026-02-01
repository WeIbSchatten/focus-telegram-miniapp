import { IsEnum } from 'class-validator';
import { UserStatus } from '../../../shared/constants/roles.constant';

export class ApproveUserDto {
  @IsEnum(UserStatus)
  status!: UserStatus;
}

