/**
 * Safely format a number to a currency string
 * @param {number|null|undefined} amount 
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0';
  }
  return amount.toLocaleString('vi-VN');
};
