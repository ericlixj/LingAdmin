import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import authService, {User} from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 检查认证状态
  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        const response = await authService.getMe();
        if (response.code === 0) {
          setUser(response.data.user);
        } else {
          await authService.logout();
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 登录
  const login = async (email: string, password: string) => {
    const response = await authService.login({email, password});
    if (response.code === 0 && response.data) {
      setUser(response.data.user);
    } else {
      throw new Error(response.message || '登录失败');
    }
  };

  // 注册
  const register = async (email: string, password: string, fullName?: string) => {
    const response = await authService.register({email, password, full_name: fullName});
    if (response.code !== 0) {
      throw new Error(response.message || '注册失败');
    }
  };

  // 登出
  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  // 初始化时检查认证状态
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        checkAuth,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

