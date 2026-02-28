import {
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from './prisma.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class EventsGateway {
    constructor(private prisma: PrismaService) { }

    @WebSocketServer()
    server: Server;

    @SubscribeMessage('events')
    async handleEvent(
        @MessageBody() data: string,
        @ConnectedSocket() client: Socket,
    ) {
        const message = await this.prisma.message.create({
            data: {
                content: data,
            },
        });

        // Broadcast the message back to all connected clients
        this.server.emit('events', message);
        return message;
    }
}
