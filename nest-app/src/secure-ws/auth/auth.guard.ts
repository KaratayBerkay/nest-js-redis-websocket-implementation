import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private readonly redisService: RedisService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();

    // Support handshake auth token or a custom header
    let token = client.handshake.auth?.token || client.handshake.headers?.['user-slc-tkn'];

    if (!token) {
      throw new UnauthorizedException('Missing authentication token for WebSocket');
    }

    // E.g., strip "Bearer " if someone passes it
    token = token.toString().replace('Bearer ', '').trim();

    const username = await this.redisService.getUsernameFromToken(token);
    if (!username) {
      throw new UnauthorizedException('Invalid or expired WebSocket auth token');
    }

    // Attach to socket object so downstream methods know who they are
    client.data.username = username;

    return true;
  }
}
