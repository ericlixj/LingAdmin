import api from './api';
import {API_ENDPOINTS} from '../config/api';

export interface Postcode {
  id: number;
  user_id: number;
  postcode: string;
  label: string;
  create_time: string;
  update_time: string;
}

export interface PostcodeRequest {
  postcode: string;
  label?: string;
}

export interface PostcodesResponse {
  code: number;
  message: string;
  data: Postcode[];
}

class PostcodeService {
  // 获取用户的所有邮编
  async getPostcodes(): Promise<PostcodesResponse> {
    return await api.get<PostcodesResponse>(API_ENDPOINTS.POSTCODE);
  }

  // 创建邮编
  async createPostcode(data: PostcodeRequest) {
    return await api.post(API_ENDPOINTS.POSTCODE, data);
  }

  // 更新邮编
  async updatePostcode(id: number, data: Partial<PostcodeRequest>) {
    return await api.patch(`${API_ENDPOINTS.POSTCODE}/${id}`, data);
  }

  // 删除邮编
  async deletePostcode(id: number) {
    return await api.delete(`${API_ENDPOINTS.POSTCODE}/${id}`);
  }
}

export default new PostcodeService();



