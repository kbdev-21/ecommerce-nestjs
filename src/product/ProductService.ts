import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Product, Rating, Variant } from "./schema/Product";
import { CreateProductRequest } from "./dto/CreateProductRequest";
import { normalizeText, createSlug } from "../shared/string-utils";
import { Brand } from "./schema/Brand";
import { Category } from "./schema/Category";
import { ProductResponse } from "./dto/ProductResponse";
import { UpdateProductRequest } from "./dto/UpdateProductRequest";
import { CreateRatingRequest } from "./dto/CreateRatingRequest";

@Injectable()
export class ProductService {
    constructor(
        @InjectModel(Product.name) private productModel: Model<Product>,
        @InjectModel(Brand.name) private brandModel: Model<Brand>,
        @InjectModel(Category.name) private categoryModel: Model<Category>
    ) {}

    async createProduct(
        request: CreateProductRequest
    ): Promise<ProductResponse> {
        const newProductId = crypto.randomUUID();

        const newVariants: Variant[] = request.variants.map((variantDto) => ({
            id: crypto.randomUUID(),
            name: variantDto.name,
            stock: variantDto.stock,
            price: variantDto.price,
            sold: 0,
        }));

        const newProduct = new this.productModel({
            id: newProductId,
            title: request.title,
            normalizedTitle: normalizeText(request.title),
            slug: createSlug(request.title),
            description: request.description,
            brand: request.brand,
            category: request.category,
            imgUrls: request.imgUrls,
            variants: newVariants,
            ratings: [],
            createdAt: new Date(),
        });

        const savedProduct = await newProduct.save();
        await this.updateBrandAfterProductChanges(
            savedProduct.brand,
            "increase"
        );
        await this.updateCategoryAfterProductChanges(
            savedProduct.category,
            "increase"
        );

        return this.productToResponse(savedProduct);
    }

    async getProductBySlug(slug: string): Promise<ProductResponse> {
        const product = await this.productModel.findOne({ slug }).exec();

        if (!product) {
            throw new Error(`Product with slug "${slug}" not found`);
        }

        return this.productToResponse(product);
    }

    async findProducts(
        searchKey?: string,
        sortBy?: string,
        filter?: {
            brand?: string;
            category?: string;
        },
        start = 0, // mặc định từ đầu
        count = 10 // mặc định 10 item
    ): Promise<ProductResponse[]> {
        // Parse sortBy: "-createdAt" means desc, "createdAt" means asc
        let sortField: Record<string, 1 | -1> = { createdAt: -1 }; // default: newest first

        if (sortBy) {
            const isDescending = sortBy.startsWith("-");
            const fieldName = isDescending ? sortBy.substring(1) : sortBy;
            const sortOrder = isDescending ? -1 : 1;

            // Map field names to aggregation fields
            if (fieldName === "sold") sortField = { totalSold: sortOrder };
            else if (fieldName === "price") sortField = { minPrice: sortOrder };
            else if (fieldName === "title") sortField = { title: sortOrder };
            else if (fieldName === "createdAt")
                sortField = { createdAt: sortOrder };
        }

        // Aggregation pipeline
        const pipeline: any[] = [];

        // $match filter & searchKey
        const match: any = {};
        if (searchKey)
            match.normalizedTitle = { $regex: searchKey, $options: "i" };
        if (filter?.brand) match.brand = filter.brand.trim();
        if (filter?.category) match.category = filter.category.trim();
        if (Object.keys(match).length > 0) pipeline.push({ $match: match });

        // Tính aggregate fields từ embedded variants
        pipeline.push({
            $addFields: {
                totalSold: { $sum: "$variants.sold" },
                minPrice: { $min: "$variants.price" },
            },
        });

        // Sort
        pipeline.push({ $sort: sortField });

        // Pagination
        pipeline.push({ $skip: start });
        pipeline.push({ $limit: count });

        // Execute
        const products = await this.productModel.aggregate(pipeline).exec();

        return this.productsToResponses(products);
    }

