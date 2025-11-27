import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Patch,
    Query,
} from "@nestjs/common";
import { ProductService } from "./ProductService";
import { CreateProductRequest } from "./dto/CreateProductRequest";
import { ProductResponse } from "./dto/ProductResponse";
import { UpdateProductRequest } from "./dto/UpdateProductRequest";
import { CreateRatingRequest } from "./dto/CreateRatingRequest";

@Controller()
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    @Post("/api/products")
    async create(
        @Body() request: CreateProductRequest
    ): Promise<ProductResponse> {
        return this.productService.createProduct(request);
    }

    @Get("/api/products")
    async findMany(
        @Query("searchKey") searchKey?: string,
        @Query("sortBy") sortBy?: string,
        @Query("brand") brand?: string,
        @Query("category") category?: string,
        @Query("page") page = 1,
        @Query("pageSize") pageSize = 10
    ): Promise<ProductResponse[]> {
        // Gom filter object nếu có
        const filter: { brand?: string; category?: string } = {};
        if (brand) filter.brand = brand.trim();
        if (category) filter.category = category.trim();

        // Set default sortBy if not provided
        const sortByValue = sortBy ?? "-createdAt";

        // Convert to numbers (query params are strings)
        const pageNum = Number(page) || 1;
        const pageSizeNum = Number(pageSize) || 10;

        const start = (pageNum - 1) * pageSizeNum;
        return this.productService.findProducts(
            searchKey,
            sortByValue,
            filter,
            start,
            pageSizeNum
        );
    }

    @Get("/api/products/by-slug/:slug")
    async getBySlug(@Param("slug") slug: string): Promise<ProductResponse> {
        return this.productService.getProductBySlug(slug);
    }

    @Patch("/api/products/:id")
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

    @Get("/api/categories")
    async getCategories() {
        return this.productService.getCategories();
    }

    @Get("/api/brands")
    async getBrands() {
        return this.productService.getBrands();
    }
}
