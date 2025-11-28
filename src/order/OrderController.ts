import {
    Body,
    Controller,
    DefaultValuePipe,
    ForbiddenException,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from "@nestjs/common";
import { OrderService } from "./OrderService";
import {
    CreateOrderRequest,
    UpdateOrderStatusRequest,
    CalculateCartRequest,
} from "./dto/OrderRequestDtos";
import { Order } from "./schema/Order";
import { JwtAuthGuard } from "../auth/JwtAuthGuard";
import { JwtPayload } from "../auth/JwtService";

@Controller("/api/orders")
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    // 🟩 1. Tạo đơn hàng (sau thanh toán)
    @Post()
    async create(@Body() request: CreateOrderRequest): Promise<Order> {
        return await this.orderService.create(request);
    }

    // 🟦 2. Lấy danh sách đơn hàng (phân trang)
    @Get()
    async findMany(
        @Query("start", new DefaultValuePipe(0), ParseIntPipe) start: number,
        @Query("count", new DefaultValuePipe(10), ParseIntPipe) count: number,
        @Query("email") email?: string
    ): Promise<Order[]> {
        return await this.orderService.findMany(email, start, count);
    }

    @Get("/dashboard/count")
    @UseGuards(JwtAuthGuard)
    async getCompletedOrdersCount(
        @Req() req: Request & { user: JwtPayload }
    ): Promise<number> {
        if (req.user.role !== "ADMIN") {
            throw new ForbiddenException("Only ADMIN can perform this action");
        }

        return await this.orderService.getCompletedOrdersCount();
    }

    @Get("/dashboard/revenue")
    @UseGuards(JwtAuthGuard)
    async getCompletedOrdersRevenue(
        @Req() req: Request & { user: JwtPayload }
    ): Promise<number> {
        if (req.user.role !== "ADMIN") {
            throw new ForbiddenException("Only ADMIN can perform this action");
        }

        return await this.orderService.getCompletedOrdersRevenue();
    }

    // 🟨 3. Lấy chi tiết 1 đơn hàng theo id
    @Get(":id")
    async findById(@Param("id") id: string): Promise<Order> {
        return await this.orderService.findById(id);
    }

    // 🟧 4. Cập nhật trạng thái đơn hàng
    @Patch("/status")
    @UseGuards(JwtAuthGuard)
    async updateStatus(
        @Body() request: UpdateOrderStatusRequest,
        @Req() req: Request & { user: JwtPayload }
    ): Promise<Order> {
        if (req.user.role !== "ADMIN") {
            throw new ForbiddenException("Only ADMIN can perform this action");
        }

        return await this.orderService.updateStatus(request);
    }

    // 🟪 5. Tính toán giỏ hàng tạm (không lưu DB)
    @Post("/calculate")
    async calculateCart(@Body() request: CalculateCartRequest): Promise<Order> {
        return await this.orderService.calculateCart(request);
    }
}
