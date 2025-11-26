import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Discount } from "./schema/Discount";
import * as crypto from "crypto";

@Injectable()
export class DiscountService {
    constructor(
        @InjectModel(Discount.name)
        private readonly discountModel: Model<Discount>
    ) {}

    // 🟩 1. Tạo discount mới
    async create(
        request: Omit<Discount, "id" | "usageCount">
    ): Promise<Discount> {
        // Validate input
        if (!request.code?.trim()) {
            throw new BadRequestException("Code không được để trống");
        }
        if (request.code.trim().length !== 5) {
            throw new BadRequestException("Code phải có đúng 5 ký tự");
        }
        if (request.discountValue < 0) {
            throw new BadRequestException("Giá trị giảm không hợp lệ");
        }
        if (request.usageLimit < 1) {
            throw new BadRequestException("Giới hạn sử dụng phải >= 1");
        }

        // Kiểm tra trùng code
        const existing = await this.discountModel
            .findOne({ code: request.code })
            .exec();
        if (existing) {
            throw new BadRequestException("Mã giảm giá đã tồn tại");
        }

        const created = new this.discountModel({
            id: crypto.randomUUID(),
            code: request.code.trim(),
            discountValue: request.discountValue,
            usageCount: 0,
            usageLimit: request.usageLimit,
            createdAt: new Date(),
        });

        return await created.save();
    }

    // 🟦 2. Lấy danh sách discount
    async findMany(): Promise<Discount[]> {
        return await this.discountModel.find().sort({ createdAt: -1 }).exec();
    }

    // 🟨 3. Lấy discount theo id
    async findById(id: string): Promise<Discount> {
        const discount = await this.discountModel.findOne({ id }).exec();
        if (!discount) throw new NotFoundException("Không tìm thấy discount");
        return discount;
    }

    async findByCode(code: string): Promise<Discount> {
        const discount = await this.discountModel
            .findOne({ code: code.trim() })
            .exec();
        if (!discount)
            throw new NotFoundException("Không tìm thấy mã giảm giá");
        return discount;
    }

    // 🟧 4. Cập nhật discount
    async update(id: string, request: Partial<Discount>): Promise<Discount> {
        if (request.code !== undefined && request.code.trim().length !== 5) {
            throw new BadRequestException("Code phải có đúng 5 ký tự");
        }
        if (request.discountValue !== undefined && request.discountValue < 0) {
            throw new BadRequestException("Giá trị giảm không hợp lệ");
        }
        if (request.usageLimit !== undefined && request.usageLimit < 1) {
            throw new BadRequestException("Giới hạn sử dụng phải >= 1");
        }

        const updateData: any = {};
        if (request.code) updateData.code = request.code.trim();
        if (request.discountValue !== undefined)
            updateData.discountValue = request.discountValue;
        if (request.usageLimit !== undefined)
            updateData.usageLimit = request.usageLimit;

        const updated = await this.discountModel.findOneAndUpdate(
            { id },
            updateData,
            { new: true }
        );

        if (!updated)
            throw new NotFoundException("Không tìm thấy discount để cập nhật");
        return updated;
    }

    // 🟪 6. Tăng usageCount
    async incrementUsage(code: string): Promise<void> {
        await this.discountModel.updateOne(
            { code: code.trim() },
            { $inc: { usageCount: 1 } }
        );
    }

    // 🟥 5. Xoá discount
    async delete(id: string): Promise<void> {
        const deleted = await this.discountModel
            .findOneAndDelete({ id })
            .exec();
        if (!deleted)
            throw new NotFoundException("Không tìm thấy discount để xoá");
    }
}
