import { IsBoolean } from 'class-validator';

export class KidsAccessDto {
  @IsBoolean()
  hasAccess!: boolean;
}

