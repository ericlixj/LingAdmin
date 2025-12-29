// PointsDisplay.jsx
import { useState, useEffect, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function PointsDisplay({ userId, onClick }) {
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [displayBalance, setDisplayBalance] = useState(0); // 用于动画显示的积分值
  const [isAnimating, setIsAnimating] = useState(false); // 是否正在播放动画
  const [changeDirection, setChangeDirection] = useState(null); // 'up' 或 'down'
  const prevBalanceRef = useRef(0); // 上一次的积分值
  const intervalRef = useRef(null); // 定时器引用

  useEffect(() => {
    if (userId) {
      fetchPoints();
      // 设置定时轮询，每3秒检查一次积分变化
      intervalRef.current = setInterval(() => {
        fetchPoints(true); // true 表示静默更新，不显示加载状态
      }, 3000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userId]);

  const fetchPoints = async (silent = false) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/c/points`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.code === 0) {
        const newBalance = parseFloat(result.data.balance || 0);
        const oldBalance = prevBalanceRef.current;
        
        // 检查积分是否变化
        if (oldBalance !== 0 && Math.abs(newBalance - oldBalance) > 0.01) {
          // 积分变化，触发动画
          setChangeDirection(newBalance > oldBalance ? 'up' : 'down');
          setIsAnimating(true);
          
          // 数字滚动动画
          animateNumber(oldBalance, newBalance);
          
          // 动画结束后重置状态
          setTimeout(() => {
            setIsAnimating(false);
            setChangeDirection(null);
          }, 1200);
        }
        
        setPoints(result.data);
        prevBalanceRef.current = newBalance;
        if (!silent) {
          setDisplayBalance(newBalance);
        }
      }
    } catch (err) {
      console.error('Fetch points error:', err);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // 数字滚动动画
  const animateNumber = (from, to) => {
    const duration = 1000; // 动画持续时间（毫秒）
    const startTime = Date.now();
    const difference = to - from;
    const steps = Math.abs(difference);
    const stepDuration = duration / Math.max(steps, 1);
    
    let currentStep = 0;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 使用缓动函数（easeOutCubic）让动画更自然
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = from + difference * easeOutCubic;
      
      // 确保显示整数
      const roundedValue = Math.round(currentValue);
      setDisplayBalance(roundedValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayBalance(to);
      }
    };
    
    animate();
  };

  // 初始化显示值
  useEffect(() => {
    if (points) {
      const balance = parseFloat(points.balance || 0);
      if (displayBalance === 0) {
        setDisplayBalance(balance);
        prevBalanceRef.current = balance;
      }
    }
  }, [points]);

  const balance = points ? parseFloat(points.balance || 0) : 0;
  const finalDisplayBalance = displayBalance || balance;

  // 如果还在加载或没有数据，显示占位符而不是返回 null
  if (loading || !points) {
    return (
      <div 
        onClick={(e) => {
          if (onClick && typeof onClick === 'function') {
            e.preventDefault();
            e.stopPropagation();
            onClick(e);
          }
        }}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.3rem',
          padding: '0.3rem 0.6rem',
          backgroundColor: '#f0f0f0',
          borderRadius: '12px',
          border: '1px solid #ddd',
          color: '#999',
          fontSize: '0.85rem',
          cursor: onClick ? 'pointer' : 'default'
        }}
      >
        <span>💰</span>
        <span>加载中...</span>
      </div>
    );
  }

  return (
    <>
      <div 
        onClick={(e) => {
          console.log('[DEBUG] PointsDisplay clicked, onClick:', typeof onClick);
          e.preventDefault();
          e.stopPropagation();
          if (onClick && typeof onClick === 'function') {
            console.log('[DEBUG] Calling onClick handler');
            onClick(e);
          } else {
            console.log('[DEBUG] No onClick handler provided or not a function');
          }
        }}
        className={`points-display ${isAnimating ? `animate-${changeDirection}` : ''}`}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.3rem',
          padding: '0.3rem 0.6rem',
          backgroundColor: '#fff3cd',
          borderRadius: '12px',
          cursor: onClick ? 'pointer' : 'default',
          border: '1px solid #ffc107',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'visible',
          whiteSpace: 'nowrap', // 防止整个容器内容换行
          flexShrink: 0, // 防止被压缩
          userSelect: 'none', // 防止文本选择
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
      >
        <span 
          className="points-icon"
          style={{ 
            fontSize: '0.9rem',
            display: 'inline-block',
            transition: 'transform 0.3s ease',
            pointerEvents: 'none' // 防止图标阻止点击事件
          }}
        >
          💰
        </span>
        <span 
          className="points-value"
          style={{ 
            fontWeight: 'bold', 
            color: '#ff6b35', 
            fontSize: '0.85rem',
            display: 'inline-block',
            whiteSpace: 'nowrap', // 防止文本换行
            textAlign: 'left',
            pointerEvents: 'none' // 防止文本阻止点击事件
          }}
        >
          {finalDisplayBalance.toFixed(0)} 积分
        </span>
        {isAnimating && changeDirection === 'up' && (
          <span 
            className="points-badge"
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              backgroundColor: '#52c41a',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              animation: 'badgePop 0.5s ease-out',
              zIndex: 10,
              pointerEvents: 'none' // 防止徽章阻止点击事件
            }}
          >
            +
          </span>
        )}
      </div>
      <style>{`
        @keyframes pointsUp {
          0% {
            transform: scale(1) translateY(0);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          25% {
            transform: scale(1.1) translateY(-3px);
            box-shadow: 0 6px 16px rgba(82, 196, 26, 0.5);
          }
          50% {
            transform: scale(1.15) translateY(-5px);
            box-shadow: 0 8px 20px rgba(82, 196, 26, 0.6);
          }
          75% {
            transform: scale(1.1) translateY(-3px);
            box-shadow: 0 6px 16px rgba(82, 196, 26, 0.5);
          }
          100% {
            transform: scale(1) translateY(0);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
        }
        
        @keyframes pointsDown {
          0% {
            transform: scale(1);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          50% {
            transform: scale(0.95);
            box-shadow: 0 2px 4px rgba(255, 77, 79, 0.3);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
        }
        
        @keyframes badgePop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.3);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes iconBounce {
          0%, 100% {
            transform: rotate(0deg) scale(1);
          }
          20% {
            transform: rotate(-15deg) scale(1.3);
          }
          40% {
            transform: rotate(15deg) scale(1.3);
          }
          60% {
            transform: rotate(-10deg) scale(1.2);
          }
          80% {
            transform: rotate(10deg) scale(1.2);
          }
        }
        
        @keyframes valueGlow {
          0%, 100% {
            text-shadow: 0 0 5px rgba(82, 196, 26, 0.5);
          }
          50% {
            text-shadow: 0 0 15px rgba(82, 196, 26, 0.8), 0 0 25px rgba(82, 196, 26, 0.6);
          }
        }
        
        .points-display.animate-up {
          animation: pointsUp 0.8s ease-out;
          background-color: #f6ffed;
          border-color: #52c41a;
        }
        
        .points-display.animate-up .points-icon {
          animation: iconBounce 0.6s ease-out;
        }
        
        .points-display.animate-up .points-value {
          color: #52c41a;
          font-weight: 900;
          animation: valueGlow 1s ease-out;
        }
        
        .points-display.animate-down {
          animation: pointsDown 0.6s ease-out;
        }
        
        .points-display.animate-down .points-value {
          color: #ff4d4f;
        }
        
        .points-display:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
      `}</style>
    </>
  );
}

export default PointsDisplay;





