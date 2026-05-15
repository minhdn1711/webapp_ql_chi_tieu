import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CategoryContext = createContext();

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = async (category) => {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    });
    if (res.ok) fetchCategories();
    return res;
  };

  const updateCategory = async (id, category) => {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    });
    if (res.ok) fetchCategories();
    return res;
  };

  const deleteCategory = async (id) => {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'DELETE'
    });
    if (res.ok) fetchCategories();
    return res;
  };

  return (
    <CategoryContext.Provider value={{ 
      categories, 
      loading, 
      fetchCategories, 
      addCategory, 
      updateCategory, 
      deleteCategory 
    }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) throw new Error('useCategories must be used within CategoryProvider');
  return context;
};
