import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** Данные от Telegram Login Widget (редирект с сайта). */
export class TelegramWidgetAuthDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  first_name!: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  photo_url?: string;

  @IsString()
  @IsNotEmpty()
  auth_date!: string;

  @IsString()
  @IsNotEmpty()
  hash!: string;
}
