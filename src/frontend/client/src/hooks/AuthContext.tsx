import {
  useMemo,
  useState,
  useEffect,
  ReactNode,
  useContext,
  useCallback,
  createContext,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { setTokenHeader, SystemRoles } from '~/data-provider/data-provider/src';
import type * as t from '~/data-provider/data-provider/src';
import {
  useGetBsConfig,
  useGetRole,
  useGetUserQuery,
  useLoginUserMutation,
  useLogoutUserMutation,
  useRefreshTokenMutation,
} from '~/data-provider';
import { TAuthConfig, TUserContext, TAuthContext, TResError } from '~/common';
import useTimeout from './useTimeout';
import store from '~/store';

const AuthContext = createContext<TAuthContext | undefined>(undefined);

const AuthContextProvider = ({
  authConfig,
  children,
}: {
  authConfig?: TAuthConfig;
  children: ReactNode;
}) => {
  const [user, setUser] = useRecoilState(store.user);
  const [token, setToken] = useState<string | undefined>(() => {
    // 初始化时检查localStorage中的token
    return localStorage.getItem('token') || localStorage.getItem('ws_token') || undefined;
  });
  const [error, setError] = useState<string | undefined>(undefined);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // 初始化时检查是否有token和用户信息
    const storedToken = localStorage.getItem('token') || localStorage.getItem('ws_token');
    const storedUser = localStorage.getItem('user');
    return !!(storedToken && storedUser);
  });
  const { data: userRole = null } = useGetRole(SystemRoles.USER, {
    enabled: !!(isAuthenticated && (user?.role ?? '')),
  });
  const { data: adminRole = null } = useGetRole(SystemRoles.ADMIN, {
    enabled: !!(isAuthenticated && user?.role === SystemRoles.ADMIN),
  });
  // 初始化时从localStorage恢复用户状态，或从URL参数获取（跨域场景）
  useEffect(() => {
    // 首先检查 URL 参数中是否有认证信息（跨域传递场景）
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('auth_token');
    const urlUser = urlParams.get('auth_user');
    
    if (urlToken) {
      console.log('🔗 AuthContext: 从URL参数获取认证信息');
      localStorage.setItem('token', urlToken);
      localStorage.setItem('ws_token', urlToken);
      if (urlUser) {
        try {
          const userData = JSON.parse(decodeURIComponent(urlUser));
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('✅ AuthContext: URL认证信息已保存到localStorage');
        } catch (e) {
          console.error('❌ AuthContext: 解析URL用户信息失败', e);
        }
      }
      // 清除 URL 中的认证参数，避免泄露
      urlParams.delete('auth_token');
      urlParams.delete('auth_user');
      const newUrl = urlParams.toString() 
        ? `${window.location.pathname}?${urlParams.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
    
    const storedToken = localStorage.getItem('token') || localStorage.getItem('ws_token');
    const storedUser = localStorage.getItem('user');
    
    console.log('🔧 AuthContext: 初始化检查', { 
      storedToken: storedToken ? storedToken.substring(0, 20) + '...' : 'null',
      storedUser: storedUser ? 'exists' : 'null',
      currentUser: user ? user.username : 'null',
      isAuthenticated 
    });
    
    const clearRedirectFlag = () => {
      const redirecting = sessionStorage.getItem('auth_redirecting');
      if (redirecting) {
        console.log('🔁 AuthContext: 清除残留的重定向标记');
        sessionStorage.removeItem('auth_redirecting');
      }
    };

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('🔧 AuthContext: 恢复用户状态', { user: parsedUser });
        
        // 转换用户数据格式以匹配TUser类型
        const normalizedUser = {
          id: parsedUser.user_id?.toString() || parsedUser.id || '',
          username: parsedUser.user_name || parsedUser.username || '',
          email: parsedUser.email || parsedUser.user_name || '',
          name: parsedUser.name || parsedUser.user_name || '',
          avatar: parsedUser.avatar || '',
          role: parsedUser.role || 'user',
          provider: parsedUser.provider || 'local',
          createdAt: parsedUser.createdAt || new Date().toISOString(),
          updatedAt: parsedUser.updatedAt || new Date().toISOString(),
        };
        
        // 无论当前user状态如何，都重新设置
        setUser(normalizedUser);
        setToken(storedToken);
        setTokenHeader(storedToken);
        setIsAuthenticated(true);
        
        // 清除重定向标记
        clearRedirectFlag();
        
        console.log('✅ AuthContext: 认证状态已设置');
      } catch (error) {
        console.error('❌ 解析用户信息失败:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('ws_token');
        setIsAuthenticated(false);
      }
    } else {
      console.log('⚠️ AuthContext: 缺少认证数据', { hasToken: !!storedToken, hasUser: !!storedUser });
      // 即使没有完整的本地认证信息，也需要清理残留的重定向状态，防止后续401无法自动跳转
      clearRedirectFlag();
    }
  }, []);

  useEffect(() => {
    setUserContext({ token, isAuthenticated: !!user, user });
  }, [user])

  const navigate = useNavigate();
  const { data: bsConfig } = useGetBsConfig()

  const setUserContext = useCallback(
    (userContext: TUserContext) => {
      const { token, isAuthenticated, user, redirect } = userContext;
      setUser(user);
      setToken(token);
      //@ts-ignore - ok for token to be undefined initially
      setTokenHeader(token);
      setIsAuthenticated(isAuthenticated);
      if (redirect == null) {
        return;
      }
      if (redirect.startsWith('http://') || redirect.startsWith('https://')) {
        // For external links, use window.location
        window.location.href = redirect;
        // Or if you want to open in a new tab:
        // window.open(redirect, '_blank');
      } else {
        navigate(redirect, { replace: true });
      }
    },
    [navigate, setUser],
  );
  const doSetError = useTimeout({ callback: (error) => setError(error as string | undefined) });

  const loginUser = useLoginUserMutation({
    onSuccess: (data: t.TLoginResponse) => {
      const { user, token, twoFAPending, tempToken } = data;
      if (twoFAPending) {
        // Redirect to the two-factor authentication route.
        navigate(`/login/2fa?tempToken=${tempToken}`, { replace: true });
        return;
      }
      setError(undefined);
      setUserContext({ token, isAuthenticated: true, user });
    },
    onError: (error: TResError | unknown) => {
      const resError = error as TResError;
      doSetError(resError.message);
      navigate('/login', { replace: true });
    },
  });
  const logoutUser = useLogoutUserMutation({
    onSuccess: (data) => {
      setUserContext({
        token: undefined,
        isAuthenticated: false,
        // user: undefined,
        redirect: `${location.origin}/${__APP_ENV__.BISHENG_HOST}?from=workspace` // data.redirect ?? bsConfig?.host,
      });
    },
    onError: (error) => {
      doSetError((error as Error).message);
      setUserContext({
        token: undefined,
        isAuthenticated: false,
        user: undefined,
        redirect: bsConfig?.host,
      });
    },
  });
  // const refreshToken = useRefreshTokenMutation();

  const logout = useCallback(() => logoutUser.mutate(undefined), [logoutUser]);
  const userQuery = useGetUserQuery();
  // const userQuery = useGetUserQuery({ enabled: !!(token ?? '') });

  const login = (data: t.TLoginUser) => {
    loginUser.mutate(data);
  };

  const silentRefresh = useCallback(() => {
    if (authConfig?.test === true) {
      console.log('Test mode. Skipping silent refresh.');
      return;
    }
    // refreshToken.mutate(undefined, {
    //   onSuccess: (data: t.TRefreshTokenResponse | undefined) => {
    //     const { user, token = '' } = data ?? {};
    //     if (token) {
    //       setUserContext({ token, isAuthenticated: true, user });
    //     } else {
    //       console.log('Token is not present. User is not authenticated.');
    //       if (authConfig?.test === true) {
    //         return;
    //       }
    //       navigate('/login');
    //     }
    //   },
    //   onError: (error) => {
    //     console.log('refreshToken mutation error:', error);
    //     if (authConfig?.test === true) {
    //       return;
    //     }
    //     navigate('/login');
    //   },
    // });
  }, []);

  useEffect(() => {
    if (userQuery.data) {
      setUser(userQuery.data);
    } else if (userQuery.isError) {
      doSetError((userQuery.error as Error).message);
      // 如果没有认证信息，跳转到主平台登录
      if (!isAuthenticated) {
        window.location.href = `${location.origin}/${__APP_ENV__.BISHENG_HOST}?from=workspace`;
      }
    }
    if (error != null && error && isAuthenticated) {
      doSetError(undefined);
    }
    if (token == null || !token || !isAuthenticated) {
      silentRefresh();
    }
  }, [
    token,
    isAuthenticated,
    userQuery.data,
    userQuery.isError,
    userQuery.error,
    error,
    setUser,
    navigate,
    silentRefresh,
    setUserContext,
  ]);

  useEffect(() => {
    const handleTokenUpdate = (event) => {
      console.log('tokenUpdated event received event');
      const newToken = event.detail;
      setUserContext({
        token: newToken,
        isAuthenticated: true,
        user: user,
      });
    };

    window.addEventListener('tokenUpdated', handleTokenUpdate);

    return () => {
      window.removeEventListener('tokenUpdated', handleTokenUpdate);
    };
  }, [setUserContext, user]);

  // Make the provider update only when it should
  const memoedValue = useMemo(
    () => ({
      user,
      token,
      error,
      login,
      logout,
      setError,
      roles: {
        [SystemRoles.USER]: userRole,
        [SystemRoles.ADMIN]: adminRole,
      },
      isAuthenticated,
    }),

    [user, error, isAuthenticated, token, userRole, adminRole],
  );

  return <AuthContext.Provider value={memoedValue}>{children}</AuthContext.Provider>;
};

const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuthContext should be used inside AuthProvider');
  }

  return context;
};

export { AuthContextProvider, useAuthContext, AuthContext };
