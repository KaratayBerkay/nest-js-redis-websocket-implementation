import { Module } from '@nestjs/common';
import { SecureWsGateway } from './secure-ws.gateway';
import { EncryptionService } from './encryption.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [SecureWsGateway, EncryptionService],
  exports: [EncryptionService]
})
export class SecureWsModule { }
