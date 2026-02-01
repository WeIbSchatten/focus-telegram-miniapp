import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => {
  const url = process.env.APP_DATABASE_URL;

  if (!url) {
    throw new Error('APP_DATABASE_URL is not defined');
  }

  return {
    url,
  };
});

