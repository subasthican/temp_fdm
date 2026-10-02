/**
 * The only source of user-facing error text for failed requests.
 * Never render error.message or error.response?.data?.message directly.
 */

export const getApiErrorMessage = (error) => {
  if (!error) return '';

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.code === 'ERR_NETWORK') {
    return 'Cannot reach the server. Check your connection.';
  }

  return 'Something went wrong. Please try again.';
};
