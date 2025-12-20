import api from './api';
import {API_ENDPOINTS} from '../config/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
}

export interface User {
  id: number;
  email: string;
  full_name?: string;
  is_active: boolean;
}

export interface AuthResponse {
  code: number;
  message: string;
  data: {
    user: User;
    access_token: string;
    refresh_token: string;
    token_type: string;
  };
}

export interface MeResponse {
  code: number;
  message: string;
  data: {
    user: User;
    roles: Array<{id: number; code: string; name: string}>;
  };
}

class AuthService {
  // 登录
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
    );
    
    if (response.code === 0 && response.data) {
      // 保存 token
      await api.setTokens(
        response.data.access_token,
        response.data.refresh_token,
      );
    }
    
    return response;
  }

  // 注册
  async register(data: RegisterRequest) {
    return await api.post(API_ENDPOINTS.AUTH.REGISTER, data);
  }

  // 验证邮箱
  async verifyEmail(token: string) {
    return await api.get(API_ENDPOINTS.AUTH.VERIFY_EMAIL, {token});
  }

  // 获取当前用户信息
  async getMe(): Promise<MeResponse> {
    return await api.get<MeResponse>(API_ENDPOINTS.AUTH.ME);
  }

  // 登出
  async logout() {
    await api.clearTokens();
  }

  // 检查是否已登录
  async isAuthenticated(): Promise<boolean> {
    const token = await api.getToken();
    return !!token;
  }
}

export default new AuthService();





