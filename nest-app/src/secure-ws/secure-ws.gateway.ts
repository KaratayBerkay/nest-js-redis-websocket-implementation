import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsAuthGuard } from './auth/auth.guard';
import { EncryptionService } from './encryption.service';
import { RedisService } from '../redis/redis.service';

// pingTimeout: 180000 sets the timeout to 180 seconds.
// If the client doesn't respond to ping packets within this time, the connection is terminated.
@WebSocketGateway({
  namespace: '/secure',
  pingTimeout: 180000,
  pingInterval: 25000
})
export class SecureWsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly encryptionService: EncryptionService,
    private readonly redisService: RedisService
  ) { }

  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    console.log(`Client connected to secure namespace: ${client.id}`);

    let token = client.handshake.auth?.token || client.handshake.headers?.['user-slc-tkn'];
    if (token) {
      token = token.toString().replace('Bearer ', '').trim();
      const username = await this.redisService.getUsernameFromToken(token);
      if (username) {
        client.data.username = username;
        // Use an internal redis client or simply fetchSockets to get online users
        this.broadcastOnlineUsers();
      }
    }
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected from secure namespace: ${client.id}`);
    if (client.data?.username) {
      this.broadcastOnlineUsers();
    }
  }

  private async broadcastOnlineUsers() {
    const sockets = await this.server.fetchSockets();
    const onlineUsers = [...new Set(sockets.map(s => s.data.username).filter(Boolean))];
    this.server.emit('online-users', {
      onlineUsers,
      connectionCount: sockets.length
    });
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('who-is-online')
  async handleWhoIsOnline(@ConnectedSocket() client: Socket) {
    const sockets = await this.server.fetchSockets();
    const onlineUsers = [...new Set(sockets.map(s => s.data.username).filter(Boolean))];
    return { status: 'success', onlineUsers, connectionCount: sockets.length };
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any
  ) {
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { }
    }

    if (!data?.text) {
      return { status: 'error', message: 'Message text is required' };
    }

    // Encrypt the message before sending it (e2e encryption simulation)
    // const encryptedMessage = this.encryptionService.encrypt(data.text);

    const payload = {
      sender: client.id,
      username: client.data.username,
      timestamp: new Date().toISOString(),
      encryptedText: data.text,
    };

    if (data.room) {
      // Send to a specific room
      this.server.to(data.room).emit('receive-message', payload);
    } else {
      // Broadcast to everyone in the secure namespace except sender
      client.broadcast.emit('receive-message', payload);
    }

    return { status: 'success', message: 'Message sent successfully' };
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('join-room')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { }
    }

    if (data?.room) {
      client.join(data.room);
      return { status: 'success', message: `Joined room ${data.room}` };
    }
    return { status: 'error', message: 'Room name is required' };
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('hash-payload')
  async handleHashPayload(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { }
    }

    if (!data?.text) {
      return { status: 'error', message: 'Missing text to hash' };
    }
    const hashed = await this.encryptionService.hashPassword(data.text);
    const isValid = await this.encryptionService.comparePassword(data.text, hashed);

    // We send back both the hashed text and validation check
    return { status: 'success', original: data.text, hashed, verified: isValid };
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('encrypt-payload')
  handleEncryptPayload(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { }
    }

    if (!data?.text) {
      return { status: 'error', message: 'Missing text to encrypt' };
    }
    // Test encryption algorithm
    const encrypted = this.encryptionService.encrypt(data.text);
    // Immediately attempt decryption to verify
    const decrypted = this.encryptionService.decrypt(encrypted);

    return {
      status: 'success',
      original: data.text,
      encrypted,
      decrypted
    };
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('decrypt-payload')
  handleDecryptPayload(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { }
    }

    if (!data?.encryptedText?.iv || !data?.encryptedText?.content) {
      return { status: 'error', message: 'Missing properly formatted encryptedText object' };
    }

    try {
      const decrypted = this.encryptionService.decrypt(data.encryptedText);
      return {
        status: 'success',
        decrypted
      };
    } catch (e) {
      return { status: 'error', message: 'Failed to decrypt message. Invalid payload or key.' };
    }
  }
}
