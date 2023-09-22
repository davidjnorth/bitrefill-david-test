"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const BASE_URL = 'https://api-bitrefill.com/v2';
;
;
class Bitrefill {
    constructor({ apiKey, apiSecret }) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
    }
    getHeaders() {
        const encodedCredentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
        return {
            'Authorization': `Basic ${encodedCredentials}`,
            'Content-Type': 'application/json'
        };
    }
    fetchProducts(options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get(`${BASE_URL}/products`, {
                    headers: this.getHeaders(),
                    params: options
                });
                if (response.status != 200) {
                    throw new Error(`API responded with status code ${response.status}: ${response.statusText}`);
                }
                return response.data.data;
            }
            catch (error) {
                const message = error.message;
                throw new Error(`Failed to fetch products: ${message}`);
            }
        });
    }
    fetchAllProducts(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const allProducts = [];
            const limit = 50;
            // TODO: Look into rate limiting
            // TODO: Maybe use next in metadata but need API access to see what it looks like
            let start = 0;
            let hasMore = true;
            while (hasMore) {
                try {
                    const products = yield this.fetchProducts({
                        start,
                        limit,
                        include_test_products: options === null || options === void 0 ? void 0 : options.include_test_products,
                    });
                    allProducts.push(...products); // Add fetched products to the allProducts array
                    if (products.length < limit) {
                        hasMore = false; // Stop fetching more products if the number of fetched products is less than the limit
                    }
                    else {
                        start += limit; // Move to the next page
                        // if (delay > 0) await new Promise(res => setTimeout(res, delay)); // Introduce delay between API calls if specified
                    }
                }
                catch (error) {
                    // Handle errors (like logging them), or rethrow them if you want to stop fetching on errors
                    console.error(`Error fetching products with start=${start}:`, error);
                    throw error;
                }
            }
            return allProducts;
        });
    }
    accountBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield axios_1.default.get(`${BASE_URL}/accounts/balance`, {
                headers: this.getHeaders(),
            });
            if (response.status != 200) {
                throw new Error(`API responded with status code ${response.status}: ${response.statusText}`);
            }
            return response.data.data;
        });
    }
    createInvoice(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { paymentType, products, } = request;
                const autoPay = paymentType === 'autoBalancePayment';
                let paymentMethod = 'balance';
                if (paymentType == 'bitcoinPayment') {
                    paymentMethod = 'bitcoin';
                }
                ;
                const payload = {
                    products,
                    auto_pay: autoPay,
                    payment_method: paymentMethod,
                };
                const response = yield axios_1.default.post(`${BASE_URL}/invoices`, payload, {
                    headers: this.getHeaders(),
                });
                if (response.status != 200) {
                    throw new Error(`API responded with status code ${response.status}: ${response.statusText}`);
                }
                return response.data.data;
            }
            catch (error) {
                const message = error.message;
                throw new Error(`Failed to create invoice: ${message}`);
            }
        });
    }
}
function createClient(options) {
    return new Bitrefill(options);
}
exports.default = createClient;
