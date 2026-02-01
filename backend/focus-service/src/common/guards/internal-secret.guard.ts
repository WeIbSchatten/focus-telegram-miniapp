import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { appConfig } from '../../config/app.config';
import { Inject } from '@nestjs/common';

@Injectable()
export class InternalSecretGuard implements CanActivate {
  constructor(
    @Inject(appConfig.KEY)
    private readonly appCfg: ConfigType<typeof appConfig>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { headers: { 'x-internal-secret'?: string } }>();
    const secret = request.headers['x-internal-secret'];
    const expected = this.appCfg.internalApiSecret;
    if (!expected || secret !== expected) {
      throw new UnauthorizedException('Неверный или отсутствующий внутренний секрет');
    }
    return true;
  }
}
