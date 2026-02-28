import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RedisService } from '../redis/redis.service';
import { EncryptionService } from '../secure-ws/encryption.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private redis: RedisService,
        private encryption: EncryptionService
    ) { }

    async signUp(body: any) {
        if (!body?.username || !body?.password) {
            throw new BadRequestException('Username and password are required');
        }

        const existingUser = await this.prisma.user.findUnique({
            where: { username: body.username }
        });
        if (existingUser) {
            throw new BadRequestException('Username already taken');
        }

        const hashedPassword = await this.encryption.hashPassword(body.password);
        const user = await this.prisma.user.create({
            data: {
                username: body.username,
                password: hashedPassword
            }
        });

        return { message: 'User created successfully', username: user.username };
    }

    async signIn(body: any) {
        if (!body?.username || !body?.password) {
            throw new BadRequestException('Username and password are required');
        }

        const user = await this.prisma.user.findUnique({
            where: { username: body.username }
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isMatch = await this.encryption.comparePassword(body.password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Generate token
        const token = crypto.randomUUID();
        // Set in redis
        await this.redis.setAuthToken(token, user.username, 3600); // 1 hour

        return { message: 'Signed in', token };
    }
}
