import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ContentService } from './content.service';
import { UpdateLicenseDto } from './dto/update-license.dto';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../shared/constants/roles.constant';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('license')
  async getLicense(): Promise<{ content: string }> {
    const content = await this.contentService.getLicense();
    return { content };
  }

  @Patch('license')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async updateLicense(@Body() dto: UpdateLicenseDto): Promise<{ content: string }> {
    const content = await this.contentService.setLicense(dto.content);
    return { content };
  }
}
