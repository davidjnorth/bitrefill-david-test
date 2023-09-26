import axios from 'axios';
import createClient from '../src/index';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
jest.useFakeTimers();

describe('Bitrefill API Client', () => {
  const client = createClient({
    apiKey: 'test_api_key',
    apiSecret: 'test_api_secret',
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should get products successfully', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: { data: [{ name: 'Product 1' }, { name: 'Product 2' }] },
    });

    const products = await client.getProducts();
    expect(products).toEqual([{ name: 'Product 1' }, { name: 'Product 2' }]);
  });

  test('should throw error when fetching products fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));
    await expect(client.getProducts()).rejects.toThrow('Failed to fetch products: Network Error');
  });

  test('should get all products successfully with rate limiting', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        status: 200,
        data: { data: [{ name: 'Product 1' }] },
        headers: { 'ratelimit-remaining': '19', 'ratelimit-reset': '1' }
      })
      .mockResolvedValueOnce({
        status: 200,
        data: { data: [{ name: 'Product 2' }] },
        headers: { 'ratelimit-remaining': '0', 'ratelimit-reset': '1' }
      })
      .mockResolvedValue({
        status: 200,
        data: { data: [] }, // Representing end of products
        headers: { 'ratelimit-remaining': '9', 'ratelimit-reset': '1' }
      });

    const products = await client.getAllProducts();

    // Expecting all products to be fetched, and rate limits to be adhered to
    expect(products).toEqual([{ name: 'Product 1' }, { name: 'Product 2' }]);
    expect(mockedAxios.get).toHaveBeenCalledTimes(10);
  });

  test('should handle individual request error gracefully', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        status: 200,
        data: { data: [{ name: 'Product 1' }] },
        headers: { 'ratelimit-remaining': '9', 'ratelimit-reset': '1' }
      })
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValue({
        status: 200,
        data: { data: [] }, // Representing end of products
        headers: { 'ratelimit-remaining': '8', 'ratelimit-reset': '1' }
      });

    const products = await client.getAllProducts();

    // Should still receive Product 1, despite one batch request failing
    expect(products).toEqual([{ name: 'Product 1' }]);
  });

  test('should create invoice successfully', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      status: 200,
      data: { data: { id: 'invoice_id', status: 'not_delivered' } },
    });

    const invoice = await client.createInvoice({
      paymentType: 'autoBalancePayment',
      products: [{ product_id: 'product_1', value: 10, quantity: 1 }],
      waitForCompletion: false,
    });

    expect(invoice).toEqual({ id: 'invoice_id', status: 'not_delivered' });
  });

  test('should create invoice successfully and retreive completed invoice', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      status: 200,
      data: { data: { id: 'invoice_id', status: 'not_delivered' } },
    });
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: { data: { id: 'invoice_id', status: 'all_delivered' } },
    });

    const invoice = await client.createInvoice({
      paymentType: 'autoBalancePayment',
      products: [{ product_id: 'product_1', value: 10, quantity: 1 }],
      waitForCompletion: true,
    });

    expect(invoice).toEqual({ id: 'invoice_id', status: 'all_delivered' });
  });

  test('should throw error when creating invoice fails', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'));
    await expect(client.createInvoice({
      paymentType: 'autoBalancePayment',
      products: [{ product_id: 'product_1', value: 10, quantity: 1 }],
    })).rejects.toThrow('Failed to create invoice: Network Error');
  });

  test('should get account balance successfully', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: { data: { balance: 100, currency: 'BTC' } },
    });

    const balance = await client.getAccountBalance();
    expect(balance).toEqual({ balance: 100, currency: 'BTC' });
  });

  test('should throw error when fetching account balance fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));
    await expect(client.getAccountBalance()).rejects.toThrow('Failed to get account balance: Network Error');
  });

  test('should get a single invoice successfully', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: { data: { id: 'invoice_id', status: 'all_delivered' } },
    });

    const invoice = await client.getInvoice('invoice_id');
    expect(invoice).toEqual({ id: 'invoice_id', status: 'all_delivered' });
  });

  test('should throw error when fetching an invoice fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));
    await expect(client.getInvoice('invoice_id')).rejects.toThrow('Failed to get invoice: Network Error');
  });

});
