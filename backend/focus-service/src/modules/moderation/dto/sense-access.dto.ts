import { IsBoolean } from 'class-validator';

export class SenseAccessDto {
  @IsBoolean()
  hasAccess!: boolean;
}
