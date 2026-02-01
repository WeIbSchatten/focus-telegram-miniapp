import { Body, Controller, Get, Patch, Post, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { validateTelegramWebAppData, parseTelegramUserFromInitData } from '../../shared/utils/telegram.util';
import { ConfigType } from '@nestjs/config';
import { appConfig } from '../../config/app.config';
import { Inject } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    @Inject(appConfig.KEY)
    private readonly appCfg: ConfigType<typeof appConfig>,
  ) {}

  @Post('register')
  register(@Body() dto: CreateUserDto): Promise<User> {
    return this.usersService.create(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.validateUser(dto);
  }

  /** Вход по Telegram WebApp initData (валидация на бэкенде). */
  @Post('telegram')
  loginTelegram(@Body() dto: TelegramAuthDto) {
    return this.authService.validateTelegramInitData(dto.initData);
  }

  /** Привязать Telegram к текущему аккаунту (требует JWT). */
  @Patch('me/link-telegram')
  @UseGuards(JwtAuthGuard)
  async linkTelegram(
    @CurrentUser() currentUser: { userId: string },
    @Body() dto: TelegramAuthDto,
  ): Promise<{ telegramUserId: string }> {
    if (!this.appCfg.telegramBotToken) {
      throw new BadRequestException('Telegram bot token is not configured');
    }
    if (!validateTelegramWebAppData(dto.initData, this.appCfg.telegramBotToken)) {
      throw new BadRequestException('Invalid Telegram initData');
    }
    const tgUser = parseTelegramUserFromInitData(dto.initData);
    if (!tgUser) {
      throw new BadRequestException('Invalid Telegram user data');
    }
    const telegramUserId = String(tgUser.id);
    await this.usersService.linkTelegramUserId(currentUser.userId, telegramUserId);
    return { telegramUserId };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(
    @CurrentUser() user: { userId: string },
  ): Promise<Pick<User, 'id' | 'email' | 'fullName' | 'role' | 'status' | 'hasKidsAccess'>> {
    const fullUser = await this.usersService.findById(user.userId);
    const { id, email, fullName, role, status, hasKidsAccess } = fullUser;
    return { id, email, fullName, role, status, hasKidsAccess };
  }
}

