import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { ApproveUserDto } from './dto/approve-user.dto';
import { KidsAccessDto } from './dto/kids-access.dto';
import { SenseAccessDto } from './dto/sense-access.dto';
import { UserStatus, UserRole } from '../../shared/constants/roles.constant';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Patch('users/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async approveUser(
    @Param('id') id: string,
    @Body() body: ApproveUserDto,
  ): Promise<{ status: UserStatus }> {
    if (body.status === UserStatus.APPROVED) {
      await this.moderationService.approveUser(id);
    }
    return { status: body.status };
  }

  @Patch('users/:id/kids-access')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async setKidsAccess(
    @Param('id') id: string,
    @Body() body: KidsAccessDto,
  ): Promise<{ hasAccess: boolean }> {
    await this.moderationService.setKidsAccess(id, body.hasAccess);
    return { hasAccess: body.hasAccess };
  }

  @Patch('users/:id/sense-access')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async setSenseAccess(
    @Param('id') id: string,
    @Body() body: SenseAccessDto,
  ): Promise<{ hasAccess: boolean }> {
    await this.moderationService.setSenseAccess(id, body.hasAccess);
    return { hasAccess: body.hasAccess };
  }
}

