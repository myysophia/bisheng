/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError, AxiosRequestConfig } from 'axios';


const customAxios = axios.create({
  baseURL: import.meta.env.BASE_URL,
  withCredentials: true
});

// 设置 token 到请求头
const setTokenHeader = (token: string) => {
  if (token) {
    customAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete customAxios.defaults.headers.common['Authorization'];
  }
};

// 初始化时设置 token
const initToken = () => {
  // 优先使用平台前端的token
  const wsToken = localStorage.getItem('ws_token');
  const token = localStorage.getItem('token');
  
  const finalToken = wsToken || token;
  if (finalToken) {
    setTokenHeader(finalToken);
    // 同步token到两个key，确保兼容性
    if (wsToken && !token) {
      localStorage.setItem('token', wsToken);
    } else if (token && !wsToken) {
      localStorage.setItem('ws_token', token);
    }
  }
};

// 监听 token 更新事件
if (typeof window !== 'undefined') {
  window.addEventListener('tokenUpdated', ((event: CustomEvent) => {
    setTokenHeader(event.detail);
  }) as EventListener);
  
  // 初始化 token
  initToken();
}

async function _get<T>(url: string, options?: AxiosRequestConfig): Promise<T> {
  const response = await customAxios.get(url, { ...options });
  return response.data;
}

async function _getResponse<T>(url: string, options?: AxiosRequestConfig): Promise<T> {
  return await customAxios.get(url, { ...options });
}

async function _post(url: string, data?: any, config?: AxiosRequestConfig) {
  const response = await customAxios.post(url, JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
    ...config
  });
  return response.data;
}

async function _postMultiPart(url: string, formData: FormData, options?: AxiosRequestConfig) {
  const response = await customAxios.post(url, formData, {
    ...options,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

async function _postTTS(url: string, formData: FormData, options?: AxiosRequestConfig) {
  const response = await customAxios.post(url, formData, {
    ...options,
    headers: { 'Content-Type': 'multipart/form-data' },
    responseType: 'arraybuffer',
  });
  return response.data;
}

async function _put(url: string, data?: any) {
  const response = await customAxios.put(url, JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
}

async function _delete<T>(url: string): Promise<T> {
  const response = await customAxios.delete(url);
  return response.data;
}

async function _deleteWithOptions<T>(url: string, options?: AxiosRequestConfig): Promise<T> {
  const response = await customAxios.delete(url, { ...options });
  return response.data;
}

async function _patch(url: string, data?: any) {
  const response = await customAxios.patch(url, JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
}

let isRefreshing = false;
let failedQueue: { resolve: (value?: any) => void; reject: (reason?: any) => void }[] = [];

// const refreshToken = (retry?: boolean): Promise<t.TRefreshTokenResponse | undefined> =>
//   _post(endpoints.refreshToken(retry));

// const dispatchTokenUpdatedEvent = (token: string) => {
//   setTokenHeader(token);
//   window.dispatchEvent(new CustomEvent('tokenUpdated', { detail: token }));
// };

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 添加请求拦截器，确保每个请求都有Authorization头
customAxios.interceptors.request.use(
  (config) => {
    // 确保每个请求都有token
    const token = localStorage.getItem('token') || localStorage.getItem('ws_token');
    if (token && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('Request interceptor: Added Authorization header');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

customAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!error.response) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes('/api/auth/2fa') === true) {
      return Promise.reject(error);
    }
    if (originalRequest.url?.includes('/api/auth/logout') === true) {
      return Promise.reject(error);
    }

    if (error.response.status === 401 && !originalRequest._retry) {
      console.warn('401 error, refreshing token');
      originalRequest._retry = true;

      const isEducationDemo = localStorage.getItem('educationDemoMode') === 'true';

      if (import.meta.env.MODE === 'production' && !isEducationDemo) {
        location.href = `${location.origin}/${__APP_ENV__.BISHENG_HOST}?from=workspace`
      }
      // } else {
      //   if (location.pathname.indexOf('login') === -1) {
      //     // location.href = '/workspace/login';
      //   }
      // }
      // location.href = '/'

      // if (isRefreshing) {
      //   try {
      //     const token = await new Promise((resolve, reject) => {
      //       failedQueue.push({ resolve, reject });
      //     });
      //     // originalRequest.headers['Authorization'] = 'Bearer ' + token;
      //     return await customAxios(originalRequest);
      //   } catch (err) {
      //     return Promise.reject(err);
      //   }
      // }

      // isRefreshing = true;

      try {
        // const response = await refreshToken(
        //   // Handle edge case where we get a blank screen if the initial 401 error is from a refresh token request
        //   originalRequest.url?.includes('api/auth/refresh') === true ? true : false,
        // );

        // const token = response?.token ?? '';

        // if (token) {
        //   originalRequest.headers['Authorization'] = 'Bearer ' + token;
        //   dispatchTokenUpdatedEvent(token);
        //   processQueue(null, token);
        //   return await customAxios(originalRequest);
        // } else if (window.location.href.includes('share/')) {
        //   console.log(
        //     `Refresh token failed from shared link, attempting request to ${originalRequest.url}`,
        //   );
        // } else {
        //   window.location.href = '/login';
        // }
      } catch (err) {
        processQueue(err as AxiosError, null);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default {
  get: _get,
  getResponse: _getResponse,
  post: _post,
  postMultiPart: _postMultiPart,
  postTTS: _postTTS,
  put: _put,
  delete: _delete,
  deleteWithOptions: _deleteWithOptions,
  patch: _patch,
};
