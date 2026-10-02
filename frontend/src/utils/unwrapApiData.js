/**
 * Unwraps the backend response envelope { success, message, data } from
 * an axios response. Every service method returns unwrapApiData(res) so
 * pages only ever see plain data.
 */

export const unwrapApiData = (response) => response.data?.data;
