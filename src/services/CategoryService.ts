import { BASE_URL } from '@/config/api';


export interface Category {
  _id: string;
  id: string;
  name: string;
  description: string;
  industryId: string;
  industryName?: string;
  isActive: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface CreateCategoryData {
  name: string;
  description: string;
  industryId: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  industryId?: string;
  status?: 'active' | 'inactive';
}

export interface GetCategoriesParams {
  page?: number;
  limit?: number;
  search?: string;
  industryId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: 'active' | 'inactive';
}

class CategoryService {
  private static BASE_URL = '/api/super-admin/categories';

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

  static async getCategories(params: GetCategoriesParams = {}): Promise<{
    categories: Category[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const token = this.getToken();
      
      // Build query string from params
      const queryParams = new URLSearchParams();
      
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.industryId) queryParams.append('industryId', params.industryId);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.status) queryParams.append('status', params.status);

      const queryString = queryParams.toString();
      const url = queryString 
        ? `${BASE_URL}${this.BASE_URL}?${queryString}`
        : `${BASE_URL}${this.BASE_URL}`;

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        cache: 'no-store',
      });

      const result = await this.handleResponse(response);

      // Handle different response formats
      let categoriesArray: any[] = [];
      let total = 0;
      let page = params.page || 1;
      let limit = params.limit || 10;
      let totalPages = 1;

      if (Array.isArray(result)) {
        categoriesArray = result;
        total = result.length;
      } else if (result && Array.isArray(result.categories)) {
        categoriesArray = result.categories;
        total = result.total || result.categories.length;
        page = result.page || page;
        limit = result.limit || limit;
        totalPages = result.totalPages || Math.ceil(total / limit);
      } else if (result && result.data && Array.isArray(result.data.categories)) {
        categoriesArray = result.data.categories;
        total = result.data.total || result.data.categories.length;
        page = result.data.page || page;
        limit = result.data.limit || limit;
        totalPages = result.data.totalPages || Math.ceil(total / limit);
      }

      // Normalize the categories data
      const normalizedCategories = categoriesArray.map(category => ({
        ...category,
        id: category._id || category.id,
        status: category.isActive !== undefined ? (category.isActive ? 'active' : 'inactive') : (category.status || 'active')
      }));

      return {
        categories: normalizedCategories,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  static async getCategoryById(id: string): Promise<Category> {
    try {
      const token = this.getToken();
      
      const url = `${BASE_URL}${this.BASE_URL}/${id}`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        cache: 'no-store',
      });

      const result = await this.handleResponse(response);

      // Handle different response formats
      let categoryData: any;
      
      if (result && typeof result === 'object') {
        if (result.category) {
          categoryData = result.category;
        } else if (result.data && result.data.category) {
          categoryData = result.data.category;
        } else if (result.data) {
          categoryData = result.data;
        } else {
          categoryData = result;
        }
      }

      // Normalize the category data
      return {
        ...categoryData,
        id: categoryData._id || categoryData.id,
        status: categoryData.isActive !== undefined ? (categoryData.isActive ? 'active' : 'inactive') : (categoryData.status || 'active')
      };
    } catch (error) {
      console.error(`Error fetching category with id ${id}:`, error);
      throw error;
    }
  }

  static async createCategory(data: CreateCategoryData): Promise<Category> {
    try {
      // Validate required fields
      if (!data.name || !data.description || !data.industryId) {
        throw new Error('Category name, description, and industry are required');
      }

      const token = this.getToken();
      
      const url = `${BASE_URL}${this.BASE_URL}`;
      
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
      let categoryData: any;
      
      if (result && typeof result === 'object') {
        if (result.category) {
          categoryData = result.category;
        } else if (result.data && result.data.category) {
          categoryData = result.data.category;
        } else if (result.data) {
          categoryData = result.data;
        } else {
          categoryData = result;
        }
      }

      // Normalize the category data
      return {
        ...categoryData,
        id: categoryData._id || categoryData.id,
        status: categoryData.isActive !== undefined ? (categoryData.isActive ? 'active' : 'inactive') : (categoryData.status || 'active')
      };
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  static async updateCategory(id: string, data: UpdateCategoryData): Promise<Category> {
    try {
      const token = this.getToken();
      
      const url = `${BASE_URL}${this.BASE_URL}/${id}`;
      
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
      let categoryData: any;
      
      if (result && typeof result === 'object') {
        if (result.category) {
          categoryData = result.category;
        } else if (result.data && result.data.category) {
          categoryData = result.data.category;
        } else if (result.data) {
          categoryData = result.data;
        } else {
          categoryData = result;
        }
      }

      // Normalize the category data
      return {
        ...categoryData,
        id: categoryData._id || categoryData.id,
        status: categoryData.isActive !== undefined ? (categoryData.isActive ? 'active' : 'inactive') : (categoryData.status || 'active')
      };
    } catch (error) {
      console.error(`Error updating category with id ${id}:`, error);
      throw error;
    }
  }

  static async deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const token = this.getToken();
      
      const url = `${BASE_URL}${this.BASE_URL}/${id}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete category';
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
          message: result.message || 'Category deleted successfully'
        };
      } else if (result.data && result.data.success !== undefined) {
        return {
          success: result.data.success,
          message: result.data.message || 'Category deleted successfully'
        };
      } else {
        return {
          success: true,
          message: 'Category deleted successfully'
        };
      }
    } catch (error) {
      console.error(`Error deleting category with id ${id}:`, error);
      throw error;
    }
  }

  static async updateCategoryStatus(id: string, status: 'active' | 'inactive'): Promise<Category> {
    try {
      const token = this.getToken();
      
      const url = `${BASE_URL}${this.BASE_URL}/${id}/status`;
      
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
      let categoryData: any;
      
      if (result && typeof result === 'object') {
        if (result.category) {
          categoryData = result.category;
        } else if (result.data && result.data.category) {
          categoryData = result.data.category;
        } else if (result.data) {
          categoryData = result.data;
        } else {
          categoryData = result;
        }
      }

      // Normalize the category data
      return {
        ...categoryData,
        id: categoryData._id || categoryData.id,
        status: categoryData.isActive !== undefined ? (categoryData.isActive ? 'active' : 'inactive') : (categoryData.status || 'active')
      };
    } catch (error) {
      console.error(`Error updating category status with id ${id}:`, error);
      throw error;
    }
  }

  static async exportCategories(format: 'csv' | 'excel' | 'pdf', params: GetCategoriesParams = {}): Promise<void> {
    try {
      const token = this.getToken();
      
      // Build query string from params
      const queryParams = new URLSearchParams();
      
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.industryId) queryParams.append('industryId', params.industryId);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.status) queryParams.append('status', params.status);

      const queryString = queryParams.toString();
      const baseUrl = `${BASE_URL}${this.BASE_URL}/export/${format}`;
      const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

      const response = await fetch(url, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to export categories';
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
      a.download = `categories_export.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(urlObject);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting categories:', error);
      throw error;
    }
  }

  static async getCategoriesByIndustry(industryId: string): Promise<Category[]> {
    try {
      const { categories } = await this.getCategories({ 
        industryId,
        limit: 1000,
        status: 'active' 
      });
      return categories;
    } catch (error) {
      console.error(`Error getting categories for industry ${industryId}:`, error);
      return [];
    }
  }

  static async getCategoriesForSelect(industryId?: string): Promise<Array<{ value: string; label: string; description?: string; industryId?: string }>> {
    try {
      const params: GetCategoriesParams = { limit: 1000, status: 'active' };
      if (industryId) {
        params.industryId = industryId;
      }
      
      const { categories } = await this.getCategories(params);
      return categories.map(category => ({
        value: category.id,
        label: category.name,
        description: category.description,
        industryId: category.industryId
      }));
    } catch (error) {
      console.error('Error getting categories for select:', error);
      return [];
    }
  }

  static async validateCategoryName(name: string, excludeId?: string, industryId?: string): Promise<boolean> {
    try {
      const params: GetCategoriesParams = { 
        search: name.trim(), 
        limit: 100 
      };
      
      if (industryId) {
        params.industryId = industryId;
      }
      
      const { categories } = await this.getCategories(params);
      
      const existingCategory = categories.find(
        category => 
          category.name.toLowerCase() === name.toLowerCase() &&
          category.id !== excludeId &&
          (!industryId || category.industryId === industryId)
      );
      
      return !existingCategory;
    } catch (error) {
      console.error('Error validating category name:', error);
      return true;
    }
  }
}


export default CategoryService;
