import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Order, Line } from "./schema/Order";
import {
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  CalculateCartRequest,
  OrderItemInput,
} from "./dto/OrderRequestDtos";
import { ProductService } from "../product/ProductService";
import { DiscountService } from "./DiscountService";

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<Order>,
    private readonly productService: ProductService,
    private readonly discountService: DiscountService
  ) { }

  // 🟩 1. Tạo đơn hàng mới (sau khi thanh toán thành công)
  async create(request: CreateOrderRequest): Promise<Order> {
    // Bước 1: Build lại thông tin lines
    const lines = await this.buildLinesFromItems(request.items);

    // Bước 2: Kiểm tra tồn kho
    for (const line of lines) {
      const variant = await this.productService.getVariantById(
        line.variantId
      );
      if (variant.stock < line.quantity) {
        throw new BadRequestException(
          `Sản phẩm "${line.displayName}" chỉ còn ${variant.stock} trong kho.`
        );
      }
    }

    // Bước 3: Tính tổng tiền ban đầu
    let totalPrice = this.calculateTotal(lines);

    // Bước 4: Áp dụng mã giảm giá (nếu có)
    if (request.discountCode) {
      try {
        const discount = await this.discountService.findByCode(
          request.discountCode
        );
        if (discount.type === "PERCENT") {
          totalPrice =
            totalPrice * (1 - discount.discountValue / 100);
        } else if (discount.type === "VND") {
          totalPrice = Math.max(
            0,
            totalPrice - discount.discountValue
          );
        }
      } catch (error) {
        throw new NotFoundException(
          `Mã giảm giá "${request.discountCode}" không hợp lệ.`
        );
      }
    }

    // Bước 5: Tạo order
    const createdOrder = new this.orderModel({
      id: crypto.randomUUID(),
      userId: request.userId,
      fullName: request.fullName,
      email: request.email,
      phoneNum: request.phoneNum,
      discountCode: request.discountCode ?? null,
      totalPrice,
      status: "PENDING",
      createdAt: new Date(),
      lines,
    });

    // Bước 6: Cập nhật kho
    for (const line of lines) {
      await this.productService.sellVariant(
        line.variantId,
        line.quantity
      );
    }

    // Bước 7: Lưu order
    return await createdOrder.save();
  }

  // 🟩 2. Lấy danh sách đơn hàng (phân trang)
  async findMany(userId?: string, start = 0, count = 10): Promise<Order[]> {
    const query: any = {};
    if (userId) {
      query.userId = userId;
    }
    return await this.orderModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(start)
      .limit(count)
      .exec();
  }

  // 🟩 3. Lấy đơn hàng theo ID
  async findById(id: string): Promise<Order> {
    const order = await this.orderModel.findOne({ id }).exec();
    if (!order) throw new NotFoundException("Không tìm thấy đơn hàng");
    return order;
  }

  // 🟩 4. Cập nhật trạng thái đơn hàng
  async updateStatus(request: UpdateOrderStatusRequest): Promise<Order> {
    const order = await this.orderModel.findOneAndUpdate(
      { id: request.id },
      { status: request.status },
      { new: true }
    );
    if (!order) throw new NotFoundException("Không tìm thấy đơn hàng");
    return order;
  }

  // 🟩 5. Tính toán giỏ hàng (cart tạm) — không lưu DB
  async calculateCart(request: CalculateCartRequest): Promise<Order> {
    const lines = await this.buildLinesFromItems(request.items);
    let totalPrice = this.calculateTotal(lines);

    // Áp dụng mã giảm giá nếu có
    if (request.discountCode) {
      try {
        const discount = await this.discountService.findByCode(
          request.discountCode
        );
        if (discount.type === "PERCENT") {
          totalPrice =
            totalPrice * (1 - discount.discountValue / 100);
        } else if (discount.type === "VND") {
          totalPrice = Math.max(
            0,
            totalPrice - discount.discountValue
          );
        }
      } catch (error) {
        // Invalid discount code - ignore for cart calculation
        // Frontend can show error message if needed
      }
    }

    return {
      id: "temp_cart",
      userId: request.userId,
      fullName: request.fullName,
      email: request.email,
      phoneNum: request.phoneNum,
      discountCode: request.discountCode ?? null,
      totalPrice,
      status: "CART",
      createdAt: new Date(),
      lines,
    } as Order;
  }

  // 🔹 Helper: tạo Line[] từ danh sách items
  private async buildLinesFromItems(
    items: OrderItemInput[]
  ): Promise<Line[]> {
    const lines: Line[] = [];

    for (const item of items) {
      const variant = await this.productService.getVariantById(
        item.variantId
      );
      if (!variant)
        throw new NotFoundException(
          `Variant ${item.variantId} không tồn tại`
        );

      const product = await this.productService.getProductByHandle(
        variant.productId
      );
      if (!product)
        throw new NotFoundException(
          `Product ${variant.productId} không tồn tại`
        );

      const line: Line = {
        productId: variant.productId,
        variantId: variant.id,
        displayName: `${product.title} - ${variant.name}`,
        imgUrl: product.imgUrls?.[0] ?? "",
        quantity: item.quantity,
        price: variant.price,
      };

      lines.push(line);
    }

    return lines;
  }

  // 🔹 Helper: tính tổng tiền
  private calculateTotal(lines: Line[]): number {
    return lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  }
}
