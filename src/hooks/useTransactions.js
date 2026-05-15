import { useState, useEffect } from 'react';

export const useTransactions = () => {
  const [transactions, setTransactions] = useState([]);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const addTransaction = async (newTransaction) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTransaction)
      });
      
      if (res.ok) {
        // Refetch to get updated list
        fetchTransactions();
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  return {
    transactions,
    addTransaction
  };
};
