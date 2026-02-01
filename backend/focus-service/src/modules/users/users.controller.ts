import { Body, Controller, Delete, Get, Param, Patch, UseGuards, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../shared/constants/roles.constant';
import { SetRoleDto } from './dto/set-role.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async list(
    @CurrentUser() currentUser: { userId: string; role: string },
  ): Promise<Pick<User, 'id' | 'email' | 'fullName' | 'role' | 'status' | 'hasKidsAccess' | 'createdAt'>[]> {
    const users = await this.usersService.findAll();
    return users.map((u) => {
      const effectiveKidsAccess = u.hasKidsAccess || u.role === UserRole.ADMIN || u.role === UserRole.MODERATOR;
      return {
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        status: u.status,
        hasKidsAccess: effectiveKidsAccess,
        createdAt: u.createdAt,
      };
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getById(
    @Param('id') id: string,
    @CurrentUser() currentUser: { userId: string; role: string },
  ): Promise<Pick<User, 'id' | 'email' | 'fullName' | 'role' | 'status' | 'hasKidsAccess'>> {
    // Пользователь может получить только свою информацию, админы и модераторы - любую
    if (currentUser.userId !== id && currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MODERATOR) {
      throw new ForbiddenException('Доступ только к своим данным');
    }
    const user = await this.usersService.findById(id);
    const { id: userId, email, fullName, role, status, hasKidsAccess } = user;
    const effectiveKidsAccess = hasKidsAccess || role === UserRole.ADMIN || role === UserRole.MODERATOR;
    return { id: userId, email, fullName, role, status, hasKidsAccess: effectiveKidsAccess };
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async setRole(
    @Param('id') id: string,
    @Body() body: SetRoleDto,
  ): Promise<Pick<User, 'id' | 'role'>> {
    const user = await this.usersService.setRole(id, body.role);
    return { id: user.id, role: user.role };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: { userId: string; role: string },
  ): Promise<{ message: string }> {
    if (currentUser.userId === id) {
      throw new ForbiddenException('Нельзя удалить самого себя');
    }
    await this.usersService.delete(id);
    return { message: 'Пользователь удалён' };
  }
}

