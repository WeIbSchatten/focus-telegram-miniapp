import { IsEmail, IsNotEmpty, Matches, MinLength } from 'class-validator';

/** ФИО: минимум 3 части (фамилия, имя, отчество), разделённые пробелами. */
const FULL_NAME_PATTERN = /^\s*\S+(\s+\S+){2,}\s*$/;

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @IsNotEmpty({ message: 'Введите ФИО полностью: фамилия, имя, отчество' })
  @Matches(FULL_NAME_PATTERN, {
    message: 'Введите ФИО полностью: фамилия, имя, отчество (три слова через пробел)',
  })
  fullName!: string;
}

