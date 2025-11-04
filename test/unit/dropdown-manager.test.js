/**
 * Unit Tests for DropdownManager
 */

const DropdownManager = require('../../js/core/DropdownManager');

// Local fixtures for dropdown scenarios
const Fixtures = require('../fixtures/dropdown-fixtures');

// Minimal Mock CacheManager compatible with DropdownManager needs
class MockCacheManager {
  constructor() {
    this.store = new Map();
    this.get = jest.fn(async (key) => this.store.get(key));
    this.set = jest.fn(async (key, value) => {
      this.store.set(key, value);
      return true;
    });
    this.remove = jest.fn(async (key) => {
      this.store.delete(key);
      return true;
    });
  }

  // For _getCachedDataIgnoreExpiration
  getFromMemory(key) {
    const value = this.store.get(key);
    return value ? { value, expires: Date.now() + 1000 } : null;
  }

  getFromSession() {
    return null;
  }

  async getFromIndexedDB(key) {
    const value = this.store.get(key);
    return value ? { value, expires: Date.now() + 1000 } : null;
  }
}

// Google Apps Script run stub
function createGoogleRunStub() {
  const handlers = { success: null, failure: null };
  const calls = { getIngredients: 0, getMenus: 0, getMenuIngredients: 0, getPlatforms: 0 };
  const responses = {
    getIngredients: { mode: 'success', value: Fixtures.ingredients },
    getMenus: { mode: 'success', value: Fixtures.menus },
    getMenuIngredients: { mode: 'success', value: Fixtures.menuIngredientsByMenu.m1 },
    getPlatforms: { mode: 'success', value: Fixtures.platforms }
  };

  const run = {
    withSuccessHandler(cb) {
      handlers.success = cb;
      return run;
    },
    withFailureHandler(cb) {
      handlers.failure = cb;
      return run;
    },
    getIngredients() {
      calls.getIngredients++;
      dispatch('getIngredients');
    },
    getMenus() {
      calls.getMenus++;
      dispatch('getMenus');
    },
    getMenuIngredients(menuId) {
      calls.getMenuIngredients++;
      // allow per-menu override
      if (responses[`getMenuIngredients:${menuId}`]) {
        dispatch(`getMenuIngredients:${menuId}`);
      } else {
        dispatch('getMenuIngredients');
      }
    },
    getPlatforms() {
      calls.getPlatforms++;
      dispatch('getPlatforms');
    }
  };

  function dispatch(key) {
    const cfg = responses[key];
    if (!cfg) throw new Error(`No GAS mock configured for ${key}`);
    setTimeout(() => {
      if (cfg.mode === 'success') {
        handlers.success && handlers.success(cfg.value);
      } else if (cfg.mode === 'failure') {
        handlers.failure && handlers.failure(cfg.error || new Error('GAS Error'));
      } else if (cfg.mode === 'flaky') {
        cfg.count = cfg.count || 0;
        cfg.count += 1;
        if (cfg.count <= cfg.failures) {
          handlers.failure && handlers.failure(new Error('Transient error'));
        } else {
          handlers.success && handlers.success(cfg.value);
        }
      }
    }, 0);
  }

  return {
    install() {
      global.google = { script: { run } };
    },
    setSuccess(fn, value) { responses[fn] = { mode: 'success', value }; },
    setFailure(fn, error) { responses[fn] = { mode: 'failure', error }; },
    setFlaky(fn, failures, value) { responses[fn] = { mode: 'flaky', failures, value, count: 0 }; },
    setMenuIngredients(menuId, cfg) { responses[`getMenuIngredients:${menuId}`] = cfg; },
    calls
  };
}

// Helper to create a select element
function createSelect(id = 'test_select') {
  const el = document.createElement('select');
  el.id = id;
  document.body.appendChild(el);
  return el;
}

