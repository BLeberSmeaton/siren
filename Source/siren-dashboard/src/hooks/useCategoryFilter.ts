import { useState, useCallback } from 'react';

export const useCategoryFilter = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategoryFilter = useCallback((category: string | null) => {
    setSelectedCategory(category);
  }, []);

  return {
    selectedCategory,
    handleCategoryFilter,
  };
};
