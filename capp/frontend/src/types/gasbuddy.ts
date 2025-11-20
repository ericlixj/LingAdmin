// GasBuddy API Response Types
// Business Focus: Price & Location

export interface GasBuddyApiResponse {
  code: number;
  message: string;
  data: GasBuddyData | null;
}

export interface GasBuddyData {
  postcode: string;
  location: LocationInfo;
  trends: PriceTrends;
  stations: Station[];
}

// Location Information
export interface LocationInfo {
  countryCode: string;
  displayName: string;
  latitude: number;
  longitude: number;
  regionCode: string;
}

// Price Trends
export interface PriceTrends {
  areaName: string;
  country: string;
  today: number;        // Average price today
  todayLow: number;     // Lowest price today
  trend: "up" | "down" | "stable";
}

// Station (Business Focus: Price & Location)
export interface Station {
  id: string;
  name: string;
  
  // Location (Critical for business)
  address: StationAddress;
  distance: number;         // Distance from search location in km
  
  // Prices (Critical for business)
  prices: PriceInfo[];
  
  // Additional info
  brands?: Brand[];
  starRating?: number;
  ratingsCount?: number;
  payStatus?: {
    isPayAvailable: boolean;
  };
  hasActiveOutage?: boolean;
}

// Station Address
export interface StationAddress {
  line1: string;
  line2?: string | null;
  locality: string;         // City
  region: string;           // Province/State
  postalCode: string;
  country: string;
}

// Price Information (Critical for price comparison)
export interface PriceInfo {
  fuelProduct: number;     // 1=Regular, 2=Mid, 3=Premium, 4=Diesel
  cash?: PriceDetail;
  credit?: PriceDetail;
  discount?: number | null;
}

// Price Detail
export interface PriceDetail {
  nickname: string;         // Fuel grade name (e.g., "Regular", "Premium")
  price: number;            // Price per liter/gallon
  formattedPrice: string;   // Formatted string (e.g., "$1.50")
  postedTime: string;       // ISO 8601 timestamp
}

// Brand Information
export interface Brand {
  brandId: number;
  name: string;
  brandingType?: string;
  imageUrl?: string;
}

// Helper Types for Business Logic
export interface StationWithPrice extends Station {
  bestPrice?: {
    cash?: number;
    credit?: number;
    fuelType: string;
  };
}

export interface PriceComparison {
  stationId: string;
  stationName: string;
  address: string;
  distance: number;
  regularCashPrice?: number;
  regularCreditPrice?: number;
  premiumCashPrice?: number;
  premiumCreditPrice?: number;
  dieselPrice?: number;
}


