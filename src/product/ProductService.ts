import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from 'mongoose';
import { Product, Rating } from './schema/Product';
import { CreateProductRequest } from './dto/CreateProductRequest';
import { Variant } from './schema/Variant';
import { normalizeText } from '../shared/string-utils';
import { Brand } from './schema/Brand';
import { Category } from './schema/Category';
import { ProductResponse } from './dto/ProductResponse';
import { UpdateProductRequest } from './dto/UpdateProductRequest';
import { CreateRatingRequest } from './dto/CreateRatingRequest';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Variant.name) private variantModel: Model<Variant>,
    @InjectModel(Brand.name) private brandModel: Model<Brand>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  async createProduct(request: CreateProductRequest): Promise<ProductResponse> {
    const newProductId = crypto.randomUUID();

    const newVariants = await Promise.all(
      request.variants.map(variantDto => {
        const newVariant = new this.variantModel({
          id: crypto.randomUUID(),
          productId: newProductId,
          productTitle: request.title,
          name: variantDto.name,
          stock: variantDto.stock,
          price: variantDto.price,
          sold: 0
        });
        return newVariant.save();
      })
    );

    const newProduct = new this.productModel({
      id: newProductId,
      title: request.title,
      normalizedTitle: normalizeText(request.title),
      description: request.description,
      brand: request.brand,
      category: request.category,
      imgUrls: request.imgUrls,
      status: "PUBLISHED",
      variantIds: newVariants.map(v => v.id),
      ratings: [],
      createdAt: new Date()
    });

    const savedProduct = await newProduct.save();
    await this.updateBrandAfterProductChanges(savedProduct.brand, "increase");
    await this.updateCategoryAfterProductChanges(savedProduct.category, "increase");

    return this.productToResponse(savedProduct, this.variantModel);
  }

  async findProducts(
    searchKey?: string,
    sortBy?: "title" | "createdAt" | "price" | "sold",
    sortDirection?: "asc" | "desc",
    filter?: {
      brand?: string;
      category?: string;
    },
    start = 0,   // mặc định từ đầu
    count = 10,  // mặc định 10 item
  ): Promise<ProductResponse[]> {
    // Xác định default direction dựa theo field
    let defaultDirection: "asc" | "desc" =
      sortBy === "price" || sortBy === "title" ? "asc" : "desc";

    const direction = sortDirection || defaultDirection;
    const sortOrder = direction === "asc" ? 1 : -1;

    // Xác định field sort theo aggregation
    let sortField: Record<string, 1 | -1> = { createdAt: -1 }; // default
    if (sortBy === "sold") sortField = { totalSold: sortOrder };
    else if (sortBy === "price") sortField = { minPrice: sortOrder };
    else if (sortBy === "title") sortField = { title: sortOrder };
    else if (sortBy === "createdAt") sortField = { createdAt: sortOrder };

    // Aggregation pipeline
    const pipeline: any[] = [];

    // $match filter & searchKey
    const match: any = {};
    if (searchKey) match.normalizedTitle = { $regex: searchKey, $options: "i" };
    if (filter?.brand) match.brand = filter.brand;
    if (filter?.category) match.category = filter.category;
    if (Object.keys(match).length > 0) pipeline.push({ $match: match });

    // $lookup variants
    pipeline.push({
      $lookup: {
        from: "variants",
        localField: "id",
        foreignField: "productId",
        as: "variants"
      }
    });

    // Tính aggregate fields
    pipeline.push({
      $addFields: {
        totalSold: { $sum: "$variants.sold" },
        minPrice: { $min: "$variants.price" }
      }
    });

    // Sort
    pipeline.push({ $sort: sortField });

    // Pagination
    pipeline.push({ $skip: start });
    pipeline.push({ $limit: count });

    // Execute
    const products = await this.productModel.aggregate(pipeline).exec();

    return this.productsToResponses(products, this.variantModel);
  }

  async updateProductByProductId(productId: string, request: UpdateProductRequest): Promise<ProductResponse> {
    const product = await this.productModel.findOne({ id: productId }).exec();
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
    }
    if (request.description) product.description = request.description;
    if (request.category) product.category = request.category;
    if (request.brand) product.brand = request.brand;
    if (request.imgUrls) product.imgUrls = request.imgUrls;
    if (request.status) product.status = request.status;

    // nếu có variants mới thì replace toàn bộ
    if (request.variants) {
      // xoá variants cũ
      await this.variantModel.deleteMany({ productId: product.id }).exec();

      // tạo variants mới
      const newVariants = await Promise.all(
        request.variants.map(vdto => {
          const variant = new this.variantModel({
            id: crypto.randomUUID(),
            productId: product.id,
            productTitle: product.title,
            name: vdto.name,
            price: vdto.price,
            stock: vdto.stock,
          });
          return variant.save();
        })
      );

      product.variantIds = newVariants.map(v => v.id);
    }

    const saved = await product.save();

    // xử lý brand/category count
    if (request.brand && request.brand !== oldBrand) {
      await this.updateBrandAfterProductChanges(oldBrand, "decrease");
      await this.updateBrandAfterProductChanges(request.brand, "increase");
    }
    if (request.category && request.category !== oldCategory) {
      await this.updateCategoryAfterProductChanges(oldCategory, "decrease");
      await this.updateCategoryAfterProductChanges(request.category, "increase");
    }

    return this.productToResponse(saved, this.variantModel);
  }

  async getProductByHandle(handle: string): Promise<ProductResponse> {
    const product = await this.productModel.findOne({
      $or: [{ id: handle }, { normalizedTitle: handle }],
    }).exec();

    if (!product) {
      throw new Error(`Product with handle "${handle}" not found`);
    }

    return this.productToResponse(product, this.variantModel);
  }

  // Lấy variant theo id
  async getVariantById(id: string): Promise<Variant> {
    const variant = await this.variantModel.findOne({ id }).exec();
    if (!variant) {
      throw new Error(`Variant with id "${id}" not found`);
    }
    return variant;
  }

  // Bán variant: giảm stock, tăng sold
  async sellVariant(id: string, quantity: number): Promise<Variant> {
    if (quantity <= 0) throw new Error("Quantity must be positive");

    const variant = await this.variantModel.findOne({ id }).exec();
    if (!variant) throw new Error(`Variant with id "${id}" not found`);

    if (variant.stock < quantity) {
      throw new Error(`Insufficient stock for variant "${id}"`);
    }

    variant.stock -= quantity;
    variant.sold += quantity;

    return variant.save();
  }

  async createProductRatingByProductId(productId: string, request: CreateRatingRequest): Promise<ProductResponse> {
    const product = await this.productModel.findOne({ id: productId }).exec();
    if (!product) {
      throw new Error(`Product with id ${productId} not found`);
    }

    const newRating: Rating = new Rating();
    newRating.id = crypto.randomUUID();
    newRating.userId = request.userId; /* TODO */
    newRating.userName = request.userId + "'s name"; /* TODO */
    newRating.score = request.score;
    newRating.comment = request.comment;
    newRating.createdAt = new Date();

    product.ratings.push(newRating);

    const savedProduct = await product.save();
    return this.productToResponse(savedProduct, this.variantModel);
  }

  async deleteProductByProductId(productId: string): Promise<void> {
    const product = await this.productModel.findOne({ id: productId }).exec();
    if (!product) {
      throw new Error(`Product with id ${productId} not found`);
    }

    // xoá variants liên quan
    await this.variantModel.deleteMany({ productId: product.id }).exec();

    // decrease brand/category count
    if (product.brand) {
      await this.updateBrandAfterProductChanges(product.brand, "decrease");
    }
    if (product.category) {
      await this.updateCategoryAfterProductChanges(product.category, "decrease");
    }

    // xoá product
    await this.productModel.deleteOne({ id: product.id }).exec();
  }

  private async productToResponse(product: Product, variantModel: any): Promise<ProductResponse> {
    return (await this.productsToResponses([product], variantModel))[0];
  }

  private async productsToResponses(products: Product[], variantModel: any): Promise<ProductResponse[]> {
    const allVariantIds = products.flatMap(p => p.variantIds);

    const variants = await variantModel.find({ id: { $in: allVariantIds } }).exec();

    const variantMap = new Map<string, Variant>();
    variants.forEach(v => variantMap.set(v.id, v));

    return products.map(product => {
      return {
        id: product.id,
        title: product.title,
        normalizedTitle: product.normalizedTitle,
        description: product.description,
        category: product.category,
        brand: product.brand,
        imgUrls: product.imgUrls,
        status: product.status,
        variants: product.variantIds
          .map(vid => variantMap.get(vid))
          .filter((v): v is Variant => v !== undefined),
        ratings: product.ratings,
        createdAt: product.createdAt,
      };
    });
  }

  private async updateBrandAfterProductChanges(brandTitle: string, type: "increase" | "decrease"): Promise<Brand> {
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

  private async updateCategoryAfterProductChanges(categoryTitle: string, type: "increase" | "decrease"): Promise<Brand> {
    let category = await this.categoryModel.findOne({ title: categoryTitle }).exec();
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
}
