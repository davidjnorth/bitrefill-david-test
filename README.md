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

Use `waitForComplettion: true` on `client.createInvoice()` to wait for the invoice to complete before getting a response.

Payment types:
`paymentType: 'autoBalancePayment' | 'triggerBalancePayment' | 'bitcoinPayment'`

```
const invoice = await client.createInvoice({
    products: [{ productId: 'test-gift-card-code', value: 10, quantity: 1 }],
    paymentType: 'autoBalancePayment',
    waitForCompletion: true
});
```

```
const invoice = await client.createInvoice({
    products: [{ productId: 'test-gift-card-code', value: 10, quantity: 1 }],
    paymentType: 'bitcoinPayment'
});
```

```
const invoiceData = await client.createInvoice({
    products: [{ productId: 'test-gift-card-code', value: 10, quantity: 1 }],
    paymentType: 'triggeredBalancePayment'
});
```

```
const invoice = await client.getInvoice(id);
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
// Get all products with filters, abstract pagination, log product names
runGetAllProducts();

// Create balance invoice, wait for completion, log redemption code
runCreateInvoice();

// Create triggered balance invoice, wait for completion, failed delivery, log complete invoice data with failed status
runCreateInvoiceFail();

// Get products with filters, log product names
runGetProducts();

// Create bitcoin invoice (incomplete), log invoice data
runCreateBitcoinInvoice();

// Get account balance, log balance object with currency and balance
runGetAccountBalance();

// Get invoice for a given id
runGetInvoice('00e75a5b-1093-48ac-ac60-4022c18b3112');
```

Run the demo file.
```
npx ts-node demo.ts
```


## Tests
Tests do not cover all edge cases but are at a decent starting point.

Run tests
```
npm test
```

## Notes

As the project grows it will make sense to split out the code into seperate modules.

The API uses snake case, so I made the responses remain in snake case but the options for the package functions are in camel case. So when the user uses this package the variables they pass in are in camel case and the API response remains in snake case. This may need to be looked at, but for now this is how it works.
