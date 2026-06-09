import { 
import { BASE_URL } from '@/config/api';
  PlatformCommission, 
  CreatePlatformCommissionRequest, 
  UpdatePlatformCommissionRequest, 
  GetPlatformCommissionsParams 
} from '@/types/platformCommission';

class PlatformCommissionService {
  private static BASE_URL = '/api/super-admin/platform-commissions';

  private static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userToken') || sessionStorage.getItem('userToken');
    }
    return null;
  }

  private static async handleResponse(response: Response) {
    if (!response.ok) {
      let errorMessage = 'Request failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = `HTTP error! status: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    if (result.success === false) {
      throw new Error(result.message || 'Operation failed');
    }

    // Return the full result object
    return result;
  }

  // Helper to map API response to PlatformCommission type
  private static mapToPlatformCommission(item: any): PlatformCommission {
    return {
      id: item.id || item._id,
      commissionName: item.commissionName,
      commissionRate: item.commissionRate,
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      industryId: item.industryId,
      industryName: item.industryName,
      description: item.description,
      // Map isActive to status
      status: item.isActive ? 'active' : 'inactive',
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  // Helper to map PlatformCommission to API request format
  private static mapToApiRequest(data: Partial<PlatformCommission> | CreatePlatformCommissionRequest | UpdatePlatformCommissionRequest): any {
    const apiData: any = { ...data };
    
    // Map status to isActive for the API
    if ('status' in apiData && apiData.status !== undefined) {
      apiData.isActive = apiData.status === 'active';
      delete apiData.status;
    }
    
    return apiData;
  }

  static async getPlatformCommissions(params: GetPlatformCommissionsParams = {}): Promise<{
    commissions: PlatformCommission[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const token = this.getToken();
      
      let url = this.BASE_URL;
      const queryParams = new URLSearchParams();
      
      // Add query parameters
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.industryId) queryParams.append('industryId', params.industryId);
      if (params.categoryId) queryParams.append('categoryId', params.categoryId);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.status) queryParams.append('status', params.status);
      
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const fullUrl = `${BASE_URL}${url}`;
      
      const response = await fetch(fullUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        cache: 'no-store',
      });

      const result = await this.handleResponse(response);
      const data = result.data || result;

      // Handle different response formats
      let commissionsArray: any[] = [];
      let total = 0;
      let page = params.page || 1;
      let limit = params.limit || 10;
      let totalPages = 1;

      // Check if data has commissions array (for list endpoints)
      if (data.commissions && Array.isArray(data.commissions)) {
        commissionsArray = data.commissions;
        total = data.total || data.commissions.length;
        page = data.page || page;
        limit = data.limit || limit;
        totalPages = data.totalPages || Math.ceil(total / limit);
      } else if (Array.isArray(data)) {
        commissionsArray = data;
        total = data.length;
        totalPages = Math.ceil(total / limit);
      } else {
        commissionsArray = [data];
        total = 1;
        totalPages = 1;
      }

      const commissions: PlatformCommission[] = commissionsArray.map((item: any) => 
        this.mapToPlatformCommission(item)
      );

      return {
        commissions,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      console.error('Error fetching platform commissions:', error);
      throw error;
    }
  }

  static async getPlatformCommissionById(id: string): Promise<PlatformCommission> {
    try {
      const token = this.getToken();
      const url = `${this.BASE_URL}/${id}`;
      const fullUrl = `${BASE_URL}${url}`;
      
      const response = await fetch(fullUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        cache: 'no-store',
      });

      const result = await this.handleResponse(response);
      
      // Handle nested commission object
      const commissionData = result.data?.commission || result.commission || result.data || result;

      return this.mapToPlatformCommission(commissionData);
    } catch (error) {
      console.error('Error fetching platform commission by ID:', error);
      throw error;
    }
  }

  static async getPlatformCommissionsByCategoryId(categoryId: string): Promise<PlatformCommission[]> {
    try {
      const token = this.getToken();
      const url = `${this.BASE_URL}/category/${categoryId}`;
      const fullUrl = `${BASE_URL}${url}`;
      
      const response = await fetch(fullUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        cache: 'no-store',
      });

      const result = await this.handleResponse(response);
      const data = result.data || result;

      let commissionsArray: any[] = [];
      if (Array.isArray(data)) {
        commissionsArray = data;
      } else if (data.commissions && Array.isArray(data.commissions)) {
        commissionsArray = data.commissions;
      } else {
        commissionsArray = [data];
      }

      return commissionsArray.map((item: any) => this.mapToPlatformCommission(item));
    } catch (error) {
      console.error('Error fetching platform commissions by category ID:', error);
      throw error;
    }
  }

  static async createPlatformCommission(data: CreatePlatformCommissionRequest): Promise<PlatformCommission> {
    try {
      const token = this.getToken();
      const fullUrl = `${BASE_URL}${this.BASE_URL}`;
      
      // Convert to API format
      const apiData = this.mapToApiRequest(data);
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(apiData),
      });

      const result = await this.handleResponse(response);
      const commissionData = result.data?.commission || result.commission || result.data || result;

      return this.mapToPlatformCommission(commissionData);
    } catch (error) {
      console.error('Error creating platform commission:', error);
      throw error;
    }
  }

  static async updatePlatformCommission(
    id: string, 
    data: UpdatePlatformCommissionRequest
  ): Promise<PlatformCommission> {
    try {
      const token = this.getToken();
      const url = `${this.BASE_URL}/${id}`;
      const fullUrl = `${BASE_URL}${url}`;
      
      // Convert to API format
      const apiData = this.mapToApiRequest(data);
      
      const response = await fetch(fullUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(apiData),
      });

      const result = await this.handleResponse(response);
      const commissionData = result.data?.commission || result.commission || result.data || result;

      return this.mapToPlatformCommission(commissionData);
    } catch (error) {
      console.error('Error updating platform commission:', error);
      throw error;
    }
  }

  static async updatePlatformCommissionStatus(
    id: string, 
    status: 'active' | 'inactive'
  ): Promise<PlatformCommission> {
    return this.updatePlatformCommission(id, { status });
  }

  static async deletePlatformCommission(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const token = this.getToken();
      const url = `${this.BASE_URL}/${id}`;
      const fullUrl = `${BASE_URL}${url}`;
      
      const response = await fetch(fullUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      const result = await this.handleResponse(response);
      
      return {
        success: true,
        message: result.message || 'Platform commission deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting platform commission:', error);
      throw error;
    }
  }

  static async exportPlatformCommissions(
    format: 'csv' | 'excel' | 'pdf',
    params: GetPlatformCommissionsParams = {}
  ): Promise<void> {
    try {
      const token = this.getToken();
      
      let url = `${this.BASE_URL}/export/${format}`;
      const queryParams = new URLSearchParams();
      
      if (params.search) queryParams.append('search', params.search);
      if (params.industryId) queryParams.append('industryId', params.industryId);
      if (params.categoryId) queryParams.append('categoryId', params.categoryId);
      if (params.status) queryParams.append('status', params.status);
      
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const fullUrl = `${BASE_URL}${url}`;
      
      const response = await fetch(fullUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Handle file download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `platform-commissions-${format}.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error exporting platform commissions:', error);
      throw error;
    }
  }
}

export default PlatformCommissionService;
export type { PlatformCommission, CreatePlatformCommissionRequest, UpdatePlatformCommissionRequest, GetPlatformCommissionsParams };