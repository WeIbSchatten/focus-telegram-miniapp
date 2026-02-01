import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UserStatus } from '../../shared/constants/roles.constant';

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
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      email: createUserDto.email,
      passwordHash,
      fullName: createUserDto.fullName,
      status: UserStatus.PENDING,
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

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
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
}

