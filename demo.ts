import Bitrefill from './dist/index.js';
import dotenv from 'dotenv';

dotenv.config();

const client = Bitrefill({
    apiKey: process.env.API_KEY ?? '',
    apiSecret: process.env.API_SECRET ?? ''
});

async function runGetProducts() {
    try {
        const products = await client.getProducts({
            includeTestProducts: false,
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

async function runGetAccountBalance() {
    try {
        const accounBalance = await client.getAccountBalance();
        
        console.log(accounBalance);
    } catch (error) {
        console.error('Error getting account balance:', error);
    }
}

// Get products with filters, log product names
// runGetProducts();

// Get all products with filters, abstract pagination, log product names
// runGetAllProducts();

// Create bitcoin invoice (incomplete), log invoice data
// runCreateBitcoinInvoice();

// Create balance invoice, wait for completion, log redemption code
// runCreateInvoice();

// Create balance invoice, wait for completion, failed delivery, log complete invoice data
// runCreateInvoiceFail();

// Get account balance, log balance object with currency and balance
runGetAccountBalance();
