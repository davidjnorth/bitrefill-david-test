# bitrefill-david-test

## Usage (not published):

```
npm install 'bitrefill-david-test'
```

```
import Bitrefill from 'bitrefill-david-test';

const client = Bitrefill({
    apiKey: 'xxx',
    apiSecret: 'xxx'
});
```

### Products
```
const products = await client.getProducts({
    includeTestProducts: false,
    limit: 50,
    start: 0
});
```

```
const products = await client.getAllProducts({
    includeTestProducts: false,
});
```

### Invoices
```
const invoice = await client.createInvoice({
    products: [{ product_id: 'test-gift-card-code', value: 10, quantity: 1 }],
    paymentType: 'autoBalancePayment',
    waitForCompletion: true
});
```

```
const invoice = await client.createInvoice({
    products: [{ product_id: 'test-gift-card-code', value: 10, quantity: 1 }],
    paymentType: 'bitcoinPayment'
});
```

```
const invoiceData = await client.createInvoice({
    products: [{ product_id: 'test-gift-card-code', value: 10, quantity: 1 }],
    paymentType: 'triggeredBalancePayment'
});
```

### Account Balance
```
const accounBalance = await client.getAccountBalance();
```


## Run Demo file
```
npm run build
```
Edit the bottom of the demo.ts file to uncomment the function you want to run.

```
// Get products with filters, log product names
// runGetProducts();

// Get all products with filters, abstract pagination, log product names
// runGetAllProducts();

// Create bitcoin invoice (incomplete), log invoice data
// runCreateBitcoinInvoice();

// Create balance invoice, wait for completion, log redemption code
// runCreateInvoice();

// Create triggered balance invoice, wait for completion, failed delivery, log complete invoice data with failed status
// runCreateInvoiceFail();

// Get account balance, log balance object with currency and balance
runGetAccountBalance();
```

Run the demo file.
```
npx ts-node demo.ts
```
