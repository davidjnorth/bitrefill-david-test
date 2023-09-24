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
        // TODO: Look into rate limiting
        // TODO: Maybe use next in metadata but need API access to see what it looks like
        
        let start = 0;
        let hasMore = true;
        
        while (hasMore) {
            try {
                const products = await this.getProducts({
                    start,
                    limit,
                    includeTestProducts: options?.includeTestProducts,
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

    async getAllProducts2(options?: GetAllProductsOptions): Promise<Product[]> {
        const allProducts: Product[] = [];
        let nextUrl: string | null = `${BASE_URL}/products`; // Start from the first page
        
        do {
          try {
            const response: AxiosResponse<ProductsResponse> = await axios.get<ProductsResponse>(nextUrl, {
                headers: this.getHeaders(),
                params: {
                    include_test_products: options?.includeTestProducts,
                }
            });
      
            allProducts.push(...response.data.data);
            
            const rateLimitRemaining = Number(response.headers['ratelimit-remaining']);
            const rateLimitReset = Number(response.headers['ratelimit-reset']) * 1000; // Convert to milliseconds
            
            if (rateLimitRemaining === 0) {
              const currentTime = Date.now();
              
              if (rateLimitReset > currentTime) {
                // If rate limit is exhausted, wait until it resets
                await new Promise(res => setTimeout(res, rateLimitReset));
              }
            }
            
            // Determine the next URL. If no _next property, stop pagination.
            nextUrl = response.data.meta._next ?? null;
          } catch (error) {
            console.error('Error fetching products:', error);
            throw error; // Or you might decide to break the loop instead of throwing an error, based on your use case
          }
        } while (nextUrl);
        
        return allProducts;
    }

    // async getAllProducts3(options?: GetAllProductsOptions): Promise<Product[]> {
    //     const allProducts: Product[] = [];
    //     const limit = 50;
        
    //     let start = 0;
    //     let hasMore = true;
        
    //     while (hasMore) {
    //         try {
    //             const promises: Promise<AxiosResponse<ProductsResponse>>[] = [];
    
    //             for (let i = 0; i < 10; i++) { // Assuming 10 as an example for the number of parallel requests
    //                 promises.push(
    //                     axios.get<ProductsResponse>(`${BASE_URL}/products`, {
    //                         headers: this.getHeaders(),
    //                         params: { start, limit, ...options },
    //                     })
    //                 );
    //                 start += limit;
    //             }
    
    //             // Await all parallel requests and handle rate limiting
    //             const responses = await Promise.allSettled(promises);
    //             for (const response of responses) {
    //                 if (response.status === 'fulfilled') {
    //                     allProducts.push(...response.value.data.data);
    
    //                     const rateLimitRemaining = Number(response.value.headers['x-ratelimit-remaining']);
    //                     const rateLimitReset = Number(response.value.headers['x-ratelimit-reset']) * 1000;
                        
    //                     if (rateLimitRemaining === 0) {
    //                         const currentTime = Date.now();
    //                         const waitTime = rateLimitReset > currentTime ? rateLimitReset - currentTime : 0;
    //                         await new Promise(res => setTimeout(res, waitTime));
    //                     }
    //                 } else {
    //                     // Handle individual request error
    //                     console.error('Error fetching products:', response.reason);
    //                 }
    //             }
    
    //             hasMore = responses.some(response => response.status === 'fulfilled' && response.value.data.data.length === limit);
    //         } catch (error) {
    //             console.error('Error fetching products:', error);
    //             throw error;
    //         }
    //     }
        
    //     return allProducts;
    // }

    async createInvoice(request: CreateInvoiceRequest): Promise<InvoiceResponseData> {
        try {
            const {
                paymentType,
                products,
                waitForCompletion,
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
            throw new Error(`Failed to create invoice: ${message}`);
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
            throw new Error(`Failed to create invoice: ${message}`);
        }
    }
}

export default function createClient(options: BitrefillOptions) {
    return new Bitrefill(options);
}
