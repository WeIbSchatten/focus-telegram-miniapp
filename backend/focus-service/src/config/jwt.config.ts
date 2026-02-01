import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => {
  const secret = process.env.APP_JWT_SECRET;
  if (!secret) {
    throw new Error('APP_JWT_SECRET is not defined');
  }

  return {
    secret,
    expiresIn: '7d',
  };
});

