// PointsHistory.jsx
import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function PointsHistory({ onClose }) {
  const [transactions, setTransactions] = useState([]);
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      // 获取积分信息
      const pointsResponse = await fetch(`${API_URL}/api/c/points`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const pointsResult = await pointsResponse.json();
      if (pointsResult.code === 0) {
        setPoints(pointsResult.data);
      }

      // 获取交易记录
      const transactionsResponse = await fetch(
        `${API_URL}/api/c/points/transactions?page=${page}&pageSize=${pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const transactionsResult = await transactionsResponse.json();
      if (transactionsResult.code === 0) {
        setTransactions(transactionsResult.data.transactions);
        setTotal(transactionsResult.data.total);
      }
    } catch (err) {
      console.error('Fetch data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionTypeLabel = (type) => {
    const labels = {
      'earn': '获得',
      'spend': '消费',
      'adjust': '调整'
    };
    return labels[type] || type;
  };

  const getTransactionTypeColor = (type) => {
    const colors = {
      'earn': '#28a745',
      'spend': '#dc3545',
      'adjust': '#ffc107'
    };
    return colors[type] || '#666';
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{ color: 'white' }}>加载中...</div>
      </div>
    );
  }

  const balance = points ? parseFloat(points.balance || 0) : 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div 
      onClick={(e) => {
        // 点击背景关闭
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px'
      }}
    >
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        {/* 头部 */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>积分明细</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {/* 积分余额 */}
        <div style={{
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #eee'
        }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
            当前积分余额
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff6b35' }}>
            {balance.toFixed(0)} 积分
          </div>
        </div>

        {/* 交易记录列表 */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px'
        }}>
          {transactions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#999'
            }}>
              暂无交易记录
            </div>
          ) : (
            <div>
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  style={{
                    padding: '15px',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 'bold',
                      marginBottom: '0.25rem',
                      color: '#333'
                    }}>
                      {tx.description || getTransactionTypeLabel(tx.transaction_type)}
                    </div>
                    <div style={{
                      fontSize: '0.85rem',
                      color: '#999'
                    }}>
                      {formatDate(tx.create_time)}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: getTransactionTypeColor(tx.transaction_type)
                  }}>
                    {tx.transaction_type === 'earn' ? '+' : ''}
                    {parseFloat(tx.amount).toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div style={{
            padding: '15px',
            borderTop: '1px solid #eee',
            display: 'flex',
            justifyContent: 'center',
            gap: '10px',
            alignItems: 'center'
          }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '5px 15px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: page === 1 ? '#f5f5f5' : 'white',
                cursor: page === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              上一页
            </button>
            <span>
              第 {page} / {totalPages} 页
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: '5px 15px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: page === totalPages ? '#f5f5f5' : 'white',
                cursor: page === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PointsHistory;





