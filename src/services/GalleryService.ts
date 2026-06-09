


import { routes } from './apiRoutes';
import { BASE_URL } from '@/config/api';

console.log('GalleryService: Imported routes object:', routes);

// Service-specific interfaces
interface SubService {
  name: string;
  description: string;
  price: number;
}

interface TimeWindow {
  startTime: string;
  endTime: string;
}

interface DayAvailability {
  dayOfWeek: number;
  isAvailable: boolean;
  timeWindows: TimeWindow[];
}

interface AvailabilityPeriod {
  type: 'unlimited' | 'dateRange' | 'rollingWeeks';
  startDate?: string;
  endDate?: string;
  weeksAhead?: number;
}

interface BookingAvailability {
  daysAvailable: DayAvailability[];
  slotDurationMinutes: number;
  concurrentProviders: number;
  availabilityPeriod: AvailabilityPeriod;
  timezone: string;
}

interface Availability {
  type: 'unlimited' | 'dateRange';
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

// Updated interface with all required fields
interface GalleryItemCreateData {
   name: string; 
  description: string;
  category: string;
  categoryName?: string;
  industryName?: string;  
  categoryId: string;        
  industryId: string;       
  itemType: 'product' | 'service'; 
  sku?: string;
  upc?: string;
  platformUniqueCode?: string;
  totalAvailableQuantity?: number;
  priceInDollars?: number;
  discountPercentage?: number;
  upfrontPaymentPercentage?: number; 
  platformChargePercentage?: number; 
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  visibilityToPublic?: boolean;
  notes?: string;
  locationIndex?: number;
  // Service-specific fields
  producer?: string;
  totalAvailableServiceProviders?: number;
  hasSubServices?: boolean;
  subServiceCount?: number;
  subServices?: SubService[];
  availability?: Availability;
  bookingAvailability?: BookingAvailability;
}

interface LocationUsage {
  locationIndex: number;
  locationName: string;
  images: number;
  maxImages: number;
  videos: number;
  maxVideos: number;
  verified: boolean;
}

interface GalleryItemsResponse {
  success: boolean;
  data: {
    items: GalleryItem[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
    locationUsage: LocationUsage[];
  };
  message: string;
}

interface GalleryItemUpdateData {
   name: string; 
  description?: string;
  category?: string;
  categoryId?: string;
  industryId?: string;
  itemType?: 'product' | 'service';
  sku?: string;
  upc?: string;
  platformUniqueCode?: string;
  totalAvailableQuantity?: number;
  priceInDollars?: number;
  discountPercentage?: number;
  upfrontPaymentPercentage?: number;
  platformChargePercentage?: number;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  visibilityToPublic?: boolean;
  notes?: string;
  locationIndex?: number;
  // Service-specific fields
  producer?: string;
  totalAvailableServiceProviders?: number;
  hasSubServices?: boolean;
  subServiceCount?: number;
  subServices?: SubService[];
  availability?: Availability;
  bookingAvailability?: BookingAvailability;
}

interface GalleryItem {
  _id: string;
   name: string; 
  description: string;
  category: string;
  industryName?: string;  
  categoryName?: string;
  categoryId: string;
  industryId: string;
  itemType: 'product' | 'service';
  sku?: string;
  upc?: string;
  platformUniqueCode?: string;
  totalAvailableQuantity: number;
  priceInDollars: number;
  discountPercentage: number;
  upfrontPaymentPercentage?: number;
  platformChargePercentage: number;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  visibilityToPublic: boolean;
  notes?: string;
  locationIndex: number;
  images: string[];
  videos: string[];
  createdAt: string;
  updatedAt: string;
  // Service-specific fields
  producer?: string;
  totalAvailableServiceProviders?: number;
  hasSubServices?: boolean;
  subServiceCount?: number;
  subServices?: SubService[];
  availability?: Availability;
  bookingAvailability?: BookingAvailability;
}

interface Category {
  name: string;
  count: number;
}

interface PaginationResponse<T> {
  items: T[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface MediaUsage {
  maxImages: number;
  maxVideos: number;
  currentImages: number;
  currentVideos: number;
  isVerified: boolean;
}

// Platform Commission interface
interface PlatformCommission {
  id: string;
  commissionName: string;
  commissionRate: number;
  industryId: string;
  categoryId: string;
}

// Platform Code Preview interface
interface PlatformCodePreview {
  platformUniqueCode: string;
  orgProductNumber: string;
  globalProductNumber: string;
}

export class GalleryService {
  private static getHeaders(token: string) {
    console.log('GalleryService: Using backend URL:', BASE_URL);
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Create a new gallery item
  static async createGalleryItem(token: string, data: GalleryItemCreateData): Promise<{ success: boolean; data?: { galleryItem: GalleryItem }; message?: string }> {
    try {
      console.log('GalleryService: Creating gallery item with data:', JSON.stringify(data, null, 2));
      const fullUrl = `${BASE_URL}${routes.gallery.base}`;
      console.log('GalleryService: POST request to:', fullUrl);
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify(data)
      });

      console.log('GalleryService: Create response status:', response.status);
        if (!data.name || !data.categoryId || !data.industryId || !data.itemType) {
      return { 
        success: false, 
        message: 'Name, categoryId, industryId, and itemType are required' 
      };
    }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('GalleryService: Create result:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('Error creating gallery item:', error);
      return { success: false, message: 'Failed to create gallery item' };
    }
  }

  // Get all gallery items with pagination and filters
  static async getGalleryItems(
    token: string,
    page: number = 1,
    limit: number = 10,
    category?: string,
    search?: string,
    minPrice?: number,
    maxPrice?: number,
    startDate?: string,
    endDate?: string,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
    visibilityToPublic?: boolean,
    industryId?: string,      // Added filter
    categoryId?: string,      // Added filter
    locationIndex?: number,   // Added filter
    itemType?: 'product' | 'service' // Added filter
  ): Promise<GalleryItemsResponse> {
    try {
      console.log('GalleryService: Fetching gallery items with token:', token.substring(0, 10) + '...');
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder
      });

      if (category) params.append('category', category);
      if (search) params.append('search', search);
      if (minPrice !== undefined) params.append('minPrice', minPrice.toString());
      if (maxPrice !== undefined) params.append('maxPrice', maxPrice.toString());
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (visibilityToPublic !== undefined) params.append('visibilityToPublic', visibilityToPublic.toString());
      if (industryId) params.append('industryId', industryId);
      if (categoryId) params.append('categoryId', categoryId);
      if (locationIndex !== undefined) params.append('locationIndex', locationIndex.toString());
      if (itemType) params.append('itemType', itemType);

      const baseUrl = `${BASE_URL}${routes.gallery.base}`;
      const url = `${baseUrl}?${params.toString()}`;
      console.log('GalleryService: Fetching from URL:', url);
      
      const response = await fetch(url, {
        headers: this.getHeaders(token)
      });

      console.log('GalleryService: Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('GalleryService: Gallery items result:', result);
      
      // Return the full response with locationUsage
      return {
        success: result.success,
        data: result.data,
        message: result.message
      };
    } catch (error) {
      console.error('Error fetching gallery items:', error);
      return { 
        success: false, 
        data: {
          items: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
          },
          locationUsage: []
        },
        message: 'Failed to fetch gallery items' 
      };
    }
  }

