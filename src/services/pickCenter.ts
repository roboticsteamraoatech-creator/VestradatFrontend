import { BASE_URL } from '@/config/api';


// export interface IPickupCenter {
//   _id: string;
//   id: string;
//   centerName: string;
//   amount: number;
//   address: string;
//   contactNumber: string;
//   operatingDays: string;
//   operatingHours: string;
//   isActive?: boolean;
//   status?: 'active' | 'inactive';
//   createdAt: string;
//   updatedAt: string;
//   __v?: number;
// }

// export interface ICreatePickupCenterData {
//   centerName: string;
//   amount: number;
//   address: string;
//   contactNumber: string;
//   operatingDays: string;
//   operatingHours: string;
// }

// export interface IUpdatePickupCenterData {
//   centerName?: string;
//   amount?: number;
//   address?: string;
//   contactNumber?: string;
//   operatingDays?: string;
//   operatingHours?: string;
//   status?: 'active' | 'inactive';
// }

// export interface IGetPickupCentersParams {
//   page?: number;
//   limit?: number;
//   search?: string;
//   sortBy?: string;
//   sortOrder?: 'asc' | 'desc';
//   isActive?: boolean;
//   status?: 'active' | 'inactive';
// }

// class PickupCenterService {
//   private static BASE_URL = '/api/super-admin/pickup-centers';

//   private static getToken(): string | null {
//     if (typeof window !== 'undefined') {
//       return localStorage.getItem('userToken') || sessionStorage.getItem('userToken');
//     }
//     return null;
//   }

//   private static async handleResponse(response: Response) {
//     if (!response.ok) {
//       let errorMessage = 'Request failed';
//       try {
//         const errorData = await response.json();
//         errorMessage = errorData.message || errorMessage;
//       } catch (e) {
//         errorMessage = `HTTP error! status: ${response.status}`;
//       }
//       throw new Error(errorMessage);
//     }

//     const result = await response.json();
    
//     if (result.success === false) {
//       throw new Error(result.message || 'Operation failed');
//     }

//     return result.data || result;
//   }

 
//   static async getPickupCenters(params: IGetPickupCentersParams = {}): Promise<{
//     map(arg0: (center: { centerName: string; }) => string): unknown;
//     pickupCenters: IPickupCenter[];
//     total: number;
//     page: number;
//     limit: number;
//     totalPages: number;
//   }> {
//     try {
//       const token = this.getToken();
      
    
//       const queryParams = new URLSearchParams();
      
//       if (params.page !== undefined) queryParams.append('page', params.page.toString());
//       if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
//       if (params.search) queryParams.append('search', params.search);
//       if (params.sortBy) queryParams.append('sortBy', params.sortBy);
//       if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      
 
//       if (params.isActive !== undefined) {
//         queryParams.append('isActive', params.isActive.toString());
//       } else if (params.status === 'active') {
//         queryParams.append('isActive', 'true');
//       } else if (params.status === 'inactive') {
//         queryParams.append('isActive', 'false');
//       }

//       const queryString = queryParams.toString();
//       const baseUrl = `${BASE_URL}${this.BASE_URL}`;
//       const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

//       const response = await fetch(url, {
//         headers: {
//           'Content-Type': 'application/json',
//           ...(token && { 'Authorization': `Bearer ${token}` }),
//         },
//         cache: 'no-store',
//       });

//       const result = await this.handleResponse(response);

  
//       let pickupCentersArray: any[] = [];
//       let total = 0;
//       let page = params.page || 1;
//       let limit = params.limit || 10;
//       let totalPages = 1;

