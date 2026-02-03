import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { ConfigType } from '@nestjs/config';
import { jwtConfig } from '../../config/jwt.config';
import { appConfig } from '../../config/app.config';
import { Inject } from '@nestjs/common';
import {
  validateTelegramWebAppData,
  parseTelegramUserFromInitData,
  validateTelegramWidgetData,
} from '../../shared/utils/telegram.util';
import { getPrimaryRole } from '../../shared/constants/roles.constant';

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

  /** Вход по данным Telegram Login Widget (сайт, редирект). */
  async validateTelegramWidget(params: {
    id: string;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: string;
    hash: string;
  }): Promise<{ accessToken: string }> {
    const botToken = this.appCfg.telegramBotToken;
    if (!botToken) {
      throw new UnauthorizedException('Вход через Telegram не настроен');
    }
    const paramsRecord: Record<string, string> = {
      id: params.id,
      first_name: params.first_name,
      auth_date: params.auth_date,
      hash: params.hash,
    };
    if (params.last_name != null) paramsRecord.last_name = params.last_name;
    if (params.username != null) paramsRecord.username = params.username;
    if (params.photo_url != null) paramsRecord.photo_url = params.photo_url;

    if (!validateTelegramWidgetData(paramsRecord, botToken)) {
      throw new UnauthorizedException('Неверные данные Telegram');
    }
    const authDate = parseInt(params.auth_date, 10);
    if (Number.isNaN(authDate) || Date.now() / 1000 - authDate > 86400) {
      throw new UnauthorizedException('Срок действия данных истёк. Попробуйте снова.');
    }
    const user = await this.usersService.findByTelegramUserId(params.id);
    if (!user) {
      throw new UnauthorizedException(
        'Telegram не привязан. Зарегистрируйтесь и привяжите Telegram в личном кабинете.',
      );
    }
    const payload = { sub: user.id, role: getPrimaryRole(user.roles) };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.jwtCfg.secret,
      expiresIn: this.jwtCfg.expiresIn,
    });
    return { accessToken };
  }

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
    const payload = { sub: user.id, role: getPrimaryRole(user.roles) };
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

    const payload = { sub: user.id, role: getPrimaryRole(user.roles) };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.jwtCfg.secret,
      expiresIn: this.jwtCfg.expiresIn,
    });

    return { accessToken };
  }
}

