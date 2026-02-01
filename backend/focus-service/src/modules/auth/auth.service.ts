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
      throw new UnauthorizedException('Telegram auth is not configured');
    }
    if (!validateTelegramWebAppData(initData, botToken)) {
      throw new UnauthorizedException('Invalid Telegram initData');
    }
    const tgUser = parseTelegramUserFromInitData(initData);
    if (!tgUser) {
      throw new UnauthorizedException('Invalid Telegram user data');
    }
    const telegramUserId = String(tgUser.id);
    const user = await this.usersService.findByTelegramUserId(telegramUserId);
    if (!user) {
      throw new UnauthorizedException('Telegram user not linked. Register first and link Telegram in profile.');
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
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.jwtCfg.secret,
      expiresIn: this.jwtCfg.expiresIn,
    });

    return { accessToken };
  }
}

