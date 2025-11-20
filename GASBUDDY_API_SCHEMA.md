# GasBuddy API Response Schema

## API Endpoint
```
GET /api/c/gasbuddy?postcode={postcode}
```

## Response Structure

### Success Response
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "postcode": "V6Y1J5",
    "location": {
      "countryCode": "CA",
      "displayName": "Vancouver, BC",
      "latitude": 49.2827,
      "longitude": -123.1207,
      "regionCode": "BC"
    },
    "trends": {
      "areaName": "Vancouver",
      "country": "CA",
      "today": 1.50,
      "todayLow": 1.45,
      "trend": "up"
    },
    "stations": [
      {
        "id": "12345",
        "name": "Shell Station",
        "distance": 2.5,
        "address": {
          "line1": "123 Main Street",
          "line2": null,
          "locality": "Vancouver",
          "region": "BC",
          "postalCode": "V6Y 1J5",
          "country": "CA",
          "__typename": "Address"
        },
        "prices": [
          {
            "fuelProduct": 1,
            "cash": {
              "nickname": "Regular",
              "price": 1.50,
              "formattedPrice": "$1.50",
              "postedTime": "2024-01-15T10:30:00Z",
              "__typename": "Price"
            },
            "credit": {
              "nickname": "Regular",
              "price": 1.55,
              "formattedPrice": "$1.55",
              "postedTime": "2024-01-15T10:30:00Z",
              "__typename": "Price"
            },
            "discount": null,
            "__typename": "PriceInfo"
          }
        ],
        "brands": [
          {
            "brandId": 1,
            "name": "Shell",
            "brandingType": "primary",
            "imageUrl": "https://...",
            "__typename": "Brand"
          }
        ],
        "starRating": 4.5,
        "ratingsCount": 120,
        "distance": 2.5,
        "fuels": [1, 2, 3],
        "hasActiveOutage": false,
        "isFuelmanSite": false,
        "enterprise": null,
        "payStatus": {
          "isPayAvailable": true,
          "__typename": "PayStatus"
        },
        "emergencyStatus": {
          "hasGas": {
            "nickname": "Regular",
            "reportStatus": "available",
            "updateDate": "2024-01-15T10:30:00Z",
            "__typename": "FuelStatus"
          },
          "hasDiesel": null,
          "hasPower": null,
          "__typename": "EmergencyStatus"
        },
        "offers": [],
        "__typename": "Station"
      }
    ]
  }
}
```

### Error Response
```json
{
  "code": 1,
  "message": "Error message",
  "data": null
}
```

## Data Schema Details

### Root Object
| Field | Type | Description |
|-------|------|-------------|
| `code` | integer | Response code (0 = success, non-zero = error) |
| `message` | string | Response message |
| `data` | object | Response data (null on error) |

### Data Object
| Field | Type | Description |
|-------|------|-------------|
| `postcode` | string | Search postal code (e.g., "V6Y1J5") |
| `location` | Location | Location information for the postal code |
| `trends` | Trends | Price trend information |
| `stations` | array[Station] | List of gas stations |

### Location Object
| Field | Type | Description |
|-------|------|-------------|
| `countryCode` | string | Country code (e.g., "CA") |
| `displayName` | string | Display name (e.g., "Vancouver, BC") |
| `latitude` | float | Latitude coordinate |
| `longitude` | float | Longitude coordinate |
| `regionCode` | string | Region/Province code (e.g., "BC") |

### Trends Object
| Field | Type | Description |
|-------|------|-------------|
| `areaName` | string | Area name |
| `country` | string | Country code |
| `today` | float | Today's average price |
| `todayLow` | float | Today's lowest price |
| `trend` | string | Price trend ("up", "down", "stable") |

### Station Object (Business Focus: Price & Location)
| Field | Type | Description | Business Importance |
|-------|------|-------------|---------------------|
| `id` | string | Unique station ID | ⭐ High |
| `name` | string | Station name | ⭐ High |
| **`address`** | **Address** | **Station address** | **⭐⭐ Critical** |
| **`prices`** | **array[PriceInfo]** | **Fuel prices** | **⭐⭐ Critical** |
| `distance` | float | Distance from search location (km) | ⭐ High |
| `latitude` | float | Station latitude (if available) | ⭐ High |
| `longitude` | float | Station longitude (if available) | ⭐ High |
| `brands` | array[Brand] | Station brands | Medium |
| `starRating` | float | Average rating (0-5) | Medium |
| `ratingsCount` | integer | Number of ratings | Low |
| `payStatus` | PayStatus | Payment availability | Low |
| `hasActiveOutage` | boolean | Whether station has active outage | Low |

### Address Object
| Field | Type | Description |
|-------|------|-------------|
| `line1` | string | Street address line 1 |
| `line2` | string \| null | Street address line 2 |
| `locality` | string | City name |
| `region` | string | Province/State code |
| `postalCode` | string | Postal code |
| `country` | string | Country code |

### PriceInfo Object (Business Focus: Price Comparison)
| Field | Type | Description | Business Importance |
|-------|------|-------------|---------------------|
| `fuelProduct` | integer | Fuel type ID (1=Regular, 2=Mid, 3=Premium, etc.) | ⭐ High |
| **`cash`** | **Price** | **Cash price** | **⭐⭐ Critical** |
| **`credit`** | **Price** | **Credit card price** | **⭐⭐ Critical** |
| `discount` | float \| null | Discount amount | Medium |

### Price Object
| Field | Type | Description |
|-------|------|-------------|
| `nickname` | string | Fuel grade name (e.g., "Regular", "Premium") |
| `price` | float | Price per liter/gallon |
| `formattedPrice` | string | Formatted price string (e.g., "$1.50") |
| `postedTime` | string | ISO 8601 timestamp when price was posted |

### Brand Object
| Field | Type | Description |
|-------|------|-------------|
| `brandId` | integer | Brand ID |
| `name` | string | Brand name (e.g., "Shell", "Esso") |
| `brandingType` | string | Branding type |
| `imageUrl` | string | Brand logo URL |

## Business-Focused Simplified Schema

For price comparison and location-based queries, here's a simplified view:

```typescript
interface GasBuddyResponse {
  code: number;
  message: string;
  data: {
    postcode: string;
    location: {
      displayName: string;
      latitude: number;
      longitude: number;
      regionCode: string;
    };
    trends: {
      today: number;        // Average price today
      todayLow: number;     // Lowest price today
      trend: "up" | "down" | "stable";
    };
    stations: Station[];
  };
}

