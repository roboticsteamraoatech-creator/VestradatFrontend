import { HttpService } from './HttpService';
import { routes } from './apiRoutes';
import { 
  ApiServiceResponse, 
  Service, 
  serviceToApiFormat,
  ApiGalleryItemsResponse,
  ApiSingleItemResponse,
  ApiMediaUploadResponse,
  ApiCategoriesResponse,
  ApiCommissionResponse,
  ApiIndustriesResponse,
  ApiLocationsResponse,
  ApiPlatformCodeResponse,
  ApiMediaUsageResponse,
  ApiDeleteResponse,
  ApiErrorResponse,
  PublicSearchResponse,
  PublicServiceDetailsCompleteResponse,
  ApiCategory,
  ApiIndustry,
  ApiLocation,
  ApiCommission,
  ApiMediaUsage,
  PlatformCodePreview,
  validateFile
} from "@/types/sub-service";

export class GalleryService {
  // Static HttpService instance for all methods
  private static httpService = new HttpService();

  private static getHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`
    };
  }

  private static getJsonHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

 

  static async createService(
    token: string,
    serviceData: Service
  ): Promise<{ success: boolean; data?: ApiServiceResponse; message?: string }> {
    try {
      console.log('GalleryService: Creating service');
      
      // Convert service data to API format
      const apiData = serviceToApiFormat(serviceData);
      
      // Log the data being sent (for debugging)
      console.log('Sending to API:', JSON.stringify(apiData, null, 2));
      
      // Use HttpService instead of direct fetch
      const httpService = new HttpService();
      const response = await httpService.postData<any>(
        apiData,
        '/api/admin/gallery'
      );

      return {
        success: response.success,
        data: response.data?.galleryItem,
        message: response.message
      };
    } catch (error) {
      console.error('Error creating service:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      };
    }
  }

  /**
   * Get all gallery items with pagination and filters
   * GET /api/admin/gallery
   */
  static async getGalleryItems(
    token: string,
    params: {
      page?: number;
      limit?: number;
      categoryId?: string;
      industryId?: string;
      locationIndex?: number;
      visibilityToPublic?: boolean;
      minPrice?: number;
      maxPrice?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ success: boolean; data?: ApiGalleryItemsResponse['data']; message?: string }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.categoryId) queryParams.append('categoryId', params.categoryId);
      if (params.industryId) queryParams.append('industryId', params.industryId);
      if (params.locationIndex !== undefined) queryParams.append('locationIndex', params.locationIndex.toString());
      if (params.visibilityToPublic !== undefined) queryParams.append('visibilityToPublic', params.visibilityToPublic.toString());
      if (params.minPrice !== undefined) queryParams.append('minPrice', params.minPrice.toString());
      if (params.maxPrice !== undefined) queryParams.append('maxPrice', params.maxPrice.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const url = `/api/admin/gallery${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await GalleryService.httpService.getData<ApiGalleryItemsResponse>(url);
      return {
        success: response.success,
        data: response.data,  // Return the entire data object with items, pagination, locationUsage
        message: response.message
      };
    } catch (error) {
      console.error('Error fetching gallery items:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      };
    }
  }

