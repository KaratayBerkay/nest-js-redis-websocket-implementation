import { Controller, Get, Post, Req, Res, StreamableFile } from '@nestjs/common';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { createReadStream, createWriteStream } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';

@Controller('stream')
export class StreamController {
    @Post('upload')
    async uploadFile(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
        const data = await req.file();
        if (!data) {
            res.status(400).send('No file uploaded');
            return;
        }

        const writeStream = createWriteStream(join(process.cwd(), data.filename));
        await pipeline(data.file, writeStream);

        res.send({ message: 'File uploaded successfully', filename: data.filename });
    }

    @Get('download')
    downloadFile(@Res({ passthrough: true }) res: FastifyReply): StreamableFile {
        const file = createReadStream(join(process.cwd(), 'sample.jpeg'));

        res.type('image/jpeg');
        res.header('Content-Disposition', 'attachment; filename="sample.jpeg"');

        return new StreamableFile(file);
    }
}