describe('DropdownManager', () => {
  let cache;
  let dm;
  let gas;

  beforeEach(() => {
    // jsdom environment provides document/window
    document.body.innerHTML = '';

    // Mock localStorage
    const store = {};
    global.localStorage = {
      getItem: jest.fn((k) => (k in store ? store[k] : null)),
      setItem: jest.fn((k, v) => (store[k] = String(v))),
      removeItem: jest.fn((k) => delete store[k]),
      clear: jest.fn(() => Object.keys(store).forEach((k) => delete store[k]))
    };

    // GAS stub
    gas = createGoogleRunStub();
    gas.install();

    // Cache
    cache = new MockCacheManager();

    // Manager
    dm = new DropdownManager(cache);
    // Speed up retry-based tests
    dm.RETRY_DELAY_BASE = 1;
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  test('getIngredients fetches and caches from backend', async () => {
    const data = await dm.getIngredients();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(Fixtures.ingredients.length);
    expect(cache.set).toHaveBeenCalled();
    expect(gas.calls.getIngredients).toBe(1);
  });

  test('getIngredients uses cache when available (no forceRefresh)', async () => {
    await cache.set(dm.CACHE_KEYS.INGREDIENTS, Fixtures.ingredients);
    const data = await dm.getIngredients();
    expect(data).toEqual(Fixtures.ingredients);
    expect(gas.calls.getIngredients).toBe(0);
  });

  test('getIngredients offline uses cached data and sets usingCachedData', async () => {
    await cache.set(dm.CACHE_KEYS.INGREDIENTS, Fixtures.ingredients);
    jest.spyOn(dm, 'isOnline').mockReturnValue(false);
    const data = await dm.getIngredients();
    expect(data).toEqual(Fixtures.ingredients);
  });

  test('getIngredients offline without cache throws', async () => {
    jest.spyOn(dm, 'isOnline').mockReturnValue(false);
    await expect(dm.getIngredients()).rejects.toThrow('No cached data available while offline');
  });

  test('getIngredients retries then succeeds', async () => {
    gas.setFlaky('getIngredients', 2, Fixtures.ingredients);
    const data = await dm.getIngredients(true);
    expect(data).toEqual(Fixtures.ingredients);
    expect(gas.calls.getIngredients).toBe(3);
  });

  test('populateIngredients populates DOM with placeholder and options', async () => {
    gas.setSuccess('getIngredients', Fixtures.ingredients);
    const select = createSelect('p_ing');
    await dm.populateIngredients(select);
    // placeholder + items
    expect(select.options.length).toBe(1 + Fixtures.ingredients.length);
    expect(select.options[0].textContent).toContain('เลือก');
    expect(select.options[1].dataset.stockUnit).toBeDefined();
    expect(dm.getDropdownState('p_ing').isLoaded).toBe(true);
  });

  test('populateIngredients shows offline placeholder and class when using cached data', async () => {
    await cache.set(dm.CACHE_KEYS.INGREDIENTS, Fixtures.ingredients);
    jest.spyOn(dm, 'isOnline').mockReturnValue(false);
    const select = createSelect('p_ing');
    await dm.populateIngredients(select);
    expect(select.options[0].textContent).toContain('ออฟไลน์');
    expect(select.classList.contains('dropdown-offline')).toBe(true);
  });

  test('populateMenus populates DOM and sets data-price', async () => {
    gas.setSuccess('getMenus', Fixtures.menus);
    const select = createSelect('s_menu');
    await dm.populateMenus(select);
    expect(select.options.length).toBe(1 + Fixtures.menus.length);
    expect(select.options[1].dataset.price).toBeDefined();
  });

  test('getMenuIngredients caches per menu and offline fallback', async () => {
    const menuId = 'm1';
    gas.setMenuIngredients(menuId, { mode: 'success', value: Fixtures.menuIngredientsByMenu[menuId] });
    const data = await dm.getMenuIngredients(menuId);
    expect(data).toEqual(Fixtures.menuIngredientsByMenu[menuId]);

    // Offline uses cached
    jest.spyOn(dm, 'isOnline').mockReturnValue(false);
    const cached = await dm.getMenuIngredients(menuId);
    expect(cached).toEqual(Fixtures.menuIngredientsByMenu[menuId]);
  });

  test('getPlatforms falls back to default when backend fails', async () => {
    gas.setFailure('getPlatforms', new Error('unavailable'));
    const data = await dm.getPlatforms();
    expect(data).toEqual(dm.DEFAULT_PLATFORMS);
  });

  test('populatePlatforms populates DOM from defaults if needed', async () => {
    gas.setFailure('getPlatforms', new Error('unavailable'));
    const select = createSelect('s_platform');
    await dm.populatePlatforms(select);
    expect(select.options.length).toBe(1 + dm.DEFAULT_PLATFORMS.length);
  });

  test('populateUnits populates with specified unit type', () => {
    const select = createSelect('p_unit');
    dm.populateUnits(select, 'weight');
    expect(select.options.length).toBe(1 + dm.UNITS.weight.length);
  });

  test('showLoading and hideLoading toggle state/classes', () => {
    const select = createSelect('loading_sel');
    dm.showLoading(select);
    expect(select.disabled).toBe(true);
    expect(select.classList.contains('dropdown-loading')).toBe(true);
    dm.hideLoading(select);
    expect(select.disabled).toBe(false);
    expect(select.classList.contains('dropdown-loading')).toBe(false);
  });

  test('showError sets retry message and class', () => {
    const select = createSelect('error_sel');
    dm.showError(select, 'เกิดข้อผิดพลาด');
    expect(select.options.length).toBe(1);
    expect(select.options[0].textContent).toContain('❌');
    expect(select.classList.contains('dropdown-error')).toBe(true);
  });

  test('onIngredientChange invokes callback with parsed data', async () => {
    gas.setSuccess('getIngredients', Fixtures.ingredients);
    const select = createSelect('p_ing');
    await dm.populateIngredients(select);
    const cb = jest.fn();
    dm.onIngredientChange(select, cb);
    select.selectedIndex = 1;
    select.dispatchEvent(new Event('change'));
    expect(cb).toHaveBeenCalled();
    const arg = cb.mock.calls[0][0];
    expect(arg).toHaveProperty('id');
    expect(arg).toHaveProperty('buyToStockRatio');
  });

  test('onMenuChange invokes callback with parsed data', async () => {
    gas.setSuccess('getMenus', Fixtures.menus);
    const select = createSelect('s_menu');
    await dm.populateMenus(select);
    const cb = jest.fn();
    dm.onMenuChange(select, cb);
    select.selectedIndex = 1;
    select.dispatchEvent(new Event('change'));
    expect(cb).toHaveBeenCalled();
    const arg = cb.mock.calls[0][0];
    expect(arg).toEqual(expect.objectContaining({ id: Fixtures.menus[0].id }));
  });

  test('clearCache removes keys and clears state', async () => {
    await cache.set(dm.CACHE_KEYS.INGREDIENTS, Fixtures.ingredients);
    await cache.set(dm.CACHE_KEYS.MENUS, Fixtures.menus);
    const select = createSelect('p_ing');
    await dm.populateIngredients(select);
    await dm.clearCache();
    expect(cache.remove).toHaveBeenCalledWith(dm.CACHE_KEYS.INGREDIENTS, 'ingredients');
    expect(cache.remove).toHaveBeenCalledWith(dm.CACHE_KEYS.MENUS, 'menus');
    expect(dm.getDropdownState('p_ing').isLoaded).toBe(false);
  });

  test('cache versioning updates and clears when version changes', async () => {
    const spy = jest.spyOn(dm, 'clearCache').mockResolvedValue();
    await dm.updateCacheVersion('2.0.0');
    expect(spy).toHaveBeenCalled();
    expect(localStorage.setItem).toHaveBeenCalledWith(dm.CACHE_VERSION_KEY, '2.0.0');
  });
});


