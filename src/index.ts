import axios from 'axios';

type BitrefillOptions = {
    apiKey: string;
    apiSecret: string;
}

const BASE_URL = 'https://api-bitrefill.com/v2';

export interface FetchProductsOptions {
    start?: number;
    limit?: number;
    include_test_products?: boolean;
};

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
};

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
    product: InvoiceProduct & { name: string; image: string; _href: string };
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

interface InvoiceResponse {
    meta: any;
    data: InvoiceResponseData;
}


class Bitrefill {
    private apiKey: string;
    private apiSecret: string;

    constructor({ apiKey, apiSecret }: BitrefillOptions) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
    }

    getHeaders(): { [key: string]: string } {
        const encodedCredentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
        return {
            'Authorization': `Basic ${encodedCredentials}`,
            'Content-Type': 'application/json'
        };
    }

    async fetchProducts(options?: FetchProductsOptions): Promise<Product[]> {
        try {
            const response = await axios.get<ProductsResponse>(`${BASE_URL}/products`, {
                headers: this.getHeaders(),
                params: options
            });
            
            if (response.status != 200) {
                throw new Error(`API responded with status code ${response.status}: ${response.statusText}`);
            }
            
            return response.data.data;
        } catch (error) {
            const message = (error as Error).message;
            throw new Error(`Failed to fetch products: ${message}`);
        }
    }

    async fetchAllProducts(options?: FetchAllProductsOptions): Promise<Product[]> {
        const allProducts: Product[] = [];
        const limit = 50;
        // TODO: Look into rate limiting
        // TODO: Maybe use next in metadata but need API access to see what it looks like
        
        let start = 0;
        let hasMore = true;
        
        while (hasMore) {
            try {
                const products = await this.fetchProducts({
                    start,
                    limit,
                    include_test_products: options?.include_test_products,
                });
                
                allProducts.push(...products); // Add fetched products to the allProducts array
                
                if (products.length < limit) {
                    hasMore = false; // Stop fetching more products if the number of fetched products is less than the limit
                } else {
                    start += limit; // Move to the next page
                    // if (delay > 0) await new Promise(res => setTimeout(res, delay)); // Introduce delay between API calls if specified
                }
            } catch (error) {
                // Handle errors (like logging them), or rethrow them if you want to stop fetching on errors
                console.error(`Error fetching products with start=${start}:`, error);
                throw error;
            }
        }
        
        return allProducts;
    }

    async accountBalance(): Promise<AccountBalance> {
        const response = await axios.get<AccountBalanceResponse>(`${BASE_URL}/accounts/balance`, {
            headers: this.getHeaders(),
        });
        
        if (response.status != 200) {
            throw new Error(`API responded with status code ${response.status}: ${response.statusText}`);
        }
        
        return response.data.data;
    }

    async createInvoice(request: CreateInvoiceRequest): Promise<InvoiceResponseData> {
        try {
            const {
                paymentType,
                products,
            } = request;

            const autoPay = paymentType === 'autoBalancePayment';
            let paymentMethod = 'balance';
            if (paymentType == 'bitcoinPayment') { paymentMethod = 'bitcoin' };

            const payload = {
                products,
                auto_pay: autoPay,
                payment_method: paymentMethod,
            };

            const response = await axios.post<InvoiceResponse>(`${BASE_URL}/invoices`, payload, {
                headers: this.getHeaders(),
            });
    
            if (response.status != 200) {
                throw new Error(`API responded with status code ${response.status}: ${response.statusText}`);
            }
    
            return response.data.data;
        } catch (error) {
            const message = (error as Error).message;
            throw new Error(`Failed to create invoice: ${message}`);
        }
    }
}

export default function createClient(options: BitrefillOptions) {
    return new Bitrefill(options);
}
