/**
 * Utility functions for formatting data in the UI.
 */

/**
 * Formats a number as Philippine Peso.
 * @param amount The numeric amount to format.
 * @returns A formatted string (e.g., ₱1,234.56).
 */
export const formatCurrency = (amount: number | string | null | undefined): string => {
  const numericAmount = Number(amount || 0);
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
};

/**
 * Standardizes date formatting for the UI.
 * @param date The date string or object.
 * @returns A string like "January 1, 2024".
 */
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Standardizes time formatting for the UI.
 * @param date The date string or object.
 * @returns A string like "8:00 AM".
 */
export const formatTime = (date: string | Date): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};
