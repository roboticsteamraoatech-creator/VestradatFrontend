import { Organization } from '@/types';
import { BASE_URL } from '@/config/api';

interface GetOrganizationsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  fromDate?: string;
  toDate?: string;
  status?: 'active' | 'suspended' | 'inactive';
}

interface CreateOrganizationData {
  organizationName: string;
  email: string;
  phoneNumber: string;
  address: string;
  contactPerson: string;
  accountNumber: string;
}

class OrganizationService {
  private static BASE_URL = '/api/super-admin/organizations';

  static async createOrganization(data: CreateOrganizationData): Promise<Organization> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
      
      const response = await fetch(`${BASE_URL}${this.BASE_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create organization');
      }

      return result.data;
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  }

  static async getOrganizations(params: GetOrganizationsParams = {}): Promise<{
    organizations: Organization[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
      
      // Build query string from params
      const queryParams = new URLSearchParams();
      
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.fromDate) queryParams.append('fromDate', params.fromDate);
      if (params.toDate) queryParams.append('toDate', params.toDate);
      if (params.status) queryParams.append('status', params.status);

      const queryString = queryParams.toString();
      const url = queryString ? `${BASE_URL}${this.BASE_URL}?${queryString}` : `${BASE_URL}${this.BASE_URL}`;

      const response = await fetch(url, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching organizations:', error);
      throw error;
    }
  }

  static async getOrganizationById(id: string): Promise<Organization> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
      
      const response = await fetch(`${BASE_URL}${this.BASE_URL}/${id}`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch organization');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching organization by ID:', error);
      throw error;
    }
  }

  static async updateOrganization(id: string, data: CreateOrganizationData): Promise<Organization> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
      
      const response = await fetch(`${BASE_URL}${this.BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update organization');
      }

      return result.data;
    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
  }

  static async deleteOrganization(id: string): Promise<void> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
      
      const response = await fetch(`${BASE_URL}${this.BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete organization');
      }
    } catch (error) {
      console.error('Error deleting organization:', error);
      throw error;
    }
  }

  static async updateOrganizationStatus(id: string, status: 'active' | 'suspended' | 'inactive'): Promise<Organization> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
      
      const response = await fetch(`${BASE_URL}${this.BASE_URL}/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update organization status');
      }

      return result.data;
    } catch (error) {
      console.error('Error updating organization status:', error);
      throw error;
    }
  }

  static async exportOrganizations(format: 'csv' | 'excel', params: GetOrganizationsParams = {}): Promise<{
    fileName: string;
    downloadUrl: string;
    recordCount: number;
    format: string;
  }> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
      
      // Build query string from params
      const queryParams = new URLSearchParams();
      
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.fromDate) queryParams.append('fromDate', params.fromDate);
      if (params.toDate) queryParams.append('toDate', params.toDate);
      if (params.status) queryParams.append('status', params.status);

      const queryString = queryParams.toString();
      const url = queryString ? `${BASE_URL}${this.BASE_URL}/export/${format}?${queryString}` : `${BASE_URL}${this.BASE_URL}/export/${format}`;

      const response = await fetch(url, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to export organizations');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error exporting organizations:', error);
      throw error;
    }
  }
}

export default OrganizationService;