// src/dataProvider.ts
import { DataProvider } from "@refinedev/core";
import axiosInstance from "./utils/axiosInstance";
import qs from "qs";

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

      const { field, order } = (sorters && sorters[0]) || {};

      // ✅ 构造 filters（转换 dayjs 为 ISO）
      const serializedFilters = (filters || []).map((filter) => {
        const { field, operator, value } = filter;

        if (
          operator === "in" &&
          Array.isArray(value) &&
          value.length === 2 &&
          value[0]?.toISOString
        ) {
          return {
            field,
            operator,
            value: value.map((v) =>
              typeof v.toISOString === "function" ? v.toISOString() : v
            ),
          };
        }

        return { field, operator, value };
      });

      // ✅ 构造 query 参数
      const queryParams: Record<string, any> = {
        _start,
        _end,
        sortField: field,
        sortOrder: order,
        filters: serializedFilters,
      };

      // ✅ 构造 query string，保留数组索引 filters[0]、filters[1]...
      const queryString = qs.stringify(queryParams, {
        encode: false,
        arrayFormat: "indices",
      });

      // ✅ 发起 GET 请求
      const response = await axiosInstance.get(`/${resource}?${queryString}`);

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
  custom: async ({ url, method, config }) => {
    try {
      const response = await axiosInstance.request({
        url,
        method,
        ...config,
      });
      return {
        data: response.data,
      };
    } catch (error) {
      handleAxiosError(error);
    }
  },
};


export default axiosDataProvider;