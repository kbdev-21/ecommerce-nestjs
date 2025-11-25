import {
    Controller,
    Get,
    Post,
    Patch,
    Query,
    Body,
    Param,
    ParseIntPipe,
    DefaultValuePipe,
} from "@nestjs/common";
import { OrderService } from "./OrderService";
import {
    CreateOrderRequest,
    UpdateOrderStatusRequest,
    CalculateCartRequest,
} from "./dto/OrderRequestDtos";
import { Order } from "./schema/Order";

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

    // 🟨 3. Lấy chi tiết 1 đơn hàng theo id
    @Get(":id")
    async findById(@Param("id") id: string): Promise<Order> {
        return await this.orderService.findById(id);
    }

    // 🟧 4. Cập nhật trạng thái đơn hàng
    @Patch("/status")
    async updateStatus(
        @Body() request: UpdateOrderStatusRequest
    ): Promise<Order> {
        return await this.orderService.updateStatus(request);
    }

    // 🟪 5. Tính toán giỏ hàng tạm (không lưu DB)
    @Post("/calculate")
    async calculateCart(@Body() request: CalculateCartRequest): Promise<Order> {
        return await this.orderService.calculateCart(request);
    }
}
