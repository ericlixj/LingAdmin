import api from './api';
import {API_ENDPOINTS} from '../config/api';

export interface GasStationParams {
  postcode: string;
  maxDistance?: number;
}

export interface GasStation {
  id: number;
  name: string;
  address: string;
  city: string;
  province: string;
  postcode: string;
  latitude: number;
  longitude: number;
  distance?: number;
  price?: number;
  price_updated_at?: string;
}

export interface GasStationsResponse {
  code: number;
  message: string;
  data: GasStation[];
}

class GasService {
  // 获取加油站列表
  async getGasStations(
    params: GasStationParams,
  ): Promise<GasStationsResponse> {
    return await api.get<GasStationsResponse>(API_ENDPOINTS.GAS, params);
  }
}

export default new GasService();



