/**
 * Utility functions for client code management
 */

export const CLIENT_CODE_KEY = 'clientCode';

/**
 * Get client code from localStorage
 * @returns {string | null} The client code or null if not found
 */
export const getClientCode = (): string | null => {
  try {
    return localStorage.getItem(CLIENT_CODE_KEY);
  } catch (error) {
    console.error('Error getting client code from localStorage:', error);
    return null;
  }
};

/**
 * Set client code in localStorage
 * @param {string} clientCode - The client code to store
 */
export const setClientCode = (clientCode: string): void => {
  try {
    localStorage.setItem(CLIENT_CODE_KEY, clientCode);
  } catch (error) {
    console.error('Error setting client code in localStorage:', error);
  }
};

/**
 * Remove client code from localStorage
 */
export const removeClientCode = (): void => {
  try {
    localStorage.removeItem(CLIENT_CODE_KEY);
  } catch (error) {
    console.error('Error removing client code from localStorage:', error);
  }
};

/**
 * Format client code for display
 * @param {string | null} clientCode - The client code to format
 * @returns {string} Formatted client code or fallback text
 */
export const formatClientCodeDisplay = (clientCode: string | null): string => {
  if (!clientCode) {
    return 'N/A';
  }
  return clientCode.toUpperCase();
};
