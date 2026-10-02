/**
 * The standard write hook — wraps useMutation with success/error toasts
 * and cache invalidation. Pages pass successMessage + invalidateKeys and
 * never call toast or queryClient.invalidateQueries manually.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { getApiErrorMessage } from '../../utils/apiError.js';

export const useApiMutation = (mutationFn, options = {}) => {
  const { successMessage, invalidateKeys = [], ...mutationOptions } = options;

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    ...mutationOptions,
    onSuccess: (data, variables, context) => {
      if (successMessage) {
        toast.success(successMessage);
      }

      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });

      mutationOptions.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      toast.error(getApiErrorMessage(error));

      mutationOptions.onError?.(error, variables, context);
    },
  });
};

export default useApiMutation;
