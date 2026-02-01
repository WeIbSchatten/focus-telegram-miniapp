import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { InternalSecretGuard } from '../../common/guards/internal-secret.guard';

@Controller('internal')
@UseGuards(InternalSecretGuard)
export class InternalController {
  constructor(private readonly usersService: UsersService) {}

  @Get('telegram-ids')
  async getTelegramIds(
    @Query('ids') idsParam: string,
  ): Promise<Record<string, string | null>> {
    const ids = (idsParam ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return this.usersService.findTelegramIdsByUserIds(ids);
  }
}
