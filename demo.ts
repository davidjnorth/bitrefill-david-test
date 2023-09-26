import Bitrefill from './dist/index.js';
import dotenv from 'dotenv';

dotenv.config();

const client = Bitrefill({
    apiKey: process.env.API_KEY ?? '',
    apiSecret: process.env.API_SECRET ?? ''
});

// Get products with filters, log product names
async function runGetProducts() {
    try {
        const products = await client.getProducts({
            includeTestProducts: true,
            limit: 50,
            start: 0
        });

        for (const product of products) {
            console.log(product.name);
        }
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

// Get all products with filters, abstract pagination, log product names
async function runGetAllProducts() {
    try {
        const products = await client.getAllProducts({
            includeTestProducts: false,
        });

        for (const product of products) {
            console.log(product.name);
        }
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

// Create bitcoin invoice (incomplete), log invoice data
async function runCreateBitcoinInvoice() {
  try {
      const invoiceData = await client.createInvoice({
          products: [{ product_id: 'test-gift-card-code', value: 10, quantity: 1 }],
          paymentType: 'bitcoinPayment',
          refundAddress: 'bc1234567890'
      });

      console.log(invoiceData);
  } catch (error) {
      console.error('Error creating invoice:', error);
  }
}

// Create auto balance invoice, wait for completion, log redemption code
async function runCreateInvoice() {
    try {
        const invoiceData = await client.createInvoice({
            products: [{ product_id: 'test-gift-card-code', value: 10, quantity: 1 }],
            paymentType: 'autoBalancePayment',
            waitForCompletion: true
        });
        
        for(const order of invoiceData.orders) {
          if (order.redemption_info) {
            console.log(`Redemption code for ${order.product.name}: ${order.redemption_info.code}`);
          }
        }
    } catch (error) {
        console.error('Error creating invoice:', error);
    }
}

// Create triggered balance invoice, wait for completion, failed delivery, log complete invoice data with failed status
async function runCreateInvoiceFail() {
    try {
        const invoiceData = await client.createInvoice({
            products: [{ product_id: 'test-phone-refill-fail', value: 10, quantity: 1 }],
            paymentType: 'autoBalancePayment',
            waitForCompletion: true
        });
        
        console.log(invoiceData);
    } catch (error) {
        console.error('Error creating invoice:', error);
    }
}

// Get account balance, log balance object with currency and balance
async function runGetAccountBalance() {
    try {
        const accounBalance = await client.getAccountBalance();
        
        console.log(accounBalance);
    } catch (error) {
        console.error('Error getting account balance:', error);
    }
}

// Get all products with filters, abstract pagination, log product names
// runGetAllProducts();

// Create balance invoice, wait for completion, log redemption code
// runCreateInvoice();

// Create triggered balance invoice, wait for completion, failed delivery, log complete invoice data with failed status
// runCreateInvoiceFail();

// Get products with filters, log product names
// runGetProducts();

// Create bitcoin invoice (incomplete), log invoice data
// runCreateBitcoinInvoice();

// Get account balance, log balance object with currency and balance
runGetAccountBalance();
