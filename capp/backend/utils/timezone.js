// utils/timezone.js
const { query } = require('./db');

/**
 * 根据邮编获取对应的时区
 * @param {string} postcode - 邮编
 * @returns {string} - IANA 时区名，如 'America/Vancouver'
 */
async function getTimezoneByPostcode(postcode) {
  try {
    const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();
    
    // 加拿大省份代码到时区的映射
    const CANADA_PROVINCE_TIMEZONE_MAP = {
      "BC": "America/Vancouver",  // 不列颠哥伦比亚省 - 太平洋时区
      "AB": "America/Edmonton",   // 阿尔伯塔省 - 山地时区
      "SK": "America/Regina",     // 萨斯喀彻温省 - 中部时区（全年标准时间）
      "MB": "America/Winnipeg",   // 马尼托巴省 - 中部时区
      "ON": "America/Toronto",    // 安大略省 - 东部时区
      "QC": "America/Montreal",   // 魁北克省 - 东部时区
      "NB": "America/Moncton",    // 新不伦瑞克省 - 大西洋时区
      "NS": "America/Halifax",    // 新斯科舍省 - 大西洋时区
      "PE": "America/Halifax",    // 爱德华王子岛省 - 大西洋时区
      "NL": "America/St_Johns",   // 纽芬兰与拉布拉多省 - 纽芬兰时区
      "YT": "America/Whitehorse", // 育空地区 - 山地时区
      "NT": "America/Yellowknife", // 西北地区 - 山地时区
      "NU": "America/Iqaluit",    // 努纳武特地区 - 东部时区
      "DEFAULT": "America/Toronto"
    };
    
    // 尝试从数据库查询 region_code
    const postcodeResult = await query(
      `SELECT region_code 
       FROM gas_postcode 
       WHERE postcode = $1 AND deleted = false
       LIMIT 1`,
      [cleanPostcode]
    );
    
    if (postcodeResult.rows.length > 0 && postcodeResult.rows[0].region_code) {
      const regionCode = postcodeResult.rows[0].region_code.toUpperCase();
      const timezoneName = CANADA_PROVINCE_TIMEZONE_MAP[regionCode];
      if (timezoneName) {
        return timezoneName;
      }
    }
    
    // 如果没有找到，尝试根据邮编前缀判断（加拿大邮编格式：A0A 0A0）
    if (cleanPostcode) {
      const firstChar = cleanPostcode[0];
      if (firstChar === 'V') {
        return "America/Vancouver";  // BC
      } else if (['T', 'S', 'R'].includes(firstChar)) {
        return "America/Edmonton";  // AB/SK/MB
      } else if (['K', 'L', 'M', 'N', 'P', 'G', 'H', 'J'].includes(firstChar)) {
        return "America/Toronto";  // ON/QC
      } else if (['A', 'B', 'C', 'E'].includes(firstChar)) {
        return "America/Halifax";  // 大西洋省份
      } else if (firstChar === 'Y') {
        return "America/Whitehorse";  // YT
      }
    }
    
    // 默认返回东部时区
    return CANADA_PROVINCE_TIMEZONE_MAP["DEFAULT"];
  } catch (error) {
    console.error(`[ERROR] Failed to determine timezone for postcode ${postcode}:`, error);
    // 如果出错，对于V开头的邮编，默认返回America/Vancouver
    const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();
    if (cleanPostcode && cleanPostcode[0] === 'V') {
      return "America/Vancouver";
    }
    return "America/Toronto";
  }
}

/**
 * 格式化时间，将 UTC 时间转换为指定时区
 * @param {string|Date} dt - 时间字符串或 Date 对象（UTC 时间）
 * @param {string} timezone - IANA 时区名，如 'America/Vancouver'
 * @returns {string} - 格式化后的时间字符串，格式：yyyy-MM-dd HH:mm:ss
 */
function formatDateTime(dt, timezone) {
  if (!dt) {
    return "N/A";
  }
  
  try {
    let dtObj;
    
    // 如果是字符串，尝试解析
    if (typeof dt === 'string') {
      // 尝试多种格式
      const formats = [
        /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})\.(\d+)$/,  // 2025-12-30 02:02:43.56105
        /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/,          // 2025-12-30 02:02:43
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d+)$/,    // 2025-12-30T02:02:43.56105
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/,            // 2025-12-30T02:02:43
      ];
      
      let matched = false;
      for (const format of formats) {
        const match = dt.match(format);
        if (match) {
          const [, year, month, day, hour, minute, second, microsecond] = match;
          // 创建 UTC 时间的 Date 对象
          dtObj = new Date(Date.UTC(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hour),
            parseInt(minute),
            parseInt(second),
            microsecond ? parseInt(microsecond.substring(0, 3)) : 0
          ));
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        // 尝试直接解析
        dtObj = new Date(dt);
        if (isNaN(dtObj.getTime())) {
          return String(dt);
        }
      }
    } else if (dt instanceof Date) {
      dtObj = dt;
    } else {
      return String(dt);
    }
    
    // 转换为目标时区
    if (timezone) {
      // 使用 Intl.DateTimeFormat 来转换时区
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      // 格式化时间
      const parts = formatter.formatToParts(dtObj);
      const year = parts.find(p => p.type === 'year').value;
      const month = parts.find(p => p.type === 'month').value;
      const day = parts.find(p => p.type === 'day').value;
      const hour = parts.find(p => p.type === 'hour').value;
      const minute = parts.find(p => p.type === 'minute').value;
      const second = parts.find(p => p.type === 'second').value;
      
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    } else {
      // 如果没有指定时区，使用 UTC
      const year = dtObj.getUTCFullYear();
      const month = String(dtObj.getUTCMonth() + 1).padStart(2, '0');
      const day = String(dtObj.getUTCDate()).padStart(2, '0');
      const hour = String(dtObj.getUTCHours()).padStart(2, '0');
      const minute = String(dtObj.getUTCMinutes()).padStart(2, '0');
      const second = String(dtObj.getUTCSeconds()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    }
  } catch (error) {
    console.error(`[ERROR] Failed to format datetime ${dt}:`, error);
    return String(dt);
  }
}

module.exports = {
  getTimezoneByPostcode,
  formatDateTime
};

