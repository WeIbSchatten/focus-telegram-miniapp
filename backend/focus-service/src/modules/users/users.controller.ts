import { Body, Controller, Delete, Get, Param, Patch, UseGuards, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, hasRole } from '../../shared/constants/roles.constant';
import { SetRolesDto } from './dto/set-roles.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async list(
    @CurrentUser() currentUser: { userId: string; role: string },
  ): Promise<Pick<User, 'id' | 'email' | 'fullName' | 'roles' | 'status' | 'hasKidsAccess' | 'hasSenseAccess' | 'createdAt'>[]> {
    const users = await this.usersService.findAll();
    return users.map((u) => {
      const effectiveKidsAccess = u.hasKidsAccess || hasRole(u.roles, UserRole.ADMIN) || hasRole(u.roles, UserRole.MODERATOR);
      const effectiveSenseAccess = u.hasSenseAccess || hasRole(u.roles, UserRole.ADMIN) || hasRole(u.roles, UserRole.MODERATOR);
      return {
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        roles: u.roles,
        status: u.status,
        hasKidsAccess: effectiveKidsAccess,
        hasSenseAccess: effectiveSenseAccess,
        createdAt: u.createdAt,
      };
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getById(
    @Param('id') id: string,
    @CurrentUser() currentUser: { userId: string; role: string },
  ): Promise<Pick<User, 'id' | 'email' | 'fullName' | 'roles' | 'status' | 'hasKidsAccess' | 'hasSenseAccess'>> {
    if (currentUser.userId !== id && currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MODERATOR) {
      throw new ForbiddenException('Доступ только к своим данным');
    }
    const user = await this.usersService.findById(id);
    const { id: userId, email, fullName, roles, status, hasKidsAccess, hasSenseAccess } = user;
    const effectiveKidsAccess = hasKidsAccess || hasRole(roles, UserRole.ADMIN) || hasRole(roles, UserRole.MODERATOR);
    const effectiveSenseAccess = hasSenseAccess || hasRole(roles, UserRole.ADMIN) || hasRole(roles, UserRole.MODERATOR);
    return { id: userId, email, fullName, roles, status, hasKidsAccess: effectiveKidsAccess, hasSenseAccess: effectiveSenseAccess };
  }

  @Patch(':id/roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async setRoles(
    @Param('id') id: string,
    @Body() body: SetRolesDto,
  ): Promise<Pick<User, 'id' | 'roles'>> {
    const user = await this.usersService.setRoles(id, body.roles);
    return { id: user.id, roles: user.roles };
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

