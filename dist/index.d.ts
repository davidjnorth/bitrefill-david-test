type BitrefillOptions = {
    apiKey: string;
    apiSecret: string;
};
export interface FetchProductsOptions {
    start?: number;
    limit?: number;
    include_test_products?: boolean;
}
export interface FetchAllProductsOptions {
    include_test_products?: boolean;
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
}
export interface ProductsMeta {
    start: number;
    limit: number;
    include_out_of_stock: boolean;
    _endpoint: string;
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
interface InvoiceProduct {
    product_id: string;
    value: number;
    quantity: number;
}
interface CreateInvoiceRequest {
    products: InvoiceProduct[];
    paymentMethod: 'autoBalancePayment' | 'triggerBalancePayment' | 'bitcoinPayment';
}
interface UserData {
    id: string;
    email: string;
}
interface PaymentData {
    method: string;
    address: string;
    currency: string;
    price: number;
    status: string;
    commission: number;
}
interface OrderData {
    id: string;
    status: string;
    product: InvoiceProduct & {
        name: string;
        image: string;
        _href: string;
    };
    created_time: string;
    delivered_time: string;
}
interface InvoiceResponseData {
    id: string;
    created_time: string;
    completed_time: string;
    status: string;
    user: UserData;
    payment: PaymentData;
    orders: OrderData[];
}
declare class Bitrefill {
    private apiKey;
    private apiSecret;
    constructor({ apiKey, apiSecret }: BitrefillOptions);
    getHeaders(): {
        [key: string]: string;
    };
    fetchProducts(options?: FetchProductsOptions): Promise<Product[]>;
    fetchAllProducts(options?: FetchAllProductsOptions): Promise<Product[]>;
    accountBalance(): Promise<AccountBalance>;
    createInvoice(request: CreateInvoiceRequest): Promise<InvoiceResponseData>;
}
export default function createClient(options: BitrefillOptions): Bitrefill;
export {};