    async updateProductByProductId(
        productId: string,
        request: UpdateProductRequest
    ): Promise<ProductResponse> {
        const product = await this.productModel
            .findOne({ id: productId })
            .exec();
        if (!product) {
            throw new Error(`Product with id ${productId} not found`);
        }

        // backup brand/category cũ để xử lý count
        const oldBrand = product.brand;
        const oldCategory = product.category;

        // cập nhật field nếu có trong request
        if (request.title) {
            product.title = request.title;
            product.normalizedTitle = normalizeText(request.title);
            product.slug = createSlug(request.title);
        }
        if (request.description) product.description = request.description;
        if (request.category) product.category = request.category;
        if (request.brand) product.brand = request.brand;
        if (request.imgUrls) product.imgUrls = request.imgUrls;

        // nếu có variants mới thì xử lý theo id
        if (request.variants) {
            // lấy tất cả variants hiện tại của product
            const existingVariantMap = new Map(
                (product.variants || []).map((v) => [v.id, v])
            );

            // tập hợp id từ request
            const requestVariantIds = new Set(
                request.variants
                    .map((v) => v.id)
                    .filter((id): id is string => id !== undefined)
            );

            // xử lý từng variant trong request
            const updatedVariants: Variant[] = [];

            for (const vdto of request.variants) {
                if (vdto.id) {
                    // variant có id -> update variant hiện tại
                    const existingVariant = existingVariantMap.get(vdto.id);
                    if (!existingVariant) {
                        throw new Error(`Variant with id ${vdto.id} not found`);
                    }

                    existingVariant.name = vdto.name;
                    existingVariant.price = vdto.price;
                    existingVariant.stock = vdto.stock;
                    updatedVariants.push(existingVariant);
                } else {
                    // variant không có id -> tạo mới
                    const newVariant: Variant = {
                        id: crypto.randomUUID(),
                        name: vdto.name,
                        price: vdto.price,
                        stock: vdto.stock,
                        sold: 0,
                    };
                    updatedVariants.push(newVariant);
                }
            }

            product.variants = updatedVariants;
            // đảm bảo Mongoose nhận ra thay đổi trên mảng variants (kiểu Array/Mixed)
            (product as any).markModified("variants");
        }

        const saved = await product.save();

        // xử lý brand/category count
        if (request.brand && request.brand !== oldBrand) {
            await this.updateBrandAfterProductChanges(oldBrand, "decrease");
            await this.updateBrandAfterProductChanges(
                request.brand,
                "increase"
            );
        }
        if (request.category && request.category !== oldCategory) {
            await this.updateCategoryAfterProductChanges(
                oldCategory,
                "decrease"
            );
            await this.updateCategoryAfterProductChanges(
                request.category,
                "increase"
            );
        }

        return this.productToResponse(saved);
    }

    async getProductByHandle(handle: string): Promise<ProductResponse> {
        const product = await this.productModel
            .findOne({
                $or: [
                    { id: handle },
                    { normalizedTitle: handle },
                    { slug: handle },
                ],
            })
            .exec();

        if (!product) {
            throw new Error(`Product with handle "${handle}" not found`);
        }

        return this.productToResponse(product);
    }

    async getProductByVariantId(variantId: string): Promise<ProductResponse> {
        const product = await this.productModel
            .findOne({ "variants.id": variantId })
            .exec();

        if (!product) {
            throw new Error(`Product with variant id "${variantId}" not found`);
        }

        return this.productToResponse(product);
    }

    // Lấy variant theo id
    async getVariantById(id: string): Promise<Variant> {
        const product = await this.productModel
            .findOne({ "variants.id": id })
            .exec();
        if (!product) {
            throw new Error(`Variant with id "${id}" not found`);
        }
        const variant = product.variants.find((v) => v.id === id);
        if (!variant) {
            throw new Error(`Variant with id "${id}" not found`);
        }
        return variant;
    }

