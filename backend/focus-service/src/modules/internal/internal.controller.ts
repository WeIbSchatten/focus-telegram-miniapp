import { Controller, Get, Query, UseGuards, NotFoundException } from '@nestjs/common';
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

  /** Для бота /status: по telegram_id вернуть focus_user_id (если Telegram привязан). */
  @Get('focus-user-by-telegram')
  async getFocusUserByTelegram(
    @Query('telegram_id') telegramId: string,
  ): Promise<{ focus_user_id: string }> {
    const id = (telegramId ?? '').trim();
    if (!id) throw new NotFoundException('telegram_id required');
    const user = await this.usersService.findByTelegramUserId(id);
    if (!user) throw new NotFoundException('User not found for this Telegram');
    return { focus_user_id: user.id };
  }
}
