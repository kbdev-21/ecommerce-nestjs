import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    Req,
    ForbiddenException,
} from "@nestjs/common";
import { DiscountService } from "./DiscountService";
import { Discount } from "./schema/Discount";
import { JwtAuthGuard } from "../auth/JwtAuthGuard";
import { JwtPayload } from "../auth/JwtService";

@Controller("/api/discounts")
export class DiscountController {
    constructor(private readonly discountService: DiscountService) {}

    // 🟩 1. Tạo discount mới
    @Post()
    @UseGuards(JwtAuthGuard)
    async create(
        @Body() request: Omit<Discount, "id" | "usageCount">,
        @Req() req: Request & { user: JwtPayload }
    ): Promise<Discount> {
        if (req.user.role !== "ADMIN") {
            throw new ForbiddenException("Only ADMIN can perform this action");
        }
        return await this.discountService.create(request);
    }

    // 🟦 2. Lấy danh sách discount
    @Get()
    @UseGuards(JwtAuthGuard)
    async findMany(
        @Req() req: Request & { user: JwtPayload }
    ): Promise<Discount[]> {
        if (req.user.role !== "ADMIN") {
            throw new ForbiddenException("Only ADMIN can perform this action");
        }
        return await this.discountService.findMany();
    }

    // 🟨 3. Lấy discount theo id
    @Get(":id")
    @UseGuards(JwtAuthGuard)
    async findById(
        @Param("id") id: string,
        @Req() req: Request & { user: JwtPayload }
    ): Promise<Discount> {
        if (req.user.role !== "ADMIN") {
            throw new ForbiddenException("Only ADMIN can perform this action");
        }
        return await this.discountService.findById(id);
    }

    // 🟪 4. Lấy discount theo code
    @Get("/code/:code")
    @UseGuards(JwtAuthGuard)
    async findByCode(
        @Param("code") code: string,
        @Req() req: Request & { user: JwtPayload }
    ): Promise<Discount> {
        if (req.user.role !== "ADMIN") {
            throw new ForbiddenException("Only ADMIN can perform this action");
        }
        return await this.discountService.findByCode(code);
    }

    // 🟧 5. Cập nhật discount
    @Patch(":id")
    @UseGuards(JwtAuthGuard)
    async update(
        @Param("id") id: string,
        @Body() request: Partial<Discount>,
        @Req() req: Request & { user: JwtPayload }
    ): Promise<Discount> {
        if (req.user.role !== "ADMIN") {
            throw new ForbiddenException("Only ADMIN can perform this action");
        }
        return await this.discountService.update(id, request);
    }

    // 🟥 6. Xoá discount
    @Delete(":id")
    @UseGuards(JwtAuthGuard)
    async delete(
        @Param("id") id: string,
        @Req() req: Request & { user: JwtPayload }
    ): Promise<{ message: string }> {
        if (req.user.role !== "ADMIN") {
            throw new ForbiddenException("Only ADMIN can perform this action");
        }
        await this.discountService.delete(id);
        return { message: "Đã xoá discount thành công" };
    }
}
