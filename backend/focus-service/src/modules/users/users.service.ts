import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UserRole, UserStatus } from '../../shared/constants/roles.constant';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existing) {
      throw new ConflictException('Пользователь с таким email уже зарегистрирован');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      email: createUserDto.email,
      passwordHash,
      fullName: createUserDto.fullName,
      status: UserStatus.APPROVED,
    });

    return this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByTelegramUserId(telegramUserId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { telegramUserId } });
  }

  async linkTelegramUserId(userId: string, telegramUserId: string): Promise<User> {
    const user = await this.findById(userId);
    user.telegramUserId = telegramUserId;
    return this.usersRepository.save(user);
  }

  async unlinkTelegram(userId: string): Promise<User> {
    const user = await this.findById(userId);
    user.telegramUserId = null;
    return this.usersRepository.save(user);
  }

  async updateProfile(
    userId: string,
    dto: { fullName?: string; email?: string },
  ): Promise<User> {
    const user = await this.findById(userId);
    if (dto.fullName !== undefined) user.fullName = dto.fullName.trim();
    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      if (email !== user.email) {
        const existing = await this.usersRepository.findOne({ where: { email } });
        if (existing) throw new ConflictException('Пользователь с таким email уже существует');
        user.email = email;
      }
    }
    return this.usersRepository.save(user);
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string, confirmNewPassword: string): Promise<void> {
    if (newPassword !== confirmNewPassword) {
      throw new BadRequestException('Новый пароль и подтверждение не совпадают');
    }
    const user = await this.findById(userId);
    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Неверный текущий пароль');
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.save(user);
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    return user;
  }

  /** Для бота: по списку focus user id вернуть telegram_user_id (или null, если не привязан). */
  async findTelegramIdsByUserIds(ids: string[]): Promise<Record<string, string | null>> {
    if (ids.length === 0) return {};
    const unique = [...new Set(ids)];
    const users = await this.usersRepository.find({
      where: unique.map((id) => ({ id })),
      select: ['id', 'telegramUserId'],
    });
    const map: Record<string, string | null> = {};
    for (const id of unique) {
      const u = users.find((x) => x.id === id);
      map[id] = u?.telegramUserId ?? null;
    }
    return map;
  }

  async setStatus(id: string, status: UserStatus): Promise<User> {
    const user = await this.findById(id);
    user.status = status;
    return this.usersRepository.save(user);
  }

  async setKidsAccess(id: string, hasAccess: boolean): Promise<User> {
    const user = await this.findById(id);
    user.hasKidsAccess = hasAccess;
    return this.usersRepository.save(user);
  }

  async setSenseAccess(id: string, hasAccess: boolean): Promise<User> {
    const user = await this.findById(id);
    user.hasSenseAccess = hasAccess;
    return this.usersRepository.save(user);
  }

  async setRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findById(id);
    user.role = role;
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.usersRepository.remove(user);
  }

  /**
   * Создаёт администратора и модератора при первом развёртывании, если их ещё нет.
   */
  async seedDefaultUsers(): Promise<void> {
    const defaultUsers: Array<{
      email: string;
      password: string;
      fullName: string;
      role: UserRole;
    }> = [
      {
        email: 'We1BSchatten@focus.local',
        password: 'HJVFirf2163@',
        fullName: 'Administrator',
        role: UserRole.ADMIN,
      },
      {
        email: 'ASEvst@focus.local',
        password: 'HJVFirf2005@',
        fullName: 'Moderator',
        role: UserRole.MODERATOR,
      },
    ];

    for (const dto of defaultUsers) {
      const existing = await this.usersRepository.findOne({
        where: { email: dto.email },
      });
      if (existing) continue;

      const passwordHash = await bcrypt.hash(dto.password, 10);
      const user = this.usersRepository.create({
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        role: dto.role,
        status: UserStatus.APPROVED,
        hasKidsAccess: true,
        hasSenseAccess: true,
      });
      await this.usersRepository.save(user);
    }
  }
}

