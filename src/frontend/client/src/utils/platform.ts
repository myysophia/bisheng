export const getPlatformOrigin = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  const currentUrl = new URL(window.location.href);
  const isDev = import.meta.env?.DEV || process.env.NODE_ENV === 'development';

  if (isDev && currentUrl.port === '4001') {
    currentUrl.port = '3001';
  }

  return currentUrl.origin;
};

export const buildPlatformLoginUrl = (redirectUrl?: string) => {
  const origin = getPlatformOrigin();
  if (!origin) {
    return '';
  }

  const baseUrl = `${origin}/`;
  if (!redirectUrl) {
    return baseUrl;
  }

  return `${baseUrl}?redirect=${encodeURIComponent(redirectUrl)}`;
};
