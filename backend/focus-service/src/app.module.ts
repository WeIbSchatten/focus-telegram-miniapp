import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { appConfig } from './config/app.config';
import { User } from './modules/users/entities/user.entity';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ModerationModule } from './modules/moderation/moderation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig, jwtConfig, appConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (dbCfg: ReturnType<typeof databaseConfig>) => ({
        type: 'postgres',
        url: dbCfg.url,
        autoLoadEntities: true,
        synchronize: true, // TODO: отключить в продакшене и использовать миграции
      }),
    }),
    TypeOrmModule.forFeature([User]),
    AuthModule,
    UsersModule,
    ModerationModule,
  ],
})
export class AppModule {}

