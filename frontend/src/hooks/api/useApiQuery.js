/**
 * The standard read hook — wraps React Query's useQuery and exposes
 * errorMessage (via getApiErrorMessage) so pages never touch raw errors.
 * Pages import this, never useQuery directly.
 */
import { useQuery } from '@tanstack/react-query';

import { getApiErrorMessage } from '../../utils/apiError.js';

export const useApiQuery = (queryKey, queryFn, options = {}) => {
  const query = useQuery({
    queryKey,
    queryFn,
    ...options,
  });

  return {
    ...query,
    errorMessage: query.error ? getApiErrorMessage(query.error) : '',
  };
};

export default useApiQuery;
