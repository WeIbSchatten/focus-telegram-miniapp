import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'Текущий пароль обязателен' })
  @IsString()
  oldPassword!: string;

  @IsNotEmpty({ message: 'Новый пароль обязателен' })
  @IsString()
  @MinLength(6, { message: 'Новый пароль не менее 6 символов' })
  @MaxLength(72)
  newPassword!: string;

  @IsNotEmpty({ message: 'Подтвердите новый пароль' })
  @IsString()
  confirmNewPassword!: string;
}
