import { signalsApi, categoriesApi, healthApi } from '../services/api';

// Mock axios to avoid actual HTTP requests during testing
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  })),
}));

describe('API Services', () => {
  test('signalsApi exports all required functions', () => {
    expect(signalsApi).toHaveProperty('getSignals');
    expect(signalsApi).toHaveProperty('getSignal');
    expect(signalsApi).toHaveProperty('updateManualScore');
    expect(signalsApi).toHaveProperty('getSignalsByCategory');
    expect(signalsApi).toHaveProperty('getSummary');
  });

  test('categoriesApi exports all required functions', () => {
    expect(categoriesApi).toHaveProperty('getCategories');
    expect(categoriesApi).toHaveProperty('getCategoryStats');
    expect(categoriesApi).toHaveProperty('categorizeSignal');
  });

  test('healthApi exports health check function', () => {
    expect(healthApi).toHaveProperty('checkHealth');
  });
});
