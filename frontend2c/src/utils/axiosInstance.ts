import axios from "axios";

const VITE_API_URL = import.meta.env.VITE_API_URL;

export const TOKEN_KEY = "refine-auth";
export const REFRESH_TOKEN_KEY = "refine-refresh-token";

export const axiosInstance = axios.create({
  baseURL: `${VITE_API_URL}/api/v1`,
});

// 刷新 token 的全局 promise，防止并发重复请求
let refreshTokenPromise: Promise<any> | null = null;

// 跳转到登录页
function redirectToLogin() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.location.href = "/login";
}

// 请求拦截器：自动加 token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：处理 401 和刷新 token
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const is401 = error.response?.status === 401;
    if (
      is401  &&
      !originalRequest._retry &&
      localStorage.getItem(REFRESH_TOKEN_KEY)
    ) {
      originalRequest._retry = true;

      try {
        // 如果已有正在执行的刷新 promise，等待它完成
        if (!refreshTokenPromise) {
          const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
          //这里不要使用axiosInstance，会被循环拦截
          refreshTokenPromise = axios.post(`${VITE_API_URL}/api/v1/refresh`, {
            refresh_token: refreshToken,
          });
        }

        const res = await refreshTokenPromise;
        refreshTokenPromise = null;

        const { access_token, refresh_token } = res.data;
        localStorage.setItem(TOKEN_KEY, access_token);
        localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);

        // 更新原请求头并重试
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return axiosInstance(originalRequest);

      } catch (refreshError) {
        refreshTokenPromise = null;
        redirectToLogin();
        return Promise.reject(refreshError);
      }
    }

    if (is401) {
      redirectToLogin();
    }

    // 如果不是 401 或没有 refresh token，直接抛出错误
    return Promise.reject(error);
  }
);

export default axiosInstance;
