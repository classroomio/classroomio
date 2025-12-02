import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from '@tanstack/react-router';

import { NAV_STRUCTURE } from '@/lib/utils/constants';

export function DocsNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  const subcategories = selectedCategory
    ? NAV_STRUCTURE[selectedCategory as keyof typeof NAV_STRUCTURE]?.children || []
    : [];

  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter((p) => p && p !== 'docs');
    if (pathSegments.length > 0) {
      setSelectedCategory(pathSegments[0]);
      if (pathSegments.length > 1) {
        setSelectedSubcategory(pathSegments[1]);
      }
    }
  }, [location.pathname]);

  const handleCategoryChange = (value: string) => {
    if (value) {
      const categoryData = NAV_STRUCTURE[value as keyof typeof NAV_STRUCTURE];
      if (categoryData?.children.length > 0) {
        navigate({ to: `/docs/${value}/${categoryData.children[0].url}` });
      } else {
        navigate({ to: `/docs/${value}` });
      }
    }
  };

  const handleSubcategoryChange = (value: string) => {
    if (value && selectedCategory) {
      navigate({ to: `/docs/${selectedCategory}/${value}` });
    }
  };

  return (
    <div className="flex items-center gap-2 md:gap-3">
      <select
        value={selectedCategory}
        onChange={(e) => handleCategoryChange(e.target.value)}
        className="bg-background rounded-md px-2 py-2 text-xs outline-none md:px-3 md:py-2 md:text-sm"
      >
        <option value="">Select Documentation</option>
        {Object.entries(NAV_STRUCTURE).map(([key, { label }]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      {subcategories.length > 0 && (
        <select
          value={selectedSubcategory}
          onChange={(e) => handleSubcategoryChange(e.target.value)}
          className="bg-background rounded-md px-2 py-2 text-xs outline-none md:px-3 md:py-2 md:text-sm"
        >
          <option value="">Select Section</option>
          {subcategories.map((subcategory) => (
            <option key={subcategory.url} value={subcategory.url}>
              {subcategory.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
