import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { EventsGateway } from './events.gateway';
import { FileController } from './file.controller';
import { StreamModule } from './stream/stream.module';
import { SecureWsModule } from './secure-ws/secure-ws.module';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [StreamModule, SecureWsModule, AuthModule, RedisModule],
  controllers: [AppController, FileController],
  providers: [AppService, PrismaService, EventsGateway],
})
export class AppModule { }
