export interface SubService {
  name: string;
  description: string;
  price: number;
  uploadPicture?: string;
  /** Transient — only used client-side for pre-upload preview; never sent to API */
  file?: File;
  /** Transient — object URL for image preview display */
  previewUrl?: string;
}

export interface TimeWindow {
  startTime: string;
  endTime: string;
}

export interface DayAvailability {
  dayOfWeek: number;
  isAvailable: boolean;
  timeWindows: TimeWindow[];
}

export interface AvailabilityPeriod {
  type: 'unlimited' | 'dateRange' | 'rollingWeeks';
  startDate?: string;
  endDate?: string;
  weeksAhead?: number;
}

export interface BookingAvailability {
  daysAvailable: DayAvailability[];
  slotDurationMinutes: number;
  concurrentProviders: number;
  availabilityPeriod: AvailabilityPeriod;
  timezone: string;
}

export interface FormData {
  name: string; 
  description: string;
  industryId: string;
  categoryId: string;
  category: string;
  itemType: 'product' | 'service';
  sku: string;
  upc: string;
  platformUniqueCode: string;
  totalAvailableQuantity: number;
  priceInNaira: number;
  discountPercentage: number;
  upfrontPaymentPercentage: number;
  platformChargePercentage: number;
  platformCommissionId?: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  visibilityToPublic: boolean;
  notes: string;
  locationIndex: number;
  // Service-specific fields
  producer: string;
  totalAvailableServiceProviders: number;
  hasSubServices: boolean;
  subServices: SubService[];
  bookingAvailability: BookingAvailability;
}

export interface Industry {
  value: string;
  label: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface PlatformCommission {
  id: string;
  commissionName: string;
  commissionRate: number;
  industryId: string;
  categoryId: string;
}

export interface PlatformCodePreview {
  platformUniqueCode: string;
  orgProductNumber: string;
  globalProductNumber: string;
}

// Export type for DAY_NAMES constant
export type DayName = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
