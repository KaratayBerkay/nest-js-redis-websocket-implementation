import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private client: RedisClientType;

    constructor() {
        this.client = createClient({ url: 'redis://localhost:6379' });
    }

    async onModuleInit() {
        await this.client.connect();
    }

    async onModuleDestroy() {
        await this.client.quit();
    }

    async setAuthToken(token: string, username: string, expiresInSeconds: number = 3600) {
        await this.client.setEx(`auth:token:${token}`, expiresInSeconds, username);
    }

    async getUsernameFromToken(token: string): Promise<string | null> {
        return this.client.get(`auth:token:${token}`);
    }

    async revokeToken(token: string) {
        await this.client.del(`auth:token:${token}`);
    }
}
