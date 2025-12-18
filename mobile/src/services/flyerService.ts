import api from './api';
import {API_ENDPOINTS} from '../config/api';

export interface FlyerDetailsParams {
  q?: string;
  lang?: 'cn' | 'en' | 'hk';
  zip_code?: string;
  _start?: number;
  _end?: number;
}

export interface FlyerItem {
  id: number;
  title?: string;
  cn_name?: string;
  name?: string;
  brand?: string;
  price?: number;
  merchant?: string;
  valid_from?: string;
  valid_to?: string;
  cutout_image_url?: string;
}

export interface FlyerDetailsResponse {
  code: number;
  message: string;
  data: FlyerItem[];
  total: number;
  from: number;
  size: number;
}

class FlyerService {
  // 搜索传单详情
  async searchFlyers(params: FlyerDetailsParams): Promise<FlyerDetailsResponse> {
    if (__DEV__) {
      console.log('🔍 [FlyerService] searchFlyers called with params:', {
        params,
        paramsString: JSON.stringify(params, null, 2),
        endpoint: API_ENDPOINTS.FLYER_DETAILS,
      });
    }
    
    const response = await api.get<FlyerDetailsResponse>(
      API_ENDPOINTS.FLYER_DETAILS,
      params,
    );
    
    if (__DEV__) {
      console.log('🔍 [FlyerService] searchFlyers response:', {
        code: response.code,
        message: response.message,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        dataLength: Array.isArray(response.data) ? response.data.length : null,
        total: response.total,
        from: response.from,
        size: response.size,
        fullResponse: JSON.stringify(response, null, 2),
      });
    }
    
    return response;
  }
}

export default new FlyerService();

