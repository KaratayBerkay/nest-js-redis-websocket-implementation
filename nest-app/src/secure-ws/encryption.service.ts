import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
    private readonly algorithm = 'aes-256-ctr';
    private readonly secretKey = crypto.createHash('sha256').update(String('super-secret-key-123')).digest('base64').substring(0, 32);

    async hashPassword(password: string): Promise<string> {
        const saltOrRounds = 10;
        return bcrypt.hash(password, saltOrRounds);
    }

    async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    encrypt(text: string): { iv: string; content: string } {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
        const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

        return {
            iv: iv.toString('hex'),
            content: encrypted.toString('hex')
        };
    }

    decrypt(hash: { iv: string; content: string }): string {
        const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, Buffer.from(hash.iv, 'hex'));
        const decrypted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
        return decrypted.toString();
    }
}