    // Bán variant: giảm stock, tăng sold
    async sellVariant(id: string, quantity: number): Promise<Variant> {
        if (quantity <= 0) throw new Error("Quantity must be positive");

        const product = await this.productModel
            .findOne({ "variants.id": id })
            .exec();
        if (!product) {
            throw new Error(`Variant with id "${id}" not found`);
        }

        const variant = product.variants.find((v) => v.id === id);
        if (!variant) {
            throw new Error(`Variant with id "${id}" not found`);
        }

        if (variant.stock < quantity) {
            throw new Error(`Insufficient stock for variant "${id}"`);
        }

        // cập nhật số lượng
        variant.stock -= quantity;
        variant.sold += quantity;

        // vì variants được khai báo là Array (Mixed) nên cần markModified
        // để Mongoose thực sự lưu thay đổi vào DB
        (product as any).markModified("variants");

        const savedProduct = await product.save();
        const updatedVariant = savedProduct.variants.find((v) => v.id === id);

        // fallback: nếu vì lý do gì đó không tìm thấy, trả về bản variant đã modify
        return (updatedVariant as Variant) ?? variant;
    }

    async createProductRatingByProductId(
        productId: string,
        request: CreateRatingRequest
    ): Promise<ProductResponse> {
        const product = await this.productModel
            .findOne({ id: productId })
            .exec();
        if (!product) {
            throw new Error(`Product with id ${productId} not found`);
        }

        const newRating: Rating = new Rating();
        newRating.id = crypto.randomUUID();
        newRating.userId = request.userId;
        newRating.userName = request.userName;
        newRating.score = request.score;
        newRating.comment = request.comment;
        newRating.createdAt = new Date();

        product.ratings.push(newRating);

        const savedProduct = await product.save();
        return this.productToResponse(savedProduct);
    }

    async deleteProductByProductId(productId: string): Promise<void> {
        const product = await this.productModel
            .findOne({ id: productId })
            .exec();
        if (!product) {
            throw new Error(`Product with id ${productId} not found`);
        }

        // decrease brand/category count
        if (product.brand) {
            await this.updateBrandAfterProductChanges(
                product.brand,
                "decrease"
            );
        }
        if (product.category) {
            await this.updateCategoryAfterProductChanges(
                product.category,
                "decrease"
            );
        }

        // xoá product
        await this.productModel.deleteOne({ id: product.id }).exec();
    }

    private productToResponse(product: Product): ProductResponse {
        return this.productsToResponses([product])[0];
    }

    private productsToResponses(products: Product[]): ProductResponse[] {
        return products.map((product) => {
            return {
                id: product.id,
                title: product.title,
                normalizedTitle: product.normalizedTitle,
                slug: product.slug,
                description: product.description,
                category: product.category,
                brand: product.brand,
                imgUrls: product.imgUrls,
                variants: product.variants || [],
                ratings: product.ratings,
                createdAt: product.createdAt,
            };
        });
    }

    private async updateBrandAfterProductChanges(
        brandTitle: string,
        type: "increase" | "decrease"
    ): Promise<Brand> {
        let brand = await this.brandModel.findOne({ title: brandTitle }).exec();
        if (!brand) {
            brand = new this.brandModel({
                id: crypto.randomUUID(),
                title: brandTitle,
                productCount: type === "increase" ? 1 : 0,
            });
            return brand.save();
        }
        brand.productCount += type === "increase" ? 1 : -1;
        return brand.save();
    }

    private async updateCategoryAfterProductChanges(
        categoryTitle: string,
        type: "increase" | "decrease"
    ): Promise<Brand> {
        let category = await this.categoryModel
            .findOne({ title: categoryTitle })
            .exec();
        if (!category) {
            category = new this.categoryModel({
                id: crypto.randomUUID(),
                title: categoryTitle,
                productCount: type === "increase" ? 1 : 0,
            });
            return category.save();
        }
        category.productCount += type === "increase" ? 1 : -1;
        return category.save();
    }

    async getCategories(): Promise<Category[]> {
        return await this.categoryModel
            .find({})
            .sort({ productCount: -1 })
            .exec();
    }

    async getBrands(): Promise<Brand[]> {
        return await this.brandModel.find({}).sort({ productCount: -1 }).exec();
    }
}