//       if (Array.isArray(result)) {
//         pickupCentersArray = result;
//         total = result.length;
//       } else if (result && Array.isArray(result.pickupCenters)) {
//         pickupCentersArray = result.pickupCenters;
//         total = result.total || result.pickupCenters.length;
//         page = result.page || page;
//         limit = result.limit || limit;
//         totalPages = result.totalPages || Math.ceil(total / limit);
//       } else if (result && result.data && Array.isArray(result.data.pickupCenters)) {
//         pickupCentersArray = result.data.pickupCenters;
//         total = result.data.total || result.data.pickupCenters.length;
//         page = result.data.page || page;
//         limit = result.data.limit || limit;
//         totalPages = result.data.totalPages || Math.ceil(total / limit);
//       } else if (result && Array.isArray(result.items)) {
//         pickupCentersArray = result.items;
//         total = result.total || result.items.length;
//         page = result.page || page;
//         limit = result.limit || limit;
//         totalPages = result.totalPages || Math.ceil(total / limit);
//       }

//       // Normalize the pickup centers data
//       const normalizedPickupCenters = pickupCentersArray.map(center => ({
//         ...center,
//         id: center._id || center.id,
//         status: center.isActive !== undefined 
//           ? (center.isActive ? 'active' : 'inactive') 
//           : (center.status || 'active')
//       }));

//       return {
//         pickupCenters: normalizedPickupCenters,
//         total,
//         page,
//         limit,
//         totalPages
//       };
//     } catch (error) {
//       console.error('Error fetching pickup centers:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get pickup center by ID
//    * GET /api/super-admin/pickup-centers/:id
//    */
//   static async getPickupCenterById(id: string): Promise<IPickupCenter> {
//     try {
//       const token = this.getToken();
      
//       const url = `${BASE_URL}${this.BASE_URL}/${id}`;
      
//       const response = await fetch(url, {
//         headers: {
//           'Content-Type': 'application/json',
//           ...(token && { 'Authorization': `Bearer ${token}` }),
//         },
//         cache: 'no-store',
//       });

//       const result = await this.handleResponse(response);

//       // Handle different response formats
//       let centerData: any;
      
//       if (result && typeof result === 'object') {
//         if (result.pickupCenter) {
//           centerData = result.pickupCenter;
//         } else if (result.data && result.data.pickupCenter) {
//           centerData = result.data.pickupCenter;
//         } else if (result.data) {
//           centerData = result.data;
//         } else {
//           centerData = result;
//         }
//       }

//       // Normalize the pickup center data
//       return {
//         ...centerData,
//         id: centerData._id || centerData.id,
//         status: centerData.isActive !== undefined 
//           ? (centerData.isActive ? 'active' : 'inactive') 
//           : (centerData.status || 'active')
//       };
//     } catch (error) {
//       console.error(`Error fetching pickup center with id ${id}:`, error);
//       throw error;
//     }
//   }

  

//   static async createPickupCenter(data: ICreatePickupCenterData): Promise<IPickupCenter> {
//     try {
//       // Validate required fields
//       if (!data.centerName || !data.amount || !data.address || !data.contactNumber || !data.operatingDays || !data.operatingHours) {
//         throw new Error('All fields are required: centerName, amount, address, contactNumber, operatingDays, operatingHours');
//       }

//       // Validate amount is a positive number
//       if (data.amount <= 0) {
//         throw new Error('Amount must be a positive number');
//       }

//       const token = this.getToken();
      
//       const url = `${BASE_URL}${this.BASE_URL}`;
      
//       const response = await fetch(url, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           ...(token && { 'Authorization': `Bearer ${token}` }),
//         },
//         body: JSON.stringify(data),
//       });

//       const result = await this.handleResponse(response);

//       // Handle different response formats
//       let centerData: any;
      
//       if (result && typeof result === 'object') {
//         if (result.pickupCenter) {
//           centerData = result.pickupCenter;
//         } else if (result.data && result.data.pickupCenter) {
//           centerData = result.data.pickupCenter;
//         } else if (result.data) {
//           centerData = result.data;
//         } else {
//           centerData = result;
//         }
//       }

//       // Normalize the pickup center data
//       return {
//         ...centerData,
//         id: centerData._id || centerData.id,
//         status: centerData.isActive !== undefined 
//           ? (centerData.isActive ? 'active' : 'inactive') 
//           : (centerData.status || 'active')
//       };
//     } catch (error) {
//       console.error('Error creating pickup center:', error);
//       throw error;
//     }
//   }

  
//   static async updatePickupCenter(id: string, data: IUpdatePickupCenterData): Promise<IPickupCenter> {
//     try {
      
