import { Controller, Get, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../shared/constants/roles.constant';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getById(
    @Param('id') id: string,
    @CurrentUser() currentUser: { userId: string; role: string },
  ): Promise<Pick<User, 'id' | 'email' | 'fullName' | 'role' | 'status' | 'hasKidsAccess'>> {
    // Пользователь может получить только свою информацию, админы и модераторы - любую
    if (currentUser.userId !== id && currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MODERATOR) {
      throw new ForbiddenException('You can only access your own user information');
    }
    const user = await this.usersService.findById(id);
    const { id: userId, email, fullName, role, status, hasKidsAccess } = user;
    return { id: userId, email, fullName, role, status, hasKidsAccess };
  }
}

