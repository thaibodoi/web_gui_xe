// Base URL từ biến môi trường hoặc giá trị mặc định
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// Các endpoint cụ thể
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT:'/auth/logout',
    MY_INFO: '/auth/my-info'
  },
  
  // Parking
  PARKING: {
    VEHICLE_TYPES: '/parking/vehicle-types',
    ENTRY: '/parking/entry',
    EXIT: '/parking/exit',
    RECORDS: '/parking/records',
    RECORD_HISTORY: '/parking/record-history',
    TODAY: '/parking/today',
  },

  // Monthly cards
  MONTHLY_CARDS: {
    REGISTER: '/monthly-cards',
    ACTIVE: '/monthly-cards/active',
    EXPIRE: '/monthly-cards/expire',
    DETAIL: (id: string) => `/monthly-cards/${id}`,
  },

  // Missing reports
  MISSING_REPORTS: '/missing-reports',

  // Payments
  PAYMENTS: {
    ALL: '/payments',
    AT_DATE: '/payments/at-date',
    BY_ID: (id: string) => `/payments/${id}`,
  },

  // Prices
  PRICES: {
    ALL: '/prices',
    BY_ID: (id: string) => `/prices/${id}`,
  },

  // Statistics
  STATISTICS: {
    REVENUE: '/statistic/revenue',
    TRAFFIC: '/statistic/traffic',
  },

  // Admin
  ADMIN: {
    STAFFS: '/admin/staffs',
    STAFF_DETAIL: (id: string) => `/admin/staffs/${id}`,
  },
};

// Helper function để xây dựng URL đầy đủ
export const buildApiUrl = (endpoint: string, queryParams?: Record<string, string | number | boolean>): string => {
  let url = `${API_BASE_URL}${endpoint}`;
  
  if (queryParams && Object.keys(queryParams).length > 0) {
    const queryString = Object.entries(queryParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');
    url += `?${queryString}`;
  }
  
  return url;
};