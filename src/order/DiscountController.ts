import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
} from "@nestjs/common";
import { DiscountService } from "./DiscountService";
import { Discount } from "./schema/Discount";

@Controller("/api/discounts")
export class DiscountController {
    constructor(private readonly discountService: DiscountService) {}

    // 🟩 1. Tạo discount mới
    @Post()
    async create(
        @Body() request: Omit<Discount, "id" | "usageCount">
    ): Promise<Discount> {
        return await this.discountService.create(request);
    }

    // 🟦 2. Lấy danh sách discount
    @Get()
    async findMany(): Promise<Discount[]> {
        return await this.discountService.findMany();
    }

    // 🟨 3. Lấy discount theo id
    @Get(":id")
    async findById(@Param("id") id: string): Promise<Discount> {
        return await this.discountService.findById(id);
    }

    // 🟪 4. Lấy discount theo code
    @Get("/code/:code")
    async findByCode(@Param("code") code: string): Promise<Discount> {
        return await this.discountService.findByCode(code);
    }

    // 🟧 5. Cập nhật discount
    @Patch(":id")
    async update(
        @Param("id") id: string,
        @Body() request: Partial<Discount>
    ): Promise<Discount> {
        return await this.discountService.update(id, request);
    }

    // 🟥 6. Xoá discount
    @Delete(":id")
    async delete(@Param("id") id: string): Promise<{ message: string }> {
        await this.discountService.delete(id);
        return { message: "Đã xoá discount thành công" };
    }
}
