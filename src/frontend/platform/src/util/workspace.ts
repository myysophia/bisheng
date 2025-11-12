const ensureTrailingSlash = (url: string) => {
    if (!url) return '/';
    return url.endsWith('/') ? url : `${url}/`;
};

const toAbsoluteUrl = (url: string) => {
    if (!url) return '/workspace/';
    const normalized = ensureTrailingSlash(url.trim());
    if (/^https?:\/\//i.test(normalized)) {
        return normalized;
    }
    if (typeof window !== 'undefined') {
        const prefix = normalized.startsWith('/') ? '' : '/';
        return `${window.location.origin}${prefix}${normalized}`;
    }
    return normalized;
};

export const resolveWorkspaceUrl = (preferred?: string) => {
    if (preferred) {
        return toAbsoluteUrl(preferred);
    }

    if (typeof __APP_ENV__ !== 'undefined' && __APP_ENV__.WORKBENCH_BASE_URL) {
        return toAbsoluteUrl(__APP_ENV__.WORKBENCH_BASE_URL);
    }

    if (typeof window !== 'undefined') {
        const currentUrl = new URL(window.location.href);
        if (currentUrl.port === '3001') {
            currentUrl.port = '4001';
        } else if (!currentUrl.port && currentUrl.hostname === 'localhost') {
            currentUrl.port = '4001';
        }
        currentUrl.pathname = '/workspace/';
        currentUrl.search = '';
        currentUrl.hash = '';
        return currentUrl.toString();
    }

    return '/workspace/';
};

export const buildWorkspaceLink = (baseUrl: string, relativePath: string) => {
    const base = baseUrl || resolveWorkspaceUrl();
    const baseWithSlash = ensureTrailingSlash(base);
    try {
        const url = new URL(relativePath.replace(/^\//, ''), baseWithSlash);
        return url.toString();
    } catch (error) {
        return `${baseWithSlash}${relativePath.replace(/^\//, '')}`;
    }
};
