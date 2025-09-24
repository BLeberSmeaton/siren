import { renderHook, act } from '@testing-library/react';
import { useCategoryFilter } from '../useCategoryFilter';

describe('useCategoryFilter', () => {
  test('initial state has no category selected', () => {
    const { result } = renderHook(() => useCategoryFilter());

    expect(result.current.selectedCategory).toBeNull();
  });

  test('handleCategoryFilter sets the selected category', () => {
    const { result } = renderHook(() => useCategoryFilter());

    act(() => {
      result.current.handleCategoryFilter('API Issues');
    });

    expect(result.current.selectedCategory).toBe('API Issues');
  });

  test('handleCategoryFilter can clear the selected category', () => {
    const { result } = renderHook(() => useCategoryFilter());

    // First set a category
    act(() => {
      result.current.handleCategoryFilter('API Issues');
    });

    expect(result.current.selectedCategory).toBe('API Issues');

    // Then clear it
    act(() => {
      result.current.handleCategoryFilter(null);
    });

    expect(result.current.selectedCategory).toBeNull();
  });

  test('handleCategoryFilter can handle empty string', () => {
    const { result } = renderHook(() => useCategoryFilter());

    // First set a category
    act(() => {
      result.current.handleCategoryFilter('API Issues');
    });

    expect(result.current.selectedCategory).toBe('API Issues');

    // Then clear it with empty string
    act(() => {
      result.current.handleCategoryFilter('');
    });

    expect(result.current.selectedCategory).toBe('');
  });

  test('handleCategoryFilter can change between different categories', () => {
    const { result } = renderHook(() => useCategoryFilter());

    act(() => {
      result.current.handleCategoryFilter('API Issues');
    });

    expect(result.current.selectedCategory).toBe('API Issues');

    act(() => {
      result.current.handleCategoryFilter('Certificate Issues');
    });

    expect(result.current.selectedCategory).toBe('Certificate Issues');

    act(() => {
      result.current.handleCategoryFilter('Database Issues');
    });

    expect(result.current.selectedCategory).toBe('Database Issues');
  });
});
