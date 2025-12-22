import { useEffect } from 'react';
import { useAuthContext } from '~/hooks';
import { buildPlatformLoginUrl } from '~/utils/platform';

export default function useAuthRedirect() {
  const { user, isAuthenticated } = useAuthContext();
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isAuthenticated) {
        const isRedirecting = sessionStorage.getItem('auth_redirecting');
        if (isRedirecting) {
          return;
        }

        sessionStorage.setItem('auth_redirecting', 'true');
        const loginUrl = buildPlatformLoginUrl(window.location.href);
        if (loginUrl) {
          window.location.href = loginUrl;
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
    };
  }, [isAuthenticated]);

  return {
    user,
    isAuthenticated,
  };
}
