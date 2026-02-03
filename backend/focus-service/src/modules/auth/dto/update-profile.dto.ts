import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';

/** ФИО: минимум 3 части (фамилия, имя, отчество), разделённые пробелами. */
const FULL_NAME_PATTERN = /^\s*\S+(\s+\S+){2,}\s*$/;

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @ValidateIf((o) => (o.fullName ?? '').trim() !== '')
  @Matches(FULL_NAME_PATTERN, {
    message: 'Введите ФИО полностью: фамилия, имя, отчество (три слова через пробел)',
  })
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
