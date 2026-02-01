import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { validateTelegramWebAppData, parseTelegramUserFromInitData } from '../../shared/utils/telegram.util';
import { ConfigType } from '@nestjs/config';
import { appConfig } from '../../config/app.config';
import { Inject } from '@nestjs/common';
import { UserRole } from '../../shared/constants/roles.constant';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    @Inject(appConfig.KEY)
    private readonly appCfg: ConfigType<typeof appConfig>,
  ) {}

  @Post('register')
  async register(@Body() dto: CreateUserDto): Promise<{ id: string; email: string; fullName: string; role: string; status: string }> {
    const user = await this.usersService.create(dto);
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.validateUser(dto);
  }

  /** Вход по Telegram WebApp initData (валидация на бэкенде). */
  @Post('telegram')
  loginTelegram(@Body() dto: TelegramAuthDto) {
    return this.authService.validateTelegramInitData(dto.initData);
  }

  /** Отвязать Telegram от текущего аккаунта (требует JWT). */
  @Patch('me/unlink-telegram')
  @UseGuards(JwtAuthGuard)
  async unlinkTelegram(
    @CurrentUser() currentUser: { userId: string },
  ): Promise<Pick<User, 'id' | 'email' | 'fullName' | 'role' | 'status' | 'hasKidsAccess' | 'telegramUserId'>> {
    const updated = await this.usersService.unlinkTelegram(currentUser.userId);
    const { id, email, fullName, role, status, hasKidsAccess, telegramUserId } = updated;
    const effectiveKidsAccess = hasKidsAccess || role === UserRole.ADMIN || role === UserRole.MODERATOR;
    return { id, email, fullName, role, status, hasKidsAccess: effectiveKidsAccess, telegramUserId: telegramUserId ?? null };
  }

  /** Привязать Telegram к текущему аккаунту (требует JWT). */
  @Patch('me/link-telegram')
  @UseGuards(JwtAuthGuard)
  async linkTelegram(
    @CurrentUser() currentUser: { userId: string },
    @Body() dto: TelegramAuthDto,
  ): Promise<{ telegramUserId: string }> {
    if (!this.appCfg.telegramBotToken) {
      throw new BadRequestException('Токен бота Telegram не настроен');
    }
    if (!validateTelegramWebAppData(dto.initData, this.appCfg.telegramBotToken)) {
      throw new BadRequestException('Неверные данные Telegram');
    }
    const tgUser = parseTelegramUserFromInitData(dto.initData);
    if (!tgUser) {
      throw new BadRequestException('Неверные данные пользователя Telegram');
    }
    const telegramUserId = String(tgUser.id);
    await this.usersService.linkTelegramUserId(currentUser.userId, telegramUserId);
    return { telegramUserId };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(
    @CurrentUser() user: { userId: string },
  ): Promise<Pick<User, 'id' | 'email' | 'fullName' | 'role' | 'status' | 'hasKidsAccess' | 'telegramUserId'>> {
    const fullUser = await this.usersService.findById(user.userId);
    const { id, email, fullName, role, status, hasKidsAccess, telegramUserId } = fullUser;
    const effectiveKidsAccess = hasKidsAccess || role === UserRole.ADMIN || role === UserRole.MODERATOR;
    return { id, email, fullName, role, status, hasKidsAccess: effectiveKidsAccess, telegramUserId: telegramUserId ?? null };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateProfileDto,
  ): Promise<Pick<User, 'id' | 'email' | 'fullName' | 'role' | 'status' | 'hasKidsAccess' | 'telegramUserId'>> {
    const updated = await this.usersService.updateProfile(user.userId, dto);
    const { id, email, fullName, role, status, hasKidsAccess, telegramUserId } = updated;
    const effectiveKidsAccess = hasKidsAccess || role === UserRole.ADMIN || role === UserRole.MODERATOR;
    return { id, email, fullName, role, status, hasKidsAccess: effectiveKidsAccess, telegramUserId: telegramUserId ?? null };
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: { userId: string },
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.usersService.changePassword(
      user.userId,
      dto.oldPassword,
      dto.newPassword,
      dto.confirmNewPassword,
    );
    return { message: 'Пароль успешно изменён' };
  }
}

