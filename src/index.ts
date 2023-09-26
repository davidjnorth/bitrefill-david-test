import axios, { AxiosResponse } from 'axios';
import {
    AccountBalance,
    AccountBalanceResponse,
    BitrefillOptions,
    CreateInvoiceRequest,
    GetAllProductsOptions,
    GetProductsOptions,
    InvoiceResponse,
    InvoiceResponseData,
    Product,
    ProductsResponse
} from './types';

const BASE_URL = 'https://api-bitrefill.com/v2';

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

    async getProducts(options?: GetProductsOptions): Promise<Product[]> {
        try {
            const response = await axios.get<ProductsResponse>(`${BASE_URL}/products`, {
                headers: this.getHeaders(),
                params: {
                    limit: options?.limit,
                    start: options?.start,
                    include_test_products: options?.includeTestProducts,
                }
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

    async getAllProducts(options?: GetAllProductsOptions): Promise<Product[]> {
        const allProducts: Product[] = [];
        const limit = 50;
        const batchSize = 10;
        
        let start = 0;
        let hasMore = true;
        
        while (hasMore) {
            try {
                const promises: Promise<AxiosResponse<ProductsResponse>>[] = [];
    
                for (let i = 0; i < batchSize; i++) {
                    promises.push(
                        axios.get<ProductsResponse>(`${BASE_URL}/products`, {
                            headers: this.getHeaders(),
                            params: { start, limit, ...options },
                        })
                    );
                    start += limit;
                }
    
                // Await all parallel requests and handle rate limiting
                const responses = await Promise.allSettled(promises);
                let lowestRateLimitRemaining: number = Infinity;
                let lowestRateLimitReset: number = Infinity;
                for (const response of responses) {
                    if (response.status === 'fulfilled') {
                        allProducts.push(...response.value.data.data);
    
                        const rateLimitRemaining = Number(response.value.headers['ratelimit-remaining']);
                        const rateLimitReset = Number(response.value.headers['ratelimit-reset']) * 1000;
                        
                        if (rateLimitRemaining < lowestRateLimitRemaining) {
                            lowestRateLimitRemaining = rateLimitRemaining;
                            lowestRateLimitReset = rateLimitReset;
                        }
                    } else {
                        // Handle individual request error
                        // A bit of a hack for now because of cloudflare limits
                        if (response.reason.response && response.reason.response.status != 429) {
                            console.error('Error fetching products:', response.reason);
                        }
                    }
                }

                hasMore = responses.every(response => response.status === 'fulfilled' && response.value.data.data.length === limit);

                if (hasMore && lowestRateLimitRemaining < batchSize) {
                    await new Promise(res => setTimeout(res, lowestRateLimitReset));
                }
            } catch (error) {
                console.error('Error fetching all products:', error);
                throw error;
            }
        }
        
        return allProducts;
    }

    async createInvoice(request: CreateInvoiceRequest): Promise<InvoiceResponseData> {
        try {
            const {
                paymentType,
                products,
                waitForCompletion,
                refundAddress,
            } = request;

            if (paymentType == 'bitcoinPayment' && !refundAddress) {
                throw new Error('refundAddress is required for a bitcoin invoice');
            }

            const autoPay = paymentType === 'autoBalancePayment';
            let paymentMethod = 'balance';
            if (paymentType == 'bitcoinPayment') { paymentMethod = 'bitcoin' };

            const payload = {
                products,
                auto_pay: autoPay,
                payment_method: paymentMethod,
                refund_address: refundAddress,
            };

            const response = await axios.post<InvoiceResponse>(`${BASE_URL}/invoices`, payload, {
                headers: this.getHeaders(),
            });
    
            if (response.status != 200) {
                throw new Error(`API responded with status code ${response.status}: ${response.statusText}`);
            }

            if (waitForCompletion && paymentType === 'autoBalancePayment') {
                return await this.getCompletedInvoice(response.data.data.id);
            } else {
                return response.data.data;
            }
        } catch (error) {
            const message = (error as Error).message;
            throw new Error(`Failed to create invoice: ${message}`);
        }
    }

    async getCompletedInvoice(id: string): Promise<InvoiceResponseData> {
        let invoice = await this.getInvoice(id);

        for (let attempt = 0; attempt < 5 && invoice.status === 'not_delivered'; attempt++) {
            // Wait for 1 second before trying again
            await new Promise(res => setTimeout(res, 1000));
            
            // Re-fetch the invoice
            invoice = await this.getInvoice(id);
        }
    
        return invoice;
    }

    async getInvoice(id: string): Promise<InvoiceResponseData> {
        try {
            const response = await axios.get<InvoiceResponse>(`${BASE_URL}/invoices/${id}`, {
                headers: this.getHeaders(),
            });

            if (response.status != 200) {
                throw new Error(`API responded with status code ${response.status}: ${response.statusText}`);
            }

            return response.data.data;
        } catch(error) {
            const message = (error as Error).message;
            throw new Error(`Failed to get invoice: ${message}`);
        }
    }

    async getAccountBalance(): Promise<AccountBalance> {
        try {
            const response = await axios.get<AccountBalanceResponse>(`${BASE_URL}/accounts/balance`, {
                headers: this.getHeaders(),
            });

            if (response.status != 200) {
                throw new Error(`API responded with status code ${response.status}: ${response.statusText}`);
            }

            return response.data.data;
        } catch(error) {
            const message = (error as Error).message;
            throw new Error(`Failed to get account balance: ${message}`);
        }
    }
}

export default function createClient(options: BitrefillOptions) {
    return new Bitrefill(options);
}
