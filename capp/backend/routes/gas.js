// routes/gas.js
const express = require('express');
const { query } = require('../utils/db');
const { authenticateToken } = require('../utils/jwt');

const router = express.Router();

/**
 * 获取加油站数据
 * GET /api/c/gas?postcode=V6Y1J5&maxDistance=5
 * 
 * 查询逻辑：
 * 1. 根据 postcode 查找 gas_postcode 表获取坐标
 * 2. 查询 gas_station 和 gas_price 表，获取最新价格
 * 3. 计算距离（如果 postcode 有坐标）
 * 4. 按距离和价格排序
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { postcode, maxDistance = 5 } = req.query;

    if (!postcode) {
      return res.status(400).json({
        code: 1,
        message: 'postcode 参数不能为空',
        data: null
      });
    }

    // 格式化 postcode
    const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();

    // 1. 获取 postcode 的坐标
    const postcodeResult = await query(
      `SELECT latitude, longitude 
       FROM gas_postcode 
       WHERE postcode = $1 AND deleted = false
       LIMIT 1`,
      [cleanPostcode]
    );

    let postcodeLat = null;
    let postcodeLng = null;
    if (postcodeResult.rows.length > 0) {
      const pc = postcodeResult.rows[0];
      if (pc.latitude && pc.longitude) {
        postcodeLat = parseFloat(pc.latitude);
        postcodeLng = parseFloat(pc.longitude);
      }
    }

    // 2. 查询该 postcode 下的所有加油站
    // 获取每个加油站的最新价格（按 crawl_time 排序）
    const stationsResult = await query(
      `SELECT 
         gs.id,
         gs.station_id,
         gs.name,
         gs.distance,
         gs.address,
         gs.postcode,
         gp.latitude as postcode_lat,
         gp.longitude as postcode_lng,
         (
           SELECT gp2.cash_price
           FROM gas_price gp2
           WHERE gp2.station_id = gs.station_id
             AND gp2.postcode = $1
             AND gp2.fuel_product = 1
             AND gp2.deleted = false
           ORDER BY gp2.crawl_time DESC
           LIMIT 1
         ) as latest_price,
         (
           SELECT gp2.cash_formatted_price
           FROM gas_price gp2
           WHERE gp2.station_id = gs.station_id
             AND gp2.postcode = $1
             AND gp2.fuel_product = 1
             AND gp2.deleted = false
           ORDER BY gp2.crawl_time DESC
           LIMIT 1
         ) as latest_formatted_price
       FROM gas_station gs
       LEFT JOIN gas_postcode gp ON gp.postcode = $1 AND gp.deleted = false
       WHERE gs.postcode = $1
         AND gs.deleted = false
       GROUP BY gs.id, gs.station_id, gs.name, gs.distance, gs.address, gs.postcode, gp.latitude, gp.longitude
       ORDER BY gs.station_id`,
      [cleanPostcode]
    );

    // 3. 处理距离计算和过滤
    const stations = stationsResult.rows.map(station => {
      let distance = null;
      
      // 如果 station 有 distance 字段且不为空，使用它
      if (station.distance && station.distance !== '0' && station.distance !== '') {
        distance = parseFloat(station.distance);
      } else if (postcodeLat && postcodeLng && station.postcode_lat && station.postcode_lng) {
        // 否则计算距离（Haversine 公式）
        const stationLat = parseFloat(station.postcode_lat);
        const stationLng = parseFloat(station.postcode_lng);
        distance = calculateDistance(postcodeLat, postcodeLng, stationLat, stationLng);
      }

      return {
        id: station.station_id,
        name: station.name,
        address: station.address,
        distance: distance,
        price: station.latest_price ? parseFloat(station.latest_price) : null,
        formatted_price: station.latest_formatted_price,
        postcode: station.postcode
      };
    });

    // 4. 过滤距离（如果指定了 maxDistance）
    let filteredStations = stations;
    if (maxDistance && !isNaN(parseFloat(maxDistance))) {
      const maxDist = parseFloat(maxDistance);
      filteredStations = stations.filter(s => s.distance === null || s.distance <= maxDist);
    }

    // 5. 排序：先按价格（有价格的在前，价格低的在前），然后按距离
    filteredStations.sort((a, b) => {
      // 有价格的优先
      if (a.price !== null && b.price === null) return -1;
      if (a.price === null && b.price !== null) return 1;
      
      // 如果都有价格，按价格升序
      if (a.price !== null && b.price !== null) {
        if (a.price !== b.price) {
          return a.price - b.price;
        }
      }
      
      // 价格相同或都没有价格，按距离升序
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      if (a.distance !== null && b.distance === null) return -1;
      if (a.distance === null && b.distance !== null) return 1;
      
      return 0;
    });

    res.json({
      code: 0,
      message: 'ok',
      data: {
        postcode: cleanPostcode,
        stations: filteredStations,
        total: filteredStations.length
      }
    });
  } catch (error) {
    console.error('[ERROR] Get gas stations error:', error);
    res.status(500).json({
      code: 1,
      message: '获取加油站数据失败: ' + error.message,
      data: null
    });
  }
});

/**
 * Haversine 公式计算两点间距离（公里）
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 地球半径（公里）
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

module.exports = router;

