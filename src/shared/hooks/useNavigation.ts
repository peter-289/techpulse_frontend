import { useNavigate as useReactRouterNavigate } from 'react-router-dom';

/**
 * Hook to navigate using react-router
 * Wrapper around useNavigate from react-router-dom for consistency
 * @returns Navigation function
 */
export function useNavigation() {
  return useReactRouterNavigate();
}
