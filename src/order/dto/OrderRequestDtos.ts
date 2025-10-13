export class CreateOrderRequest {
  userId?: string;
  fullName: string;
  email: string;
  phoneNum: string;
  discountCode?: string;
  items: OrderItemInput[];
}


export class UpdateOrderStatusRequest {
  id: string;
  status: 'CART' | 'PENDING' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED';
}

export class CalculateCartRequest {
  userId?: string;
  fullName: string;
  email: string;
  phoneNum: string;
  discountCode?: string;
  items: OrderItemInput[];
}

export class OrderItemInput {
  variantId: string;
  quantity: number;
}