export type BitrefillOptions = {
  apiKey: string;
  apiSecret: string;
}

export interface GetProductsOptions {
  start?: number;
  limit?: number;
  includeTestProducts?: boolean;
};

export interface GetAllProductsOptions {
  includeTestProducts?: boolean;
}

export interface Product {
  id: string;
  name: string;
  country_code: string;
  country_name: string;
  currency: string;
  created_time: string;
  recipient_type: string;
  image: string;
  in_stock: boolean;
  packages: {
      id: string;
      value: string;
      price: number;
  }[];
  range: {
      min: number;
      max: number;
      step: number;
      price_rate: number;
  };
};

export interface ProductsMeta {
  start: number;
  limit: number;
  include_test_products: boolean;
  _endpoint: string;
  _next: string;
}

export interface ProductsResponse {
  meta: ProductsMeta;
  data: Product[];
}

export interface AccountBalance {
  balance: number;
  currency: string;
}

export interface AccountBalanceResponse {
  meta: any;
  data: AccountBalance;
}

export interface InvoiceProduct {
  product_id: string;
  value: number;
  quantity: number;
}

export interface CreateInvoiceRequest {
  products: InvoiceProduct[];
  paymentType: 'autoBalancePayment' | 'triggerBalancePayment' | 'bitcoinPayment';
  waitForCompletion?: boolean;
}

export interface UserData {
  id: string;
  email: string;
}

export interface PaymentData {
  method: string;
  address: string;
  currency: string;
  price: number;
  status: string;
  commission: number;
}

export interface OrderData {
  id: string;
  status: string;
  product: InvoiceProduct & { name: string; image: string; _href: string };
  created_time: string;
  delivered_time: string;
  redemption_info?: RememptionInfo;
}

export interface RememptionInfo {
  code: string;
  instructions: string;
  other: string;
  extra_fields: Record<string, unknown>;
};

export interface InvoiceResponseData {
  id: string;
  created_time: string;
  completed_time: string;
  status: string;
  user: UserData;
  payment: PaymentData;
  orders: OrderData[];
}

export interface InvoiceResponse {
  meta: any;
  data: InvoiceResponseData;
}