  // Get single gallery item
  static async getGalleryItem(token: string, itemId: string): Promise<{ success: boolean; data?: GalleryItem; message?: string }> {
    try {
      console.log('GalleryService: Fetching item', itemId);
      const fullUrl = `${BASE_URL}${routes.gallery.item(itemId)}`;
      const response = await fetch(fullUrl, {
        headers: this.getHeaders(token)
      });

      console.log('GalleryService: Get item response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('GalleryService: Get item result:', result);
      return result;
    } catch (error) {
      console.error('Error fetching gallery item:', error);
      return { success: false, message: 'Failed to fetch gallery item' };
    }
  }

  // Update gallery item
  static async updateGalleryItem(
    token: string, 
    itemId: string, 
    data: GalleryItemUpdateData
  ): Promise<{ success: boolean; data?: GalleryItem; message?: string }> {
    try {
      console.log('GalleryService: Updating item', itemId, 'with data:', data);
      const fullUrl = `${BASE_URL}${routes.gallery.item(itemId)}`;
      const response = await fetch(fullUrl, {
        method: 'PUT',
        headers: this.getHeaders(token),
        body: JSON.stringify(data)
      });

      console.log('GalleryService: Update response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('GalleryService: Update result:', result);
      return result;
    } catch (error) {
      console.error('Error updating gallery item:', error);
      return { success: false, message: 'Failed to update gallery item' };
    }
  }

  // Delete gallery item
  static async deleteGalleryItem(token: string, itemId: string): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('GalleryService: Deleting item', itemId);
      const fullUrl = `${BASE_URL}${routes.gallery.item(itemId)}`;
      const response = await fetch(fullUrl, {
        method: 'DELETE',
        headers: this.getHeaders(token)
      });

      console.log('GalleryService: Delete response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('GalleryService: Delete result:', result);
      return result;
    } catch (error) {
      console.error('Error deleting gallery item:', error);
      return { success: false, message: 'Failed to delete gallery item' };
    }
  }

  // Upload image to gallery item
  static async uploadImage(
    token: string, 
    itemId: string, 
    imageFile: File,
    isMainImage: boolean = false
  ): Promise<{ success: boolean; data?: { imageUrl: string }; message?: string }> {
    try {
      console.log('GalleryService: Uploading image for item', itemId, 'file:', imageFile.name, 'isMain:', isMainImage);
      const formData = new FormData();
      formData.append('image', imageFile);
      // Note: Backend automatically sets first uploaded image as main image
      // isMain flag is logged but not sent to match API spec

      const fullUrl = `${BASE_URL}${routes.gallery.uploadImage(itemId)}`;
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('GalleryService: Image upload response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('GalleryService: Image upload result:', result);
      return result;
    } catch (error) {
      console.error('Error uploading image:', error);
      return { success: false, message: 'Failed to upload image' };
    }
  }


  
  // Upload video to gallery item
  static async uploadVideo(
    token: string, 
    itemId: string, 
    videoFile: File
  ): Promise<{ success: boolean; data?: { videoUrl: string }; message?: string }> {
    try {
      console.log('GalleryService: Uploading video for item', itemId, 'file:', videoFile.name);
      const formData = new FormData();
      formData.append('video', videoFile);

      const fullUrl = `${BASE_URL}${routes.gallery.uploadVideo(itemId)}`;
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('GalleryService: Video upload response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('GalleryService: Video upload result:', result);
      return result;
    } catch (error) {
      console.error('Error uploading video:', error);
      return { success: false, message: 'Failed to upload video' };
    }
  }

  /**
   * Get categories for dropdown (filtered by industry)
   * GET /api/admin/gallery/categories?industryId={industryId}
   */
  /**
 * Get categories for dropdown (filtered by industry)
 * GET /api/admin/gallery/categories?industryId={industryId}
 */
static async getCategoriesByIndustry(token: string, industryId: string): Promise<{ 
  success: boolean; 
  data?: { 
    categories: Array<{ 
      id: string; 
      name: string; 
      industryId: string; 
      industryName?: string; 
      description?: string 
    }> 
  }; 
  message?: string 
}> {
  try {
    console.log('GalleryService: Fetching categories for industry:', industryId);
    const url = `${BASE_URL}/api/admin/gallery/categories?industryId=${industryId}`;
    const response = await fetch(url, {
      headers: this.getHeaders(token)
    });

    console.log('GalleryService: Categories response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('GalleryService: Categories result:', result);
    return result;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { success: false, message: 'Failed to fetch categories' };
  }
}

  /**
   * Get platform commission for a category
   * GET /api/super-admin/platform-commissions/category/{categoryId}
   */
static async getPlatformCommissionByCategory(token: string, categoryId: string): Promise<{ success: boolean; data?: { commission: PlatformCommission }; message?: string }> {
  try {
    console.log('GalleryService: Fetching platform commission for category:', categoryId);
    const url = `${BASE_URL}/api/super-admin/platform-commissions/category/${categoryId}`;
    const response = await fetch(url, {
      headers: this.getHeaders(token)
    });

    console.log('GalleryService: Platform commission response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('GalleryService: Platform commission result:', result);
    return result;
  } catch (error) {
    console.error('Error fetching platform commission:', error);
    return { success: false, message: 'Failed to fetch platform commission' };
  }
}

 
  static async getPlatformCodePreview(token: string): Promise<{ success: boolean; data?: PlatformCodePreview; message?: string }> {
    try {
      console.log('GalleryService: Fetching platform code preview');
      const url = `${BASE_URL}/api/admin/gallery/preview-code`;
      const response = await fetch(url, {
        headers: this.getHeaders(token)
      });

      console.log('GalleryService: Platform code preview response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('GalleryService: Platform code preview result:', result);
      return result;
    } catch (error) {
      console.error('Error fetching platform code preview:', error);
      return { success: false, message: 'Failed to fetch platform code preview' };
    }
  }

  /**
   * Get industries for dropdown
   * GET /api/auth/industries
   */
  static async getIndustries(token: string): Promise<{ success: boolean; data?: { industries: Array<{ id: string; name: string }> }; message?: string }> {
    try {
      console.log('GalleryService: Fetching industries');
      const url = `${BASE_URL}/api/auth/industries`;
      const response = await fetch(url, {
        headers: this.getHeaders(token)
      });

      console.log('GalleryService: Industries response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('GalleryService: Industries result:', result);
      return result;
    } catch (error) {
      console.error('Error fetching industries:', error);
      return { success: false, message: 'Failed to fetch industries' };
    }
  }

 
static async getLocationsForSelect(token: string): Promise<Array<{ 
  value: number; 
  label: string; 
  disabled: boolean;
  locationIndex: number;
  brandName: string;
  cityRegion: string;
  city: string;
  state: string;
  status: string;
  isPaidFor: boolean;
  verificationStatus: string;
  locationType: string;
}>> {
  try {
    console.log('GalleryService: Fetching locations for select');
    const url = `${BASE_URL}/api/admin/gallery/locations`;
    const response = await fetch(url, {
      headers: this.getHeaders(token)
    });

    console.log('GalleryService: Locations response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('GalleryService: Locations result:', result);
    
    if (result.success && result.data?.locations) {
      return result.data.locations.map((location: any) => ({
        value: location.locationIndex,
        label: `${location.brandName} - ${location.cityRegion}, ${location.city}, ${location.state} (${location.status})`,
        disabled: location.status === 'Pending Payment' || !location.isPaidFor,
        locationIndex: location.locationIndex,
        brandName: location.brandName,
        cityRegion: location.cityRegion,
        city: location.city,
        state: location.state,
        status: location.status,
        isPaidFor: location.isPaidFor,
        verificationStatus: location.verificationStatus,
        locationType: location.locationType
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
}


static async getCommissionByCategory(token: string, categoryId: string): Promise<{ success: boolean; data?: { commission: PlatformCommission }; message?: string }> {
  try {
    console.log('GalleryService: Fetching commission for category via admin endpoint:', categoryId);
    const url = `${BASE_URL}/api/admin/gallery/commission/${categoryId}`;
    const response = await fetch(url, {
      headers: this.getHeaders(token)
    });

    console.log('GalleryService: Commission response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('GalleryService: Commission result:', result);
    return result;
  } catch (error) {
    console.error('Error fetching commission:', error);
    return { success: false, message: 'Failed to fetch commission' };
  }
}
  // Get media usage statistics
  static async getMediaUsage(token: string): Promise<{ success: boolean; data?: MediaUsage; message?: string }> {
    try {
      console.log('GalleryService: Fetching media usage');
      const fullUrl = `${BASE_URL}${routes.gallery.mediaUsage}`;
      const response = await fetch(fullUrl, {
        headers: this.getHeaders(token)
      });

      console.log('GalleryService: Media usage response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('GalleryService: Media usage result:', result);
      return result;
    } catch (error) {
      console.error('Error fetching media usage:', error);
      return { success: false, message: 'Failed to fetch media usage' };
    }
  }

  // Test backend connectivity
  static async testConnectivity(token: string): Promise<boolean> {
    try {
      console.log('GalleryService: Testing connectivity to', routes.gallery.base);
      const fullUrl = `${BASE_URL}${routes.gallery.base}`;
      const response = await fetch(fullUrl, {
        method: 'HEAD',
        headers: this.getHeaders(token)
      });
      console.log('GalleryService: Connectivity test response status:', response.status);
      return response.ok;
    } catch (error) {
      console.error('Connectivity test failed:', error);
      return false;
    }
  }

  // Calculate actual amount
  static calculateActualAmount(price: number, discount: number, platformCharge: number): number {
    return price - (price * discount / 100) + (price * platformCharge / 100);
  }

  // Calculate amount with upfront payment
  static calculateAmountWithUpfront(price: number, discount: number, platformCharge: number, upfrontPercentage: number): {
    actual: number;
    upfront: number;
    remaining: number;
  } {
    const actual = this.calculateActualAmount(price, discount, platformCharge);
    const upfront = (actual * upfrontPercentage) / 100;
    return {
      actual,
      upfront,
      remaining: actual - upfront
    };
  }

  // Validate image file
  static validateImageFile(file: File): { valid: boolean; message?: string } {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' };
    }

    if (file.size > maxSize) {
      return { valid: false, message: 'File size exceeds 5MB limit.' };
    }

    return { valid: true };
  }

  // Validate video file
  static validateVideoFile(file: File): { valid: boolean; message?: string } {
    const allowedTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, message: 'Invalid file type. Only MP4, MPEG, MOV, and AVI are allowed.' };
    }

    if (file.size > maxSize) {
      return { valid: false, message: 'File size exceeds 50MB limit.' };
    }

    return { valid: true };
  }
}