// src/dataProvider.ts
import { DataProvider } from "@refinedev/core";
import axiosInstance from "./utils/axiosInstance";

const handleAxiosError = (error: any) => {
  const detail =
    error?.response?.data?.detail ||
    error?.response?.statusText ||
    "Unknown error";
  throw new Error(detail);
};

const axiosDataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters, sorters }) => {
    try {
      const { current = 1, pageSize = 10 } = pagination || {};
      const _start = (current - 1) * pageSize;
      const _end = current * pageSize;

      //order
      const { field, order } = (sorters && sorters[0]) || {};

      // 参数：分页+排序
      const params: Record<string, any> = {
        _start,
        _end,
        sortField: field,
        sortOrder: order,
      };

      //  参数：过滤
      filters?.forEach((filter) => {
        if (filter.operator === "contains" || filter.operator === "eq") {
          params[filter.field] = filter.value;
        }
      });

      const response = await axiosInstance.get(`/${resource}`, { params });
      return {
        data: response.data.data,
        total: response.data.total,
      };
    } catch (error) {
      handleAxiosError(error);
    }
  },

  getOne: async ({ resource, id }) => {
    try {
      const response = await axiosInstance.get(`/${resource}/${id}`);
      return { data: response.data };
    } catch (error) {
      handleAxiosError(error);
    }
  },

  create: async ({ resource, variables }) => {
    try {
      const response = await axiosInstance.post(`/${resource}`, variables);
      return { data: response.data };
    } catch (error) {
      handleAxiosError(error);
    }
  },

  update: async ({ resource, id, variables }) => {
    try {
      const response = await axiosInstance.patch(`/${resource}/${id}`, variables);
      return { data: response.data };
    } catch (error) {
      handleAxiosError(error);
    }
  },

  deleteOne: async ({ resource, id }) => {
    try {
      const response = await axiosInstance.delete(`/${resource}/${id}`);
      return { data: response.data };
    } catch (error) {
      handleAxiosError(error);
    }
  },

  // 可按需添加其他方法，例如 getMany、deleteMany 等
};


export default axiosDataProvider;