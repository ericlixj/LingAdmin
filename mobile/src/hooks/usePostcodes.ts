import {useState, useEffect, useCallback} from 'react';
import postcodeService, {Postcode} from '../services/postcodeService';
import {getDataArray} from '../utils/dataFormatter';

/**
 * 共享的邮编管理 Hook
 * 统一管理邮编数据，供所有模块使用
 */
export function usePostcodes() {
  const [postcodes, setPostcodes] = useState<Postcode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载邮编列表
  const loadPostcodes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await postcodeService.getPostcodes();
      
      if (response.code === 0) {
        const postcodesData = getDataArray<Postcode>(response, ['data', 'postcodes']);
        setPostcodes(postcodesData);
      } else {
        setError(response.message || '加载失败');
      }
    } catch (err: any) {
      const errorMessage = err.message || '加载失败';
      setError(errorMessage);
      if (__DEV__) {
        console.error('❌ [usePostcodes Error]', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化时加载
  useEffect(() => {
    loadPostcodes();
  }, [loadPostcodes]);

  // 刷新邮编列表
  const refresh = useCallback(() => {
    loadPostcodes();
  }, [loadPostcodes]);

  return {
    postcodes,
    loading,
    error,
    refresh,
  };
}