  /**
   * Get single gallery item
   * GET /api/admin/gallery/:itemId
   */
  static async getGalleryItem(
    token: string,
    itemId: string
  ): Promise<{ success: boolean; data?: ApiServiceResponse; message?: string }> {
    try {
      const response = await GalleryService.httpService.getData<ApiSingleItemResponse>(`/api/admin/gallery/${itemId}`);
      return {
        success: response.success,
        data: response.data?.galleryItem,
        message: response.message
      };
    } catch (error) {
      console.error('Error fetching gallery item:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      };
    }
  }

  /**
   * Update gallery item
   * PUT /api/admin/gallery/:itemId
   */
  static async updateGalleryItem(
    token: string,
    itemId: string,
    data: Partial<Service>
  ): Promise<{ success: boolean; data?: ApiServiceResponse; message?: string }> {
    try {
      // Convert to API format
      const updateData: any = {};
      
      if (data.name) updateData.name = data.name;
      if (data.description) updateData.description = data.description;
      if (data.categoryId) updateData.categoryId = data.categoryId;
      if (data.producer) updateData.producer = data.producer;
      if (data.actualAmount) updateData.priceInDollars = parseFloat(data.actualAmount);
      if (data.discount) updateData.discountPercentage = parseFloat(data.discount);
      if (data.platformCharge) updateData.platformChargePercentage = parseFloat(data.platformCharge);
      if (data.upfrontPayment) updateData.upfrontPaymentPercentage = 30;
      if (data.paymentMethods) updateData.paymentMethods = data.paymentMethods;
      if (data.visibilityPeriod?.startDate) updateData.startDate = data.visibilityPeriod.startDate;
      if (data.visibilityPeriod?.endDate) updateData.endDate = data.visibilityPeriod.endDate;
      if (data.timeSlot?.startTime) updateData.startTime = data.timeSlot.startTime;
      if (data.timeSlot?.endTime) updateData.endTime = data.timeSlot.endTime;
      if (data.visibilityToPublic !== undefined) updateData.visibilityToPublic = data.visibilityToPublic;
      if (data.notes) updateData.notes = data.notes;
      if (data.totalProviders) updateData.totalAvailableServiceProviders = parseInt(data.totalProviders);
      
      if (data.subServices) {
        updateData.subServices = data.subServices.map(sub => ({
          name: sub.name,
          description: sub.description,
          price: parseFloat(sub.price)
        }));
      }
      
      if (data.availabilityType) {
        updateData.availability = {
          type: data.availabilityType,
          ...(data.visibilityPeriod?.startDate && { startDate: data.visibilityPeriod.startDate }),
          ...(data.timeSlot?.startTime && { startTime: data.timeSlot.startTime }),
          ...(data.visibilityPeriod?.endDate && { endDate: data.visibilityPeriod.endDate }),
          ...(data.timeSlot?.endTime && { endTime: data.timeSlot.endTime })
        };
      }

      const response = await GalleryService.httpService.putData<ApiSingleItemResponse>(
        updateData,
        `/api/admin/gallery/${itemId}`
      );
      return {
        success: response.success,
        data: response.data?.galleryItem,
        message: response.message
      };
    } catch (error) {
      console.error('Error updating gallery item:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      };
    }
  }

  /**
   * Delete gallery item
   * DELETE /api/admin/gallery/:itemId
   */
  static async deleteGalleryItem(
    token: string,
    itemId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await GalleryService.httpService.deleteData<any>(`/api/admin/gallery/${itemId}`);
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      console.error('Error deleting gallery item:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      };
    }
  }

  /**
   * Upload image to gallery item
   * POST /api/admin/gallery/:itemId/upload-image
   */
  static async uploadImage(
    token: string,
    itemId: string,
    imageFile: File
  ): Promise<{ success: boolean; data?: ApiMediaUploadResponse['data']; message?: string }> {
    try {
      // Validate file
      const validation = validateFile(imageFile, 'image');
      if (!validation.valid) {
        return { success: false, message: validation.message };
      }

      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch(`${GalleryService.httpService['baseUrl']}/api/admin/gallery/${itemId}/upload-image`, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: formData
      });

      const result: ApiMediaUploadResponse = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      return {
        success: true,
        data: result.data,
        message: result.message
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      };
    }
  }

  /**
   * Upload image for a specific sub-service slot during edit
   * POST /api/admin/gallery/:itemId/sub-services/:index/upload-image
   */
  static async uploadSubServiceImage(
    token: string,
    itemId: string,
    index: number,
    imageFile: File
  ): Promise<{ success: boolean; data?: { uploadPicture: string; subServiceIndex: number; subService: any }; message?: string }> {
    try {
      const validation = validateFile(imageFile, 'image');
      if (!validation.valid) {
        return { success: false, message: validation.message };
      }

      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch(
        `${GalleryService.httpService['baseUrl']}/api/admin/gallery/${itemId}/sub-services/${index}/upload-image`,
        {
          method: 'POST',
          headers: this.getHeaders(token),
          body: formData
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return { success: false, message: result.message || `HTTP ${response.status}` };
      }

      return { success: true, data: result.data, message: result.message };
    } catch (error) {
      console.error('Error uploading sub-service image:', error);
      return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }

  /**
   * Upload video to gallery item
   * POST /api/admin/gallery/:itemId/upload-video
   */
  static async uploadVideo(
    token: string,
    itemId: string,
    videoFile: File
  ): Promise<{ success: boolean; data?: ApiMediaUploadResponse['data']; message?: string }> {
    try {
      // Validate file
      const validation = validateFile(videoFile, 'video');
      if (!validation.valid) {
        return { success: false, message: validation.message };
      }

      const formData = new FormData();
      formData.append('video', videoFile);

      const response = await fetch(`${GalleryService.httpService['baseUrl']}/api/admin/gallery/${itemId}/upload-video`, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: formData
      });

      const result: ApiMediaUploadResponse = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      return {
        success: true,
        data: result.data,
        message: result.message
      };
    } catch (error) {
      console.error('Error uploading video:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      };
    }
  }


  static async getCategories(
    token: string
  ): Promise<{ success: boolean; data?: ApiCategory[]; message?: string }> {
    try {
      const response = await GalleryService.httpService.getData<ApiCategoriesResponse>(
        '/api/admin/gallery/categories'
      );
      return {
        success: response.success,
        data: response.data?.categories,
        message: response.message
      };
    } catch (error) {
      console.error('Error fetching categories:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      };
    }
  }
 
  static async getCommissionByCategory(
    token: string,
    categoryId: string
  ): Promise<{ success: boolean; data?: ApiCommission; message?: string }> {
    try {
      const response = await GalleryService.httpService.getData<ApiCommissionResponse>(
        `/api/admin/gallery/commission/${categoryId}`
      );
      return {
        success: response.success,
        data: response.data?.commission,
        message: response.message
      };
    } catch (error) {
      console.error('Error fetching commission:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      };
    }
  }

  static async getIndustries(
    token: string
  ): Promise<{ success: boolean; data?: ApiIndustry[]; message?: string }> {
    try {
      const response = await GalleryService.httpService.getData<ApiIndustriesResponse>(
        '/api/auth/industries'
      );
      return {
        success: response.success,
        data: response.data?.industries,
        message: response.message
      };
    } catch (error) {
      console.error('Error fetching industries:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      };
    }
  }

  /**
   * Get locations
   * GET /api/admin/gallery/locations
   */
  static async getLocations(
    token: string
  ): Promise<{ success: boolean; data?: ApiLocation[]; message?: string }> {
    try {
      const response = await GalleryService.httpService.getData<ApiLocationsResponse>(
        '/api/admin/gallery/locations'
      );
      return {
        success: response.success,
        data: response.data?.locations,
        message: response.message
      };
    } catch (error) {
      console.error('Error fetching locations:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      };
    }
  }

  /**
   * Get platform code preview
   * GET /api/admin/gallery/preview-code
   */
  static async getPlatformCodePreview(
    token: string
  ): Promise<{ success: boolean; data?: PlatformCodePreview; message?: string }> {
    try {
      const response = await GalleryService.httpService.getData<ApiPlatformCodeResponse>(
        '/api/admin/gallery/preview-code'
      );
      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('Error fetching platform code preview:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      };
    }
  }

  /**
   * Get media usage
   * GET /api/admin/gallery/media-usage
   */
  static async getMediaUsage(
    token: string
  ): Promise<{ success: boolean; data?: ApiMediaUsage; message?: string }> {
    try {
      const response = await GalleryService.httpService.getData<ApiMediaUsageResponse>(
        '/api/admin/gallery/media-usage'
      );
      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('Error fetching media usage:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      };
    }
  }

  /**
   * Search services (public endpoint)
   * GET /api/public/products/search
   */
  static async searchServices(
    params: {
      search?: string;
      categoryId?: string;
      city?: string;
      state?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ success: boolean; data?: PublicSearchResponse['data']; message?: string }> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('itemType', 'service');
      
      if (params.search) queryParams.append('search', params.search);
      if (params.categoryId) queryParams.append('categoryId', params.categoryId);
      if (params.city) queryParams.append('city', params.city);
      if (params.state) queryParams.append('state', params.state);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const url = `/api/public/products/search?${queryParams.toString()}`;
      
      const response = await GalleryService.httpService.getData<PublicSearchResponse>(url);
      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('Error searching services:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      };
    }
  }

  /**
   * Get service details (public endpoint)
   * GET /api/public/products/:itemId
   */
  static async getServiceDetails(
    itemId: string
  ): Promise<{ success: boolean; data?: PublicServiceDetailsCompleteResponse['data']; message?: string }> {
    try {
      const response = await GalleryService.httpService.getData<PublicServiceDetailsCompleteResponse>(
        `/api/public/products/${itemId}`
      );
      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('Error fetching service details:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      };
    }
  }

  /**
   * Test connectivity
   */
  static async testConnectivity(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${GalleryService.httpService['baseUrl']}/api/admin/gallery`, {
        method: 'HEAD',
        headers: this.getHeaders(token)
      });
      return response.ok;
    } catch (error) {
      console.error('Connectivity test failed:', error);
      return false;
    }
  }

  /**
   * Get org-scoped gallery items
   * GET /api/admin/gallery/items
   */
  static async getAdminGalleryItems(
    params: {
      page?: number;
      limit?: number;
      itemType?: 'product' | 'service' | '';
      categoryId?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const q = new URLSearchParams();
      if (params.page) q.append('page', String(params.page));
      if (params.limit) q.append('limit', String(params.limit));
      if (params.itemType) q.append('itemType', params.itemType);
      if (params.categoryId) q.append('categoryId', params.categoryId);
      if (params.search) q.append('search', params.search);
      if (params.sortBy) q.append('sortBy', params.sortBy);
      if (params.sortOrder) q.append('sortOrder', params.sortOrder);
      const url = `/api/admin/gallery/items${q.toString() ? `?${q}` : ''}`;
      const response = await GalleryService.httpService.getData<any>(url);
      return { success: response.success, data: response.data, message: response.message };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get org-scoped gallery item details
   * GET /api/admin/gallery/items/:itemId
   */
  static async getAdminGalleryItemDetails(
    itemId: string
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await GalleryService.httpService.getData<any>(`/api/admin/gallery/items/${itemId}`);
      return { success: response.success, data: response.data, message: response.message };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}