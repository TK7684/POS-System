/**
 * Unit Tests for ApiClient
 * Tests API communication and error handling
 */

describe('ApiClient', () => {
  let apiClient;
  let mockFetch;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    global.AbortController = jest.fn(() => ({
      abort: jest.fn(),
      signal: {}
    }));
    global.URL = jest.fn().mockImplementation((url) => ({
      toString: () => url,
      searchParams: {
        append: jest.fn()
      }
    }));

    apiClient = new ApiClient('https://test-api.com/exec');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Request Handling', () => {
    test('should make successful API request', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ result: 'success' })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await apiClient.makeRequest('testAction', { param: 'value' });

      expect(result).toBe('success');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('testAction'),
        expect.objectContaining({
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        })
      );
    });

    test('should handle HTTP errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(apiClient.makeRequest('testAction')).rejects.toThrow('HTTP error! status: 500');
    });

    test('should handle API errors in response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ error: 'API Error' })
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(apiClient.makeRequest('testAction')).rejects.toThrow('API Error');
    });

    test('should handle request timeout', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      const shortTimeoutClient = new ApiClient('https://test-api.com/exec');
      shortTimeoutClient.requestTimeout = 100;

      await expect(shortTimeoutClient.makeRequest('testAction')).rejects.toThrow('Request timeout');
    });

    test('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(apiClient.makeRequest('testAction')).rejects.toThrow('Network error');
    });
  });

  describe('Parameter Handling', () => {
    test('should append parameters to URL', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ result: 'success' })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const mockUrl = {
        toString: jest.fn().mockReturnValue('https://test-api.com/exec'),
        searchParams: {
          append: jest.fn()
        }
      };
      global.URL = jest.fn().mockReturnValue(mockUrl);

      await apiClient.makeRequest('testAction', { param1: 'value1', param2: 'value2' });

      expect(mockUrl.searchParams.append).toHaveBeenCalledWith('action', 'testAction');
      expect(mockUrl.searchParams.append).toHaveBeenCalledWith('param1', 'value1');
      expect(mockUrl.searchParams.append).toHaveBeenCalledWith('param2', 'value2');
    });

    test('should skip undefined and null parameters', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ result: 'success' })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const mockUrl = {
        toString: jest.fn().mockReturnValue('https://test-api.com/exec'),
        searchParams: {
          append: jest.fn()
        }
      };
      global.URL = jest.fn().mockReturnValue(mockUrl);

      await apiClient.makeRequest('testAction', { 
        validParam: 'value',
        undefinedParam: undefined,
        nullParam: null
      });

      expect(mockUrl.searchParams.append).toHaveBeenCalledWith('validParam', 'value');
      expect(mockUrl.searchParams.append).not.toHaveBeenCalledWith('undefinedParam', undefined);
      expect(mockUrl.searchParams.append).not.toHaveBeenCalledWith('nullParam', null);
    });
  });

  describe('Ingredient API Methods', () => {
    test('should get ingredient by ID', async () => {
      const mockIngredient = { id: 'test-001', name: 'Test Ingredient' };
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockIngredient)
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await apiClient.getIngredient('test-001');

      expect(result).toEqual(mockIngredient);
    });

    test('should get frequent ingredients', async () => {
      const mockIngredients = [
        { id: 'test-001', name: 'Ingredient 1' },
        { id: 'test-002', name: 'Ingredient 2' }
      ];
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockIngredients)
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await apiClient.getFrequentIngredients(10);

      expect(result).toEqual(mockIngredients);
    });

    test('should get all ingredients', async () => {
      const mockIngredients = [{ id: 'test-001', name: 'Test' }];
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockIngredients)
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await apiClient.getAllIngredients();

      expect(result).toEqual(mockIngredients);
    });

    test('should search ingredients', async () => {
      const mockResults = [{ id: 'test-001', name: 'กุ้ง' }];
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockResults)
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await apiClient.searchIngredients('กุ้ง', 5);

      expect(result).toEqual(mockResults);
    });
  });

  describe('Menu API Methods', () => {
    test('should get menu by ID', async () => {
      const mockMenu = { id: 'menu-001', name: 'Test Menu' };
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockMenu)
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await apiClient.getMenu('menu-001');

      expect(result).toEqual(mockMenu);
    });

    test('should get popular menus', async () => {
      const mockMenus = [
        { id: 'menu-001', name: 'Menu 1' },
        { id: 'menu-002', name: 'Menu 2' }
      ];
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockMenus)
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await apiClient.getPopularMenus(5);

      expect(result).toEqual(mockMenus);
    });

    test('should search menus', async () => {
      const mockResults = [{ id: 'menu-001', name: 'ผัดไทย' }];
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockResults)
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await apiClient.searchMenus('ผัดไทย', 5);

      expect(result).toEqual(mockResults);
    });
  });

  describe('Transaction API Methods', () => {
    test('should get recent transactions', async () => {
      const mockTransactions = [
        { id: 'txn-001', type: 'sale', amount: 100 },
        { id: 'txn-002', type: 'purchase', amount: 200 }
      ];
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockTransactions)
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await apiClient.getRecentTransactions(10);

      expect(result).toEqual(mockTransactions);
    });

    test('should add new purchase', async () => {
      const purchaseData = {
        ingredientId: 'test-001',
        quantity: 5,
        price: 100
      };
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, id: 'purchase-001' })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await apiClient.addPurchase(purchaseData);

      expect(result).toEqual({ success: true, id: 'purchase-001' });
    });

    test('should add new sale', async () => {
      const saleData = {
        menuId: 'menu-001',
        quantity: 2,
        total: 160
      };
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, id: 'sale-001' })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await apiClient.addSale(saleData);

      expect(result).toEqual({ success: true, id: 'sale-001' });
    });
  });

  describe('Stock Management API Methods', () => {
    test('should update stock', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, newStock: 15 })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await apiClient.updateStock('test-001', 5, 'add');

      expect(result).toEqual({ success: true, newStock: 15 });
    });

    test('should get low stock ingredients', async () => {
      const mockLowStock = [
        { id: 'test-001', name: 'กุ้ง', currentStock: 2, minStock: 5 }
      ];
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockLowStock)
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await apiClient.getLowStockIngredients();

      expect(result).toEqual(mockLowStock);
    });
  });

  describe('Report API Methods', () => {
    test('should get sales report', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      const mockReport = {
        totalSales: 10000,
        totalTransactions: 50,
        averageTransaction: 200
      };
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockReport)
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await apiClient.getSalesReport(startDate, endDate);

      expect(result).toEqual(mockReport);
    });

    test('should get today summary', async () => {
      const mockSummary = {
        todaySales: 1500,
        todayTransactions: 8,
        topSellingItems: []
      };
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockSummary)
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await apiClient.getTodaySummary();

      expect(result).toEqual(mockSummary);
    });

    test('should get recent price updates', async () => {
      const mockUpdates = [
        { ingredientId: 'test-001', oldPrice: 100, newPrice: 110, date: '2023-01-15' }
      ];
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockUpdates)
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await apiClient.getRecentPriceUpdates();

      expect(result).toEqual(mockUpdates);
    });
  });
});