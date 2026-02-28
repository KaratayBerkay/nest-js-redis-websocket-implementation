import { Controller, Get, StreamableFile, Res } from '@nestjs/common';
import { createReadStream } from 'fs';
import { join } from 'path';
import type { FastifyReply } from 'fastify';

@Controller('file')
export class FileController {
    @Get('download')
    getFile(@Res({ passthrough: true }) res: FastifyReply): StreamableFile {
        // Note: ensure this file exists or replace with a real generic image
        const file = createReadStream(join(process.cwd(), 'sample.jpeg'));

        // Setting appropriate headers
        res.type('image/jpeg');
        res.header('Content-Disposition', 'attachment; filename="sample.jpeg"');

        return new StreamableFile(file);
    }
}