//       if (data.amount !== undefined && data.amount <= 0) {
//         throw new Error('Amount must be a positive number');
//       }

//       const token = this.getToken();
      
//       const url = `${BASE_URL}${this.BASE_URL}/${id}`;
      
//       const response = await fetch(url, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//           ...(token && { 'Authorization': `Bearer ${token}` }),
//         },
//         body: JSON.stringify(data),
//       });

//       const result = await this.handleResponse(response);

//       // Handle different response formats
//       let centerData: any;
      
//       if (result && typeof result === 'object') {
//         if (result.pickupCenter) {
//           centerData = result.pickupCenter;
//         } else if (result.data && result.data.pickupCenter) {
//           centerData = result.data.pickupCenter;
//         } else if (result.data) {
//           centerData = result.data;
//         } else {
//           centerData = result;
//         }
//       }

     
//       return {
//         ...centerData,
//         id: centerData._id || centerData.id,
//         status: centerData.isActive !== undefined 
//           ? (centerData.isActive ? 'active' : 'inactive') 
//           : (centerData.status || 'active')
//       };
//     } catch (error) {
//       console.error(`Error updating pickup center with id ${id}:`, error);
//       throw error;
//     }
//   }

 
//   static async deletePickupCenter(id: string): Promise<{ success: boolean; message: string }> {
//     try {
//       const token = this.getToken();
      
//       const url = `${BASE_URL}${this.BASE_URL}/${id}`;
      
//       const response = await fetch(url, {
//         method: 'DELETE',
//         headers: {
//           'Content-Type': 'application/json',
//           ...(token && { 'Authorization': `Bearer ${token}` }),
//         },
//       });

//       if (!response.ok) {
//         let errorMessage = 'Failed to delete pickup center';
//         try {
//           const errorData = await response.json();
//           errorMessage = errorData.message || errorMessage;
//         } catch (e) {
//           errorMessage = `HTTP error! status: ${response.status}`;
//         }
//         throw new Error(errorMessage);
//       }

//       const result = await response.json();
      
//       // Handle different response formats
//       if (result.success !== undefined) {
//         return {
//           success: result.success,
//           message: result.message || 'Pickup center deleted successfully'
//         };
//       } else if (result.data && result.data.success !== undefined) {
//         return {
//           success: result.data.success,
//           message: result.data.message || 'Pickup center deleted successfully'
//         };
//       } else {
//         return {
//           success: true,
//           message: 'Pickup center deleted successfully'
//         };
//       }
//     } catch (error) {
//       console.error(`Error deleting pickup center with id ${id}:`, error);
//       throw error;
//     }
//   }



//   static async updatePickupCenterStatus(id: string, status: 'active' | 'inactive'): Promise<IPickupCenter> {
//     try {
//       const token = this.getToken();
      
//       const url = `${BASE_URL}${this.BASE_URL}/${id}/status`;
      
//       const response = await fetch(url, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//           ...(token && { 'Authorization': `Bearer ${token}` }),
//         },
//         body: JSON.stringify({ status }),
//       });

//       const result = await this.handleResponse(response);

//       let centerData: any;
      
//       if (result && typeof result === 'object') {
//         if (result.pickupCenter) {
//           centerData = result.pickupCenter;
//         } else if (result.data && result.data.pickupCenter) {
//           centerData = result.data.pickupCenter;
//         } else if (result.data) {
//           centerData = result.data;
//         } else {
//           centerData = result;
//         }
//       }

     
//       return {
//         ...centerData,
//         id: centerData._id || centerData.id,
//         status: centerData.isActive !== undefined 
//           ? (centerData.isActive ? 'active' : 'inactive') 
//           : (centerData.status || 'active')
//       };
//     } catch (error) {
//       console.error(`Error updating pickup center status with id ${id}:`, error);
//       throw error;
//     }
//   }

 
//   static async getPickupCentersForSelect(isActive?: boolean): Promise<Array<{ value: string; label: string; address?: string; amount?: number }>> {
//     try {
//       const params: IGetPickupCentersParams = { limit: 1000 };
//       if (isActive !== undefined) {
//         params.isActive = isActive;
//       } else {
//         params.status = 'active';
//       }
      
