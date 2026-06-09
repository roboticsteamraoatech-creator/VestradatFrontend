import { BASE_URL } from '@/config/api';

export interface IIndustry {
  _id: string;
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface ICreateIndustryData {
  name: string;
  description: string;
}

export interface IUpdateIndustryData {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}

export interface IGetIndustriesParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: 'active' | 'inactive';
}

// IndustryService.ts

class IndustryService {
  private static BASE_URL = '/api/super-admin/industries';

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

    return result.data || result;
  }

  static async getIndustries(params: IGetIndustriesParams = {}): Promise<{
    industries: IIndustry[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const token = this.getToken();
      
      // Use the routes from apiRoutes instead of building URL manually
      const apiRoutes = {
        getIndustries: (search?: string, status?: 'active' | 'inactive') => {
          let url = '/api/super-admin/industries';
          const params = new URLSearchParams();
          if (search) params.append('search', search);
          if (status) params.append('status', status);
          const paramString = params.toString();
          return paramString ? `${url}?${paramString}` : url;
        }
      };

      // Build the URL using your routes
      let url = apiRoutes.getIndustries(params.search, params.status);
      
      // Add pagination and sorting parameters
      const queryParams = new URLSearchParams();
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      
      const additionalParams = queryParams.toString();
      if (additionalParams) {
        url += (url.includes('?') ? '&' : '?') + additionalParams;
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

      // Handle different response formats
      let industriesArray: any[] = [];
      let total = 0;
      let page = params.page || 1;
      let limit = params.limit || 10;
      let totalPages = 1;

      if (Array.isArray(result)) {
        industriesArray = result;
        total = result.length;
      } else if (result && Array.isArray(result.industries)) {
        industriesArray = result.industries;
        total = result.total || result.industries.length;
        page = result.page || page;
        limit = result.limit || limit;
        totalPages = result.totalPages || Math.ceil(total / limit);
      } else if (result && result.data && Array.isArray(result.data.industries)) {
        industriesArray = result.data.industries;
        total = result.data.total || result.data.industries.length;
        page = result.data.page || page;
        limit = result.data.limit || limit;
        totalPages = result.data.totalPages || Math.ceil(total / limit);
      }

      // Normalize the industries data
      const normalizedIndustries = industriesArray.map(industry => ({
        ...industry,
        id: industry._id || industry.id,
        status: industry.isActive !== undefined ? (industry.isActive ? 'active' : 'inactive') : (industry.status || 'active')
      }));

      return {
        industries: normalizedIndustries,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      console.error('Error fetching industries:', error);
      throw error;
    }
  }

  static async getIndustryById(id: string): Promise<IIndustry> {
    try {
      const token = this.getToken();
      
      const apiRoutes = {
        getIndustryById: (id: string) => `/api/super-admin/industries/${id}`,
      };
      
      const url = `${BASE_URL}${apiRoutes.getIndustryById(id)}`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        cache: 'no-store',
      });

      const result = await this.handleResponse(response);

      // Handle different response formats
      let industryData: any;
      
      if (result && typeof result === 'object') {
        if (result.industry) {
          industryData = result.industry;
        } else if (result.data && result.data.industry) {
          industryData = result.data.industry;
        } else if (result.data) {
          industryData = result.data;
        } else {
          industryData = result;
        }
      }

      // Normalize the industry data
      return {
        ...industryData,
        id: industryData._id || industryData.id,
        status: industryData.isActive !== undefined ? (industryData.isActive ? 'active' : 'inactive') : (industryData.status || 'active')
      };
    } catch (error) {
      console.error(`Error fetching industry with id ${id}:`, error);
      throw error;
    }
  }

  static async createIndustry(data: ICreateIndustryData): Promise<IIndustry> {
    try {
      // Validate required fields
      if (!data.name || !data.description) {
        throw new Error('Industry name and description are required');
      }

      const token = this.getToken();
      
      const apiRoutes = {
        createIndustry: () => '/api/super-admin/industries',
      };
      
      const url = `${BASE_URL}${apiRoutes.createIndustry()}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });

      const result = await this.handleResponse(response);

      // Handle different response formats
      let industryData: any;
      
      if (result && typeof result === 'object') {
        if (result.industry) {
          industryData = result.industry;
        } else if (result.data && result.data.industry) {
          industryData = result.data.industry;
        } else if (result.data) {
          industryData = result.data;
        } else {
          industryData = result;
        }
      }

      // Normalize the industry data
      return {
        ...industryData,
        id: industryData._id || industryData.id,
        status: industryData.isActive !== undefined ? (industryData.isActive ? 'active' : 'inactive') : (industryData.status || 'active')
      };
    } catch (error) {
      console.error('Error creating industry:', error);
      throw error;
    }
  }

  static async updateIndustry(id: string, data: IUpdateIndustryData): Promise<IIndustry> {
    try {
      const token = this.getToken();
      
      const apiRoutes = {
        updateIndustry: (id: string) => `/api/super-admin/industries/${id}`,
      };
      
      const url = `${BASE_URL}${apiRoutes.updateIndustry(id)}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });

      const result = await this.handleResponse(response);

      // Handle different response formats
      let industryData: any;
      
      if (result && typeof result === 'object') {
        if (result.industry) {
          industryData = result.industry;
        } else if (result.data && result.data.industry) {
          industryData = result.data.industry;
        } else if (result.data) {
          industryData = result.data;
        } else {
          industryData = result;
        }
      }

      // Normalize the industry data
      return {
        ...industryData,
        id: industryData._id || industryData.id,
        status: industryData.isActive !== undefined ? (industryData.isActive ? 'active' : 'inactive') : (industryData.status || 'active')
      };
    } catch (error) {
      console.error(`Error updating industry with id ${id}:`, error);
      throw error;
    }
  }

  static async deleteIndustry(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const token = this.getToken();
      
      const apiRoutes = {
        deleteIndustry: (id: string) => `/api/super-admin/industries/${id}`,
      };
      
      const url = `${BASE_URL}${apiRoutes.deleteIndustry(id)}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete industry';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `HTTP error! status: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Handle different response formats
      if (result.success !== undefined) {
        return {
          success: result.success,
          message: result.message || 'Industry deleted successfully'
        };
      } else if (result.data && result.data.success !== undefined) {
        return {
          success: result.data.success,
          message: result.data.message || 'Industry deleted successfully'
        };
      } else {
        return {
          success: true,
          message: 'Industry deleted successfully'
        };
      }
    } catch (error) {
      console.error(`Error deleting industry with id ${id}:`, error);
      throw error;
    }
  }

  static async updateIndustryStatus(id: string, status: 'active' | 'inactive'): Promise<IIndustry> {
    try {
      const token = this.getToken();
      
      const apiRoutes = {
        updateIndustryStatus: (id: string) => `/api/super-admin/industries/${id}/status`,
      };
      
      const url = `${BASE_URL}${apiRoutes.updateIndustryStatus(id)}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ status }),
      });

      const result = await this.handleResponse(response);

      // Handle different response formats
      let industryData: any;
      
      if (result && typeof result === 'object') {
        if (result.industry) {
          industryData = result.industry;
        } else if (result.data && result.data.industry) {
          industryData = result.data.industry;
        } else if (result.data) {
          industryData = result.data;
        } else {
          industryData = result;
        }
      }

      // Normalize the industry data
      return {
        ...industryData,
        id: industryData._id || industryData.id,
        status: industryData.isActive !== undefined ? (industryData.isActive ? 'active' : 'inactive') : (industryData.status || 'active')
      };
    } catch (error) {
      console.error(`Error updating industry status with id ${id}:`, error);
      throw error;
    }
  }

  static async exportIndustries(format: 'csv' | 'excel' | 'pdf', params: IGetIndustriesParams = {}): Promise<void> {
    try {
      const token = this.getToken();
      
      const apiRoutes = {
        exportIndustries: (format: 'csv' | 'excel' | 'pdf') => `/api/super-admin/industries/export/${format}`,
      };
      
      // Build query string from params
      const queryParams = new URLSearchParams();
      
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.status) queryParams.append('status', params.status);

      const queryString = queryParams.toString();
      const baseUrl = `${BASE_URL}${apiRoutes.exportIndustries(format)}`;
      const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

      const response = await fetch(url, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to export industries';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `HTTP error! status: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      // Handle file download
      const blob = await response.blob();
      const urlObject = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlObject;
      a.download = `industries_export.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(urlObject);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting industries:', error);
      throw error;
    }
  }

  static async getIndustriesForSelect(): Promise<Array<{ value: string; label: string; description?: string }>> {
    try {
      const { industries } = await this.getIndustries({ limit: 1000, status: 'active' });
      return industries.map(industry => ({
        value: industry.id,
        label: industry.name,
        description: industry.description
      }));
    } catch (error) {
      console.error('Error getting industries for select:', error);
      return [];
    }
  }

  static async validateIndustryName(name: string, excludeId?: string): Promise<boolean> {
    try {
      const { industries } = await this.getIndustries({ search: name.trim(), limit: 100 });
      
      const existingIndustry = industries.find(
        industry => 
          industry.name.toLowerCase() === name.toLowerCase() &&
          industry.id !== excludeId
      );
      
      return !existingIndustry;
    } catch (error) {
      console.error('Error validating industry name:', error);
      return true;
    }
  }
}

// Export the class and types with unique names
export default IndustryService;
export type { 
  IIndustry as Industry, 
  ICreateIndustryData as CreateIndustryData, 
  IUpdateIndustryData as UpdateIndustryData, 
  IGetIndustriesParams as GetIndustriesParams 
};