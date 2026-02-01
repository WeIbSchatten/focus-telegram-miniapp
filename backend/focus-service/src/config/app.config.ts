import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.APP_PORT ?? '3000', 10),
  env: process.env.APP_ENV ?? 'development',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
}));

