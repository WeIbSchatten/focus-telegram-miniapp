import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserStatus } from '../../shared/constants/roles.constant';

@Injectable()
export class ModerationService {
  constructor(private readonly usersService: UsersService) {}

  async approveUser(userId: string): Promise<void> {
    await this.usersService.setStatus(userId, UserStatus.APPROVED);
  }

  async setKidsAccess(userId: string, hasAccess: boolean): Promise<void> {
    await this.usersService.setKidsAccess(userId, hasAccess);
  }

  async setSenseAccess(userId: string, hasAccess: boolean): Promise<void> {
    await this.usersService.setSenseAccess(userId, hasAccess);
  }
}

