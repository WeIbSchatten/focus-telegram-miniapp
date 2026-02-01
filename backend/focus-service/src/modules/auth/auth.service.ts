import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { ConfigType } from '@nestjs/config';
import { jwtConfig } from '../../config/jwt.config';
import { appConfig } from '../../config/app.config';
import { Inject } from '@nestjs/common';
import { validateTelegramWebAppData, parseTelegramUserFromInitData } from '../../shared/utils/telegram.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtCfg: ConfigType<typeof jwtConfig>,
    @Inject(appConfig.KEY)
    private readonly appCfg: ConfigType<typeof appConfig>,
  ) {}

  async validateTelegramInitData(initData: string): Promise<{ accessToken: string }> {
    const botToken = this.appCfg.telegramBotToken;
    if (!botToken) {
      throw new UnauthorizedException('Вход через Telegram не настроен');
    }
    if (!validateTelegramWebAppData(initData, botToken)) {
      throw new UnauthorizedException('Неверные данные Telegram');
    }
    const tgUser = parseTelegramUserFromInitData(initData);
    if (!tgUser) {
      throw new UnauthorizedException('Неверные данные пользователя Telegram');
    }
    const telegramUserId = String(tgUser.id);
    const user = await this.usersService.findByTelegramUserId(telegramUserId);
    if (!user) {
      throw new UnauthorizedException('Telegram не привязан. Зарегистрируйтесь и привяжите Telegram в профиле.');
    }
    const payload = { sub: user.id, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.jwtCfg.secret,
      expiresIn: this.jwtCfg.expiresIn,
    });
    return { accessToken };
  }

  async validateUser(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const payload = { sub: user.id, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.jwtCfg.secret,
      expiresIn: this.jwtCfg.expiresIn,
    });

    return { accessToken };
  }
}