//       const { pickupCenters } = await this.getPickupCenters(params);
//       return pickupCenters.map(center => ({
//         value: center.id,
//         label: center.centerName,
//         address: center.address,
//         amount: center.amount
//       }));
//     } catch (error) {
//       console.error('Error getting pickup centers for select:', error);
//       return [];
//     }
//   }

 
//   static async validatePickupCenterName(name: string, excludeId?: string): Promise<boolean> {
//     try {
//       const { pickupCenters } = await this.getPickupCenters({ 
//         search: name.trim(), 
//         limit: 100 
//       });
      
//       const existingCenter = pickupCenters.find(
//         center => 
//           center.centerName.toLowerCase() === name.toLowerCase() &&
//           center.id !== excludeId
//       );
      
//       return !existingCenter;
//     } catch (error) {
//       console.error('Error validating pickup center name:', error);
//       return true;
//     }
//   }

 
//   static formatAmount(amount: number): string {
//     return new Intl.NumberFormat('en-NG', {
//       style: 'currency',
//       currency: 'NGN',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(amount);
//   }
// }


// export default PickupCenterService;
// export type { 
//   IPickupCenter as PickupCenter, 
//   ICreatePickupCenterData as CreatePickupCenterData, 
//   IUpdatePickupCenterData as UpdatePickupCenterData, 
//   IGetPickupCentersParams as GetPickupCentersParams 
// };


// services/pickCenter.ts

export interface IPickupCenter {
  _id: string;
  id: string;
  centerName: string;
  amount: number;
  address: string;
  contactNumber: string;
  operatingDays: string;
  operatingHours: string;
  isActive?: boolean;
  status?: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface ICreatePickupCenterData {
  centerName: string;
  amount: number;
  address: string;
  contactNumber: string;
  operatingDays: string;
  operatingHours: string;
}

export interface IUpdatePickupCenterData {
  centerName?: string;
  amount?: number;
  address?: string;
  contactNumber?: string;
  operatingDays?: string;
  operatingHours?: string;
  status?: 'active' | 'inactive';
}

export interface IGetPickupCentersParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  status?: 'active' | 'inactive';
}

class PickupCenterService {
  private static BASE_URL = '/api/super-admin/pickup-centers';

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
        
        // Check for duplicate error
        if (response.status === 409 || 
            errorMessage.toLowerCase().includes('duplicate') || 
            errorMessage.toLowerCase().includes('already exists')) {
          throw new Error('A pickup center with this name already exists');
        }
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

  static async getPickupCenters(params: IGetPickupCentersParams = {}): Promise<{
    pickupCenters: IPickupCenter[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const token = this.getToken();
      
      const queryParams = new URLSearchParams();
      
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      
      // Default sorting: by createdAt descending (newest first)
      queryParams.append('sortBy', params.sortBy || 'createdAt');
      queryParams.append('sortOrder', params.sortOrder || 'desc');
      
      if (params.isActive !== undefined) {
        queryParams.append('isActive', params.isActive.toString());
      } else if (params.status === 'active') {
        queryParams.append('isActive', 'true');
      } else if (params.status === 'inactive') {
        queryParams.append('isActive', 'false');
      }

      // Add cache busting
      const lastUpdated = typeof window !== 'undefined' ? localStorage.getItem('pickupCenters_lastUpdated') : null;
      const timestamp = lastUpdated || Date.now().toString();
      
      const queryString = queryParams.toString();
      const baseUrl = `${BASE_URL}${this.BASE_URL}`;
      const url = queryString 
        ? `${baseUrl}?${queryString}&_t=${timestamp}` 
        : `${baseUrl}?_t=${timestamp}`;

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        cache: 'no-store',
      });

      const result = await this.handleResponse(response);

