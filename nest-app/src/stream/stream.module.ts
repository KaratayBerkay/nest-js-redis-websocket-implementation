import { Module } from '@nestjs/common';
import { StreamGateway } from './stream.gateway';
import { StreamController } from './stream.controller';

@Module({
  providers: [StreamGateway],
  controllers: [StreamController]
})
export class StreamModule {}
