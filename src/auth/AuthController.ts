import {
    Body,
    Controller,
    Post,
    Get,
    Req,
    UseGuards,
    Param,
    Put,
    Patch,
    Query,
    ForbiddenException,
} from "@nestjs/common";
import { AuthService } from "./AuthService";
import { SignUpRequest } from "./dto/SignUpRequest";
import { SignInRequest } from "./dto/SignInRequest";
import { SignInResponse } from "./dto/SignInResponse";
import { UserResponse } from "./dto/UserResponse";
import { JwtAuthGuard } from "./JwtAuthGuard";
import { JwtPayload } from "./JwtService";
import { ChangePasswordRequest } from "./dto/ChangePasswordRequest";
import { UpdateUserRequestDto } from "./dto/UpdateUserRequestDto";
import { ConfirmForgetPasswordRequestDto } from "./dto/ConfirmForgetPasswordRequestDto";

@Controller()
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post("/api/auth/signup")
    async signUp(@Body() dto: SignUpRequest): Promise<SignInResponse> {
        return this.authService.signUp(dto);
    }

    @Post("/api/auth/signin")
    async signIn(@Body() dto: SignInRequest): Promise<SignInResponse> {
        return this.authService.signInWithEmailAndPassword(dto);
    }

    @Get("/api/auth/me")
    @UseGuards(JwtAuthGuard)
    async me(
        @Req() req: Request & { user: JwtPayload }
    ): Promise<UserResponse> {
        const userId = req.user.sub;
        return this.authService.getUserById(userId);
    }

    @Post("/api/auth/change-password")
    @UseGuards(JwtAuthGuard)
    async changePassword(
        @Req() req: Request & { user: JwtPayload },
        @Body() dto: ChangePasswordRequest
    ): Promise<{ message: string }> {
        await this.authService.changePassword(req.user.sub, dto);
        return { message: "Password changed successfully" };
    }

    @Post("/api/auth/forget-password/init")
    async initForgetPassword(
        @Body() body: { email: string }
    ): Promise<{ message: string; requestId: string }> {
        return this.authService.initForgetPasswordRequest(body.email);
    }

    @Post("/api/auth/forget-password/confirm")
    async confirmForgetPassword(
        @Body() dto: ConfirmForgetPasswordRequestDto
    ): Promise<{ message: string }> {
        return this.authService.confirmForgetPasswordRequest(dto);
    }

    @Post("/api/auth/toggle-ban-user/:id")
    @UseGuards(JwtAuthGuard)
    async toggleBanUser(
        @Param("id") id: string,
        @Req() req: Request & { user: JwtPayload }
    ): Promise<{ message: string; isBanned: boolean }> {
        const currentUser = req.user;

        if (currentUser.role !== "ADMIN") {
            throw new ForbiddenException("Only ADMIN can perform this action");
        }

        const updatedUser = await this.authService.toggleBanUserById(id);
        return {
            message: `User ${
                updatedUser.isBanned ? "banned" : "unbanned"
            } successfully`,
            isBanned: updatedUser.isBanned,
        };
    }

    @Get("/api/users")
    @UseGuards(JwtAuthGuard)
    async getAllUsers(
        @Req() req: Request & { user: JwtPayload },
        @Query("page") page = 1,
        @Query("pageSize") pageSize = 10
    ): Promise<UserResponse[]> {
        if (req.user.role !== "ADMIN") {
            throw new ForbiddenException("Only ADMIN can view all users");
        }

        const pageNum = Number(page) || 1;
        const pageSizeNum = Number(pageSize) || 10;

        return this.authService.getAllUsers(pageNum, pageSizeNum);
    }

    @Get("/api/users/:id")
    @UseGuards(JwtAuthGuard)
    async getUserById(
        @Param("id") id: string,
        @Req() req: Request & { user: JwtPayload }
    ): Promise<UserResponse> {
        const currentUser = req.user;

        // Chỉ cho phép ADMIN hoặc chính chủ user
        if (currentUser.role !== "ADMIN" && currentUser.sub !== id) {
            throw new ForbiddenException("Access denied");
        }

        return this.authService.getUserById(id);
    }

    @Patch("/api/users/:id")
    @UseGuards(JwtAuthGuard)
    async updateUserById(
        @Param("id") id: string,
        @Body() dto: UpdateUserRequestDto,
        @Req() req: Request & { user: JwtPayload }
    ): Promise<UserResponse> {
        const currentUser = req.user;

        // Chỉ cho phép ADMIN hoặc chính chủ user
        if (currentUser.role !== "ADMIN" && currentUser.sub !== id) {
            throw new ForbiddenException("Access denied");
        }

        return this.authService.updateUserById(id, dto);
    }

    @Get("/api/users/dashboard/count")
    @UseGuards(JwtAuthGuard)
    async getTotalUsers(
        @Req() req: Request & { user: JwtPayload }
    ): Promise<number> {
        if (req.user.role !== "ADMIN") {
            throw new ForbiddenException("Only ADMIN can view total users");
        }

        return this.authService.getTotalUsers();
    }
}
