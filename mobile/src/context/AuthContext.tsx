import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import authService, {User} from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化：检查是否已登录
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const isAuth = await authService.isAuthenticated();
      
      if (isAuth) {
        // 如果已登录，获取用户信息
        await refreshUser();
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('检查认证状态失败:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({email, password});
      
      if (response.code === 0 && response.data) {
        // 登录成功后获取用户信息
        await refreshUser();
      } else {
        throw new Error(response.message || '登录失败');
      }
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, fullName?: string) => {
    try {
      const response = await authService.register({email, password, full_name: fullName});
      
      if (response.code !== 0) {
        throw new Error(response.message || '注册失败');
      }
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('登出失败:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authService.getMe();
      
      if (response.code === 0 && response.data) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
