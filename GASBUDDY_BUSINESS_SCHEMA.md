# GasBuddy API - Business Schema (Price & Location Focus)

## Quick Reference for Price & Location Data

### API Response Structure

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "postcode": "V6Y1J5",
    "location": {
      "displayName": "Vancouver, BC",
      "latitude": 49.2827,
      "longitude": -123.1207,
      "regionCode": "BC"
    },
    "trends": {
      "today": 1.50,        // Average price in area
      "todayLow": 1.45,     // Cheapest price in area
      "trend": "up"
    },
    "stations": [
      {
        "id": "12345",
        "name": "Shell Station",
        "distance": 2.5,    // km from search location
        "address": {
          "line1": "123 Main Street",
          "locality": "Vancouver",
          "region": "BC",
          "postalCode": "V6Y 1J5"
        },
        "prices": [
          {
            "fuelProduct": 1,  // 1=Regular, 3=Premium, 4=Diesel
            "cash": {
              "price": 1.50,
              "formattedPrice": "$1.50",
              "postedTime": "2024-01-15T10:30:00Z"
            },
            "credit": {
              "price": 1.55,
              "formattedPrice": "$1.55",
              "postedTime": "2024-01-15T10:30:00Z"
            }
          }
        ]
      }
    ]
  }
}
```

## Key Fields for Business Logic

### 1. Price Comparison Fields

| Field Path | Type | Description | Use Case |
|------------|------|-------------|----------|
| `data.stations[].prices[].fuelProduct` | number | Fuel type (1=Regular, 3=Premium, 4=Diesel) | Filter by fuel type |
| `data.stations[].prices[].cash.price` | number | Cash price per liter | Compare cash prices |
| `data.stations[].prices[].credit.price` | number | Credit price per liter | Compare credit prices |
| `data.trends.today` | number | Area average price | Compare against average |
| `data.trends.todayLow` | number | Area lowest price | Find best deals |

### 2. Location Fields

| Field Path | Type | Description | Use Case |
|------------|------|-------------|----------|
| `data.stations[].distance` | number | Distance in km | Filter by proximity |
| `data.stations[].address.line1` | string | Street address | Display location |
| `data.stations[].address.locality` | string | City name | Group by city |
| `data.stations[].address.region` | string | Province/State | Filter by region |
| `data.stations[].address.postalCode` | string | Postal code | Exact location match |
| `data.location.latitude` | number | Search area lat | Map center |
| `data.location.longitude` | number | Search area lng | Map center |

## Common Business Queries

### 1. Find Cheapest Station
```javascript
const cheapest = stations
  .flatMap(s => s.prices.map(p => ({
    station: s,
    price: p.cash?.price || p.credit?.price,
    fuelType: p.fuelProduct
  })))
  .filter(p => p.price !== undefined)
  .sort((a, b) => a.price - b.price)[0];
```

### 2. Stations Within 5km, Sorted by Price
```javascript
const nearbyCheapest = stations
  .filter(s => s.distance <= 5)
  .flatMap(s => s.prices.map(p => ({
    ...s,
    price: p.cash?.price || p.credit?.price,
    fuelType: p.fuelProduct
  })))
  .filter(p => p.price !== undefined)
  .sort((a, b) => a.price - b.price);
```

### 3. Price Comparison Table
```javascript
const priceTable = stations.map(s => ({
  name: s.name,
  address: `${s.address.line1}, ${s.address.locality}`,
  distance: s.distance,
  regularCash: s.prices.find(p => p.fuelProduct === 1)?.cash?.price,
  regularCredit: s.prices.find(p => p.fuelProduct === 1)?.credit?.price,
  premiumCash: s.prices.find(p => p.fuelProduct === 3)?.cash?.price,
  premiumCredit: s.prices.find(p => p.fuelProduct === 3)?.credit?.price,
}));
```

### 4. Best Price vs Area Average
```javascript
stations.forEach(station => {
  const regularPrice = station.prices.find(p => p.fuelProduct === 1)?.cash?.price;
  if (regularPrice && regularPrice < trends.today) {
    const savings = trends.today - regularPrice;
    console.log(`${station.name}: $${savings.toFixed(2)} cheaper than average`);
  }
});
```

## Fuel Type Codes

| Code | Fuel Type |
|------|-----------|
| 1 | Regular/Unleaded |
| 2 | Mid-grade |
| 3 | Premium |
| 4 | Diesel |

## Price Units

- **Canada**: Price per liter (CAD)
- **USA**: Price per gallon (USD)

## Distance Units

- All distances are in **kilometers (km)**

## Example: Complete Station Object

```json
{
  "id": "12345",
  "name": "Shell Station",
  "distance": 2.5,
  "address": {
    "line1": "123 Main Street",
    "locality": "Vancouver",
    "region": "BC",
    "postalCode": "V6Y 1J5",
    "country": "CA"
  },
  "prices": [
    {
      "fuelProduct": 1,
      "cash": {
        "price": 1.50,
        "formattedPrice": "$1.50",
        "postedTime": "2024-01-15T10:30:00Z"
      },
      "credit": {
        "price": 1.55,
        "formattedPrice": "$1.55",
        "postedTime": "2024-01-15T10:30:00Z"
      }
    },
    {
      "fuelProduct": 3,
      "cash": {
        "price": 1.70,
        "formattedPrice": "$1.70",
        "postedTime": "2024-01-15T10:30:00Z"
      },
      "credit": {
        "price": 1.75,
        "formattedPrice": "$1.75",
        "postedTime": "2024-01-15T10:30:00Z"
      }
    }
  ],
  "brands": [
    {
      "name": "Shell"
    }
  ],
  "starRating": 4.5,
  "ratingsCount": 120
}
```


