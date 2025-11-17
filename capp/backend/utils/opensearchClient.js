// utils/opensearchClient.js
const { Client } = require('@opensearch-project/opensearch');

// OpenSearch 配置
const OPENSEARCH_HOST = process.env.OPENSEARCH_HOST || 'localhost';
const OPENSEARCH_PORT = parseInt(process.env.OPENSEARCH_PORT || '9200', 10);
const OPENSEARCH_PROTOCOL = process.env.OPENSEARCH_PROTOCOL || 'http';

let opensearchClient = null;

/**
 * 获取 OpenSearch 客户端实例（单例模式）
 */
function getOpensearchClient() {
  if (!opensearchClient) {
    console.log(`[INFO] Getting OpenSearch client - host: ${OPENSEARCH_HOST}, port: ${OPENSEARCH_PORT}, protocol: ${OPENSEARCH_PROTOCOL}`);
    opensearchClient = new Client({
      node: `${OPENSEARCH_PROTOCOL}://${OPENSEARCH_HOST}:${OPENSEARCH_PORT}`,
      // 如果有认证，取消注释并配置
      // auth: {
      //   username: 'admin',
      //   password: 'admin'
      // },
      ssl: {
        rejectUnauthorized: false // 开发环境可以设置为 false
      }
    });
  }
  return opensearchClient;
}

module.exports = {
  getOpensearchClient
};

