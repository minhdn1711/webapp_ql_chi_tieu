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

/**
 * Get raw number from formatted string (removes dots)
 */
export const getRawAmount = (val) => {
  if (!val) return 0;
  return Number(val.toString().replace(/\./g, ''));
};

/**
 * Format input value with thousand separators
 */
export const formatInput = (val) => {
  if (val === null || val === undefined) return '';
  const num = val.toString().replace(/\./g, '');
  if (isNaN(num)) return '';
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};
