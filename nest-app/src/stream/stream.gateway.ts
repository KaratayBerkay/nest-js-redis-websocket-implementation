import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { createWriteStream, createReadStream } from 'fs';
import { join } from 'path';

@WebSocketGateway()
export class StreamGateway {

  @SubscribeMessage('upload-chunk')
  handleUploadChunk(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { filename: string; chunk: Buffer; isLast: boolean }
  ) {
    const filePath = join(process.cwd(), payload.filename);
    const writeStream = createWriteStream(filePath, { flags: 'a' });

    writeStream.write(payload.chunk);
    writeStream.end();

    if (payload.isLast) {
      client.emit('upload-complete', { filename: payload.filename });
    } else {
      client.emit('upload-progress', { filename: payload.filename });
    }
  }

  @SubscribeMessage('request-download')
  handleDownloadStream(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { filename: string }
  ) {
    const filePath = join(process.cwd(), payload.filename || 'sample.jpeg');
    const readStream = createReadStream(filePath, { highWaterMark: 64 * 1024 }); // 64kb chunks

    readStream.on('data', (chunk) => {
      client.emit('download-chunk', { filename: payload.filename, chunk });
    });

    readStream.on('end', () => {
      client.emit('download-complete', { filename: payload.filename });
    });

    readStream.on('error', (err) => {
      client.emit('download-error', { error: err.message });
    });
  }
}

