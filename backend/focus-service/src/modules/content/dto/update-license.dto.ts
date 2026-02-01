import { IsString } from 'class-validator';

export class UpdateLicenseDto {
  @IsString()
  content!: string;
}
