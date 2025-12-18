/**
 * 统一的数据格式转换工具
 * 处理 API 返回的各种数据格式，统一转换为标准格式
 */

const DEBUG = __DEV__;

/**
 * 从响应数据中提取数组
 * 支持多种数据格式：
 * 1. 直接数组: { code: 0, data: [...] }
 * 2. 对象包含数组: { code: 0, data: { items: [...] } }
 * 3. 嵌套对象: { code: 0, data: { data: [...] } }
 * 4. 常见字段名: stations, postcodes, items, results, data
 */
export function extractArrayFromResponse(
  data: any,
  fieldNames: string[] = ['data', 'items', 'results', 'stations', 'postcodes'],
): any[] {
  if (!data) {
    return [];
  }

  // 如果直接是数组，直接返回
  if (Array.isArray(data)) {
    if (DEBUG) {
      console.log('📦 [DataFormatter] Direct array detected');
    }
    return data;
  }

  // 如果是对象，尝试从常见字段中提取数组
  if (typeof data === 'object') {
    // 按优先级尝试各个字段名
    for (const fieldName of fieldNames) {
      if (fieldName in data && Array.isArray(data[fieldName])) {
        if (DEBUG) {
          console.log(`📦 [DataFormatter] Found array in field: ${fieldName}`);
        }
        return data[fieldName];
      }
    }

    // 如果没找到，尝试查找对象中所有的数组值
    const arrayValues = Object.values(data).filter(
      value => Array.isArray(value) && value.length > 0,
    );

    if (arrayValues.length > 0) {
      if (DEBUG) {
        console.log(`📦 [DataFormatter] Found array in object values, using first array`);
      }
      return arrayValues[0] as any[];
    }

    // 如果对象本身只有一个数组类型的值，返回它
    const values = Object.values(data);
    if (values.length === 1 && Array.isArray(values[0])) {
      if (DEBUG) {
        console.log(`📦 [DataFormatter] Object contains single array, using it`);
      }
      return values[0] as any[];
    }
  }

  if (DEBUG) {
    console.warn('⚠️ [DataFormatter] Could not extract array from data:', {
      dataType: typeof data,
      isArray: Array.isArray(data),
      keys: typeof data === 'object' ? Object.keys(data) : null,
    });
  }

  return [];
}

/**
 * 标准化 API 响应格式
 * 确保所有响应都有统一的格式：{ code, message, data }
 */
export function normalizeApiResponse(response: any): {
  code: number;
  message: string;
  data: any;
  [key: string]: any;
} {
  // 如果已经是标准格式，直接返回
  if (response && typeof response === 'object' && 'code' in response) {
    return response;
  }

  // 如果不是标准格式，尝试包装
  return {
    code: 0,
    message: 'ok',
    data: response,
  };
}

/**
 * 从标准 API 响应中提取数据数组
 * 自动处理各种数据格式
 */
export function getDataArray<T>(
  response: any,
  fieldNames?: string[],
): T[] {
  if (!response) {
    return [];
  }

  // 如果 response.data 直接是数组，直接返回（最常见的情况）
  if (Array.isArray(response.data)) {
    if (DEBUG) {
      console.log('📦 [DataFormatter] Response.data is directly an array');
    }
    return response.data as T[];
  }

  // 标准化响应格式
  const normalized = normalizeApiResponse(response);

  // 如果 code 不是 0，返回空数组
  if (normalized.code !== 0) {
    if (DEBUG) {
      console.warn('⚠️ [DataFormatter] Response code is not 0:', normalized.code);
    }
    return [];
  }

  // 如果标准化后的 data 是数组，直接返回
  if (Array.isArray(normalized.data)) {
    if (DEBUG) {
      console.log('📦 [DataFormatter] Normalized data is an array');
    }
    return normalized.data as T[];
  }

  // 提取数组
  const array = extractArrayFromResponse(normalized.data, fieldNames);

  if (DEBUG) {
    console.log('✅ [DataFormatter] Extracted array:', {
      originalDataType: typeof normalized.data,
      extractedLength: array.length,
      firstItem: array[0] || null,
    });
  }

  return array as T[];
}

/**
 * 从标准 API 响应中提取单个数据对象
 */
export function getDataObject<T>(response: any): T | null {
  if (!response) {
    return null;
  }

  const normalized = normalizeApiResponse(response);

  if (normalized.code !== 0) {
    return null;
  }

  // 如果 data 是对象，直接返回
  if (normalized.data && typeof normalized.data === 'object' && !Array.isArray(normalized.data)) {
    return normalized.data as T;
  }

  return null;
}


