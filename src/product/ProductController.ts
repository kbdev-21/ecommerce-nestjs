import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ProductService } from './ProductService';
import { CreateProductRequest } from './dto/CreateProductRequest';
import { ProductResponse } from './dto/ProductResponse';
import { UpdateProductRequest } from './dto/UpdateProductRequest';
import { CreateRatingRequest } from './dto/CreateRatingRequest';

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @Post("/api/products")
  async create(@Body() request: CreateProductRequest): Promise<ProductResponse> {
    return this.productService.createProduct(request);
  }

  @Get("/api/products")
  async findMany(
    @Query("searchKey") searchKey?: string,
    @Query("sortBy") sortBy?: "title" | "createdAt" | "price" | "sold",
    @Query("sortDirection") sortDirection?: "asc" | "desc",
    @Query("brand") brand?: string,
    @Query("category") category?: string,
    @Query("page") page = 1,
    @Query("pageSize") pageSize = 10,
  ): Promise<ProductResponse[]> {
    // Gom filter object nếu có
    const filter: { brand?: string; category?: string } = {};
    if (brand) filter.brand = brand;
    if (category) filter.category = category;

    const start = (page - 1) * pageSize;
    return this.productService.findProducts(searchKey, sortBy, sortDirection, filter, start, pageSize);
  }

  @Put("/api/products/:id")
  async update(
    @Param("id") id: string,
    @Body() request: UpdateProductRequest
  ): Promise<ProductResponse> {
    return this.productService.updateProductByProductId(id, request);
  }

  @Delete("/api/products/:id")
  async delete(@Param("id") id: string): Promise<{ success: boolean }> {
    await this.productService.deleteProductByProductId(id);
    return { success: true };
  }

  @Post("/api/products/:id/ratings")
  async createRating(
    @Param("id") id: string,
    @Body() request: CreateRatingRequest
  ): Promise<ProductResponse> {
    return this.productService.createProductRatingByProductId(id, request);
  }
}
