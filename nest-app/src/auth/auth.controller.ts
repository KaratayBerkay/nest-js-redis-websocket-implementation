import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('sign-up')
    async signUp(@Body() body: any) {
        return this.authService.signUp(body);
    }

    @Post('sign-in')
    async signIn(@Body() body: any) {
        return this.authService.signIn(body);
    }
}