interface Station {
  id: string;
  name: string;
  
  // Location (Critical for business)
  address: {
    line1: string;
    locality: string;
    region: string;
    postalCode: string;
  };
  distance: number;         // Distance from search location
  latitude?: number;        // Station coordinates (if available)
  longitude?: number;
  
  // Prices (Critical for business)
  prices: PriceInfo[];
  
  // Additional info
  brands: Array<{ name: string }>;
  starRating?: number;
}

interface PriceInfo {
  fuelProduct: number;      // 1=Regular, 2=Mid, 3=Premium
  cash: {
    price: number;
    formattedPrice: string;
    postedTime: string;
  };
  credit: {
    price: number;
    formattedPrice: string;
    postedTime: string;
  };
}
```

## Example Use Cases

### 1. Price Comparison by Location
```javascript
// Find cheapest station near postal code
const stations = response.data.stations;
const cheapest = stations
  .filter(s => s.prices.length > 0)
  .sort((a, b) => {
    const priceA = a.prices[0].cash?.price || Infinity;
    const priceB = b.prices[0].cash?.price || Infinity;
    return priceA - priceB;
  })[0];
```

### 2. Stations Within Distance
```javascript
// Find stations within 5km
const nearbyStations = response.data.stations
  .filter(s => s.distance <= 5)
  .sort((a, b) => a.distance - b.distance);
```

### 3. Price Trend Analysis
```javascript
// Compare current prices with area trends
const trend = response.data.trends;
const stations = response.data.stations;
stations.forEach(station => {
  const stationPrice = station.prices[0]?.cash?.price;
  if (stationPrice < trend.todayLow) {
    console.log(`${station.name} has best price: $${stationPrice}`);
  }
});
```

## Notes

1. **Price Units**: Prices are typically in the local currency per liter (Canada) or per gallon (USA)
2. **Distance**: Distance is in kilometers from the search postal code location
3. **Coordinates**: Station latitude/longitude may not always be available in the response
4. **Fuel Types**: Common fuelProduct values:
   - 1 = Regular/Unleaded
   - 2 = Mid-grade
   - 3 = Premium
   - 4 = Diesel
5. **Price Timestamps**: `postedTime` indicates when the price was last updated
6. **Multiple Prices**: A station can have multiple price entries for different fuel types


