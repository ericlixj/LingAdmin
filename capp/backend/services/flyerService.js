// services/flyerService.js
const { getOpensearchClient } = require('../utils/opensearchClient');

const ES_INDEX = 'flyer_details';

/**
 * 在 OpenSearch 中搜索 flyer_details
 * @param {Object} options - 搜索选项
 * @param {string} options.q - 搜索关键词（查询 name 字段）
 * @param {string} options.zipCode - 邮编（可选，用于过滤 fsa）
 * @param {string} options.lang - 语言：en/hk/cn（默认 cn）
 * @param {number} options.from - 起始位置（分页）
 * @param {number} options.size - 每页数量
 * @returns {Promise<Object>} 搜索结果
 */
async function searchFlyerDetails({
  q = '',
  zipCode = null,
  lang = 'cn',
  from = 0,
  size = 20
}) {
  const client = getOpensearchClient();
  
  try {
    // 根据语言选择查询字段
    let searchField = 'cn_name'; // 默认中文
    let titleField = 'cn_name';
    
    if (lang === 'en') {
      searchField = 'name';
      titleField = 'name';
    } else if (lang === 'hk') {
      searchField = 'hk_name';
      titleField = 'hk_name';
    }

    // 提取 FSA（邮编前3位）
    // 清理邮编：去掉空格和特殊字符，转大写，然后取前3位
    let fsa = null;
    if (zipCode) {
      const cleanZipCode = String(zipCode).replace(/\s+/g, '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
      if (cleanZipCode.length >= 3) {
        fsa = cleanZipCode.slice(0, 3);
      }
    }

    // 如果邮编为空，返回空结果
    if (!fsa) {
      return {
        total: 0,
        data: [],
        from,
        size
      };
    }

    // 构造查询体
    const queryBody = {
      from: from,
      size: size,
      query: {
        bool: {
          must: q 
            ? {
                match: {
                  [searchField]: {
                    query: q,
                    operator: 'and' // 所有关键词都要匹配
                  }
                }
              }
            : { match_all: {} },
          filter: [{ term: { 'fsa_array.keyword': fsa } }]
        }
      },
      sort: [{ update_time: { order: 'desc' } }]
    };

    const response = await client.search({
      index: ES_INDEX,
      body: queryBody
    });

    // 提取结果
    const hits = response.body.hits.hits || [];
    const total = response.body.hits.total?.value || 0;
    
    const results = hits.map(hit => {
      const source = hit._source;
      // 添加 title 字段（统一字段名）
      source.title = source[titleField] || source.name || '';
      return source;
    });

    return {
      total,
      data: results,
      from,
      size
    };
  } catch (error) {
    console.error('OpenSearch search error:', error);
    throw error;
  }
}

module.exports = {
  searchFlyerDetails
};

