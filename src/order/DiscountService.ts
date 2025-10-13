import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Discount } from './schema/Discount';
import * as crypto from 'crypto';

@Injectable()
export class DiscountService {
  constructor(
    @InjectModel(Discount.name)
    private readonly discountModel: Model<Discount>,
  ) {}

  // 🟩 1. Tạo discount mới
  async create(request: Omit<Discount, 'id'>): Promise<Discount> {
    // Validate input
    if (!request.code?.trim()) {
      throw new BadRequestException('Code không được để trống');
    }
    if (request.discountValue < 0) {
      throw new BadRequestException('Giá trị giảm không hợp lệ');
    }
    if (request.type !== 'VND' && request.type !== 'PERCENT') {
      throw new BadRequestException('Loại giảm giá không hợp lệ (VND hoặc PERCENT)');
    }

    // Kiểm tra trùng code
    const existing = await this.discountModel.findOne({ code: request.code }).exec();
    if (existing) {
      throw new BadRequestException('Mã giảm giá đã tồn tại');
    }

    const created = new this.discountModel({
      id: crypto.randomUUID(),
      code: request.code.trim(),
      type: request.type,
      discountValue: request.discountValue,
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
    if (!discount) throw new NotFoundException('Không tìm thấy discount');
    return discount;
  }

  async findByCode(code: string): Promise<Discount> {
    const discount = await this.discountModel.findOne({ code: code.trim() }).exec();
    if (!discount) throw new NotFoundException('Không tìm thấy mã giảm giá');
    return discount;
  }


  // 🟧 4. Cập nhật discount
  async update(id: string, request: Discount): Promise<Discount> {
    if (request.discountValue < 0) {
      throw new BadRequestException('Giá trị giảm không hợp lệ');
    }
    if (request.type !== 'VND' && request.type !== 'PERCENT') {
      throw new BadRequestException('Loại giảm giá không hợp lệ');
    }

    const updated = await this.discountModel.findOneAndUpdate(
      { id },
      {
        code: request.code?.trim(),
        type: request.type,
        discountValue: request.discountValue,
      },
      { new: true },
    );

    if (!updated) throw new NotFoundException('Không tìm thấy discount để cập nhật');
    return updated;
  }

  // 🟥 5. Xoá discount
  async delete(id: string): Promise<void> {
    const deleted = await this.discountModel.findOneAndDelete({ id }).exec();
    if (!deleted) throw new NotFoundException('Không tìm thấy discount để xoá');
  }
}