      let pickupCentersArray: any[] = [];
      let total = 0;
      let page = params.page || 1;
      let limit = params.limit || 10;
      let totalPages = 1;

      if (Array.isArray(result)) {
        pickupCentersArray = result;
        total = result.length;
      } else if (result && Array.isArray(result.pickupCenters)) {
        pickupCentersArray = result.pickupCenters;
        total = result.total || result.pickupCenters.length;
        page = result.page || page;
        limit = result.limit || limit;
        totalPages = result.totalPages || Math.ceil(total / limit);
      } else if (result && result.data && Array.isArray(result.data.pickupCenters)) {
        pickupCentersArray = result.data.pickupCenters;
        total = result.data.total || result.data.pickupCenters.length;
        page = result.data.page || page;
        limit = result.data.limit || limit;
        totalPages = result.data.totalPages || Math.ceil(total / limit);
      } else if (result && Array.isArray(result.items)) {
        pickupCentersArray = result.items;
        total = result.total || result.items.length;
        page = result.page || page;
        limit = result.limit || limit;
        totalPages = result.totalPages || Math.ceil(total / limit);
      }

      // Normalize the pickup centers data and ensure sorting by createdAt desc (newest first)
      const normalizedPickupCenters = pickupCentersArray
        .map(center => ({
          ...center,
          id: center._id || center.id,
          status: center.isActive !== undefined 
            ? (center.isActive ? 'active' : 'inactive') 
            : (center.status || 'active')
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return {
        pickupCenters: normalizedPickupCenters,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      console.error('Error fetching pickup centers:', error);
      throw error;
    }
  }

  static async getPickupCenterById(id: string): Promise<IPickupCenter> {
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

      let centerData: any;
      
      if (result && typeof result === 'object') {
        if (result.pickupCenter) {
          centerData = result.pickupCenter;
        } else if (result.data && result.data.pickupCenter) {
          centerData = result.data.pickupCenter;
        } else if (result.data) {
          centerData = result.data;
        } else {
          centerData = result;
        }
      }

      return {
        ...centerData,
        id: centerData._id || centerData.id,
        status: centerData.isActive !== undefined 
          ? (centerData.isActive ? 'active' : 'inactive') 
          : (centerData.status || 'active')
      };
    } catch (error) {
      console.error(`Error fetching pickup center with id ${id}:`, error);
      throw error;
    }
  }

  static async createPickupCenter(data: ICreatePickupCenterData): Promise<IPickupCenter> {
    try {
      // Validate required fields
      if (!data.centerName || !data.amount || !data.address || !data.contactNumber || !data.operatingDays || !data.operatingHours) {
        throw new Error('All fields are required: centerName, amount, address, contactNumber, operatingDays, operatingHours');
      }

      // Validate amount is a positive number
      if (data.amount <= 0) {
        throw new Error('Amount must be a positive number');
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

      // Update the last updated timestamp to invalidate cache
      if (typeof window !== 'undefined') {
        localStorage.setItem('pickupCenters_lastUpdated', Date.now().toString());
      }

      let centerData: any;
      
      if (result && typeof result === 'object') {
        if (result.pickupCenter) {
          centerData = result.pickupCenter;
        } else if (result.data && result.data.pickupCenter) {
          centerData = result.data.pickupCenter;
        } else if (result.data) {
          centerData = result.data;
        } else {
          centerData = result;
        }
      }

      return {
        ...centerData,
        id: centerData._id || centerData.id,
        status: centerData.isActive !== undefined 
          ? (centerData.isActive ? 'active' : 'inactive') 
          : (centerData.status || 'active')
      };
    } catch (error) {
      console.error('Error creating pickup center:', error);
      throw error;
    }
  }

  static async updatePickupCenter(id: string, data: IUpdatePickupCenterData): Promise<IPickupCenter> {
    try {
      if (data.amount !== undefined && data.amount <= 0) {
        throw new Error('Amount must be a positive number');
      }

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

      // Update timestamp to invalidate cache
      if (typeof window !== 'undefined') {
        localStorage.setItem('pickupCenters_lastUpdated', Date.now().toString());
      }

      let centerData: any;
      
      if (result && typeof result === 'object') {
        if (result.pickupCenter) {
          centerData = result.pickupCenter;
        } else if (result.data && result.data.pickupCenter) {
          centerData = result.data.pickupCenter;
        } else if (result.data) {
          centerData = result.data;
        } else {
          centerData = result;
        }
      }

      return {
        ...centerData,
        id: centerData._id || centerData.id,
        status: centerData.isActive !== undefined 
          ? (centerData.isActive ? 'active' : 'inactive') 
          : (centerData.status || 'active')
      };
    } catch (error) {
      console.error(`Error updating pickup center with id ${id}:`, error);
      throw error;
    }
  }

  static async deletePickupCenter(id: string): Promise<{ success: boolean; message: string }> {
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
        let errorMessage = 'Failed to delete pickup center';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `HTTP error! status: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      // Update timestamp to invalidate cache
      if (typeof window !== 'undefined') {
        localStorage.setItem('pickupCenters_lastUpdated', Date.now().toString());
      }

      const result = await response.json();
      
      if (result.success !== undefined) {
        return {
          success: result.success,
          message: result.message || 'Pickup center deleted successfully'
        };
      } else if (result.data && result.data.success !== undefined) {
        return {
          success: result.data.success,
          message: result.data.message || 'Pickup center deleted successfully'
        };
      } else {
        return {
          success: true,
          message: 'Pickup center deleted successfully'
        };
      }
    } catch (error) {
      console.error(`Error deleting pickup center with id ${id}:`, error);
      throw error;
    }
  }

  static async updatePickupCenterStatus(id: string, status: 'active' | 'inactive'): Promise<IPickupCenter> {
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

      // Update timestamp to invalidate cache
      if (typeof window !== 'undefined') {
        localStorage.setItem('pickupCenters_lastUpdated', Date.now().toString());
      }

      let centerData: any;
      
      if (result && typeof result === 'object') {
        if (result.pickupCenter) {
          centerData = result.pickupCenter;
        } else if (result.data && result.data.pickupCenter) {
          centerData = result.data.pickupCenter;
        } else if (result.data) {
          centerData = result.data;
        } else {
          centerData = result;
        }
      }

      return {
        ...centerData,
        id: centerData._id || centerData.id,
        status: centerData.isActive !== undefined 
          ? (centerData.isActive ? 'active' : 'inactive') 
          : (centerData.status || 'active')
      };
    } catch (error) {
      console.error(`Error updating pickup center status with id ${id}:`, error);
      throw error;
    }
  }

  static async getPickupCentersForSelect(isActive?: boolean): Promise<Array<{ value: string; label: string; address?: string; amount?: number }>> {
    try {
      const params: IGetPickupCentersParams = { limit: 1000 };
      if (isActive !== undefined) {
        params.isActive = isActive;
      } else {
        params.status = 'active';
      }
      
      const { pickupCenters } = await this.getPickupCenters(params);
      return pickupCenters.map(center => ({
        value: center.id,
        label: center.centerName,
        address: center.address,
        amount: center.amount
      }));
    } catch (error) {
      console.error('Error getting pickup centers for select:', error);
      return [];
    }
  }

  static async validatePickupCenterName(name: string, excludeId?: string): Promise<boolean> {
    try {
      const { pickupCenters } = await this.getPickupCenters({ 
        search: name.trim(), 
        limit: 100 
      });
      
      const existingCenter = pickupCenters.find(
        center => 
          center.centerName.toLowerCase() === name.toLowerCase().trim() &&
          center.id !== excludeId
      );
      
      return !existingCenter;
    } catch (error) {
      console.error('Error validating pickup center name:', error);
      // If validation fails, allow the request to proceed (server will validate)
      return true;
    }
  }

  static formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
}

export default PickupCenterService;
export type { 
  IPickupCenter as PickupCenter, 
  ICreatePickupCenterData as CreatePickupCenterData, 
  IUpdatePickupCenterData as UpdatePickupCenterData, 
  IGetPickupCentersParams as GetPickupCentersParams 
};