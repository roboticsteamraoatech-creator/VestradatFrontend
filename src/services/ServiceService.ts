import { BASE_URL } from '@/config/api';
// Define interfaces for type safety
export interface ModuleConfig {
  moduleKey: string;
  moduleName: string;
  isEnabled: boolean;
}

export interface ServiceLimits {
  maxBodyMeasurements?: number;
  maxOrgUsers?: number;
  [key: string]: number | undefined;
}

interface Service {
  id: string;
  serviceName: string;
  description: string;
  monthlyPrice: number;
  quarterlyPrice: number;
  yearlyPrice: number;
  status: 'active' | 'inactive';
  modules?: ModuleConfig[];
  limits?: ServiceLimits;
  createdAt: string;
  updatedAt: string;
}

interface CreateServiceData {
  serviceName: string;
  description?: string;
  monthlyPrice: number;
  quarterlyPrice: number;
  yearlyPrice: number;
  modules?: ModuleConfig[];
  limits?: ServiceLimits;
}

interface UpdateServiceData {
  serviceName?: string;
  description?: string;
  monthlyPrice?: number;
  quarterlyPrice?: number;
  yearlyPrice?: number;
  modules?: ModuleConfig[];
  limits?: ServiceLimits;
}

class ServiceService {
  private token: string | null;

  constructor(token: string | null = null) {
    this.token = token;
  }

  /**
   * Get all services
   */
  async getAllServices(): Promise<Service[]> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${BASE_URL}/api/services`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different possible response formats
      let servicesArray: any[] = [];
      
      if (Array.isArray(data)) {
        servicesArray = data;
      } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
        servicesArray = data.data;
      } else if (data && typeof data === 'object' && Array.isArray(data.services)) {
        // Handle response where services are in a 'services' property
        servicesArray = data.services;
      } else if (data && typeof data === 'object' && data.data && Array.isArray(data.data.service)) {
        // Handle response where service data is nested
        servicesArray = data.data.service;
      } else if (data && typeof data === 'object' && data.data && Array.isArray(data.data.services)) {
        // Handle response where services are in a 'data.services' property
        servicesArray = data.data.services;
      } else {
        console.warn('Unexpected response format:', data);
        return [];
      }
      
      // Map _id to id for frontend compatibility
      return servicesArray.map(service => ({
        ...service,
        id: service._id,
        status: service.isActive ? 'active' : 'inactive'
      }));
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  }

 
async validateServiceName(name: string, excludeId?: string): Promise<boolean> {
  try {
    const services = await this.getAllServices();
    
    // Check if any service has the same name (case-insensitive)
    const existingService = services.find(
      service => service.serviceName.toLowerCase() === name.toLowerCase() &&
      service.id !== excludeId
    );
    
    return !existingService;
  } catch (error) {
    console.error('Error validating service name:', error);
 
    return true;
  }
}
  async getServiceById(id: string): Promise<Service> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${BASE_URL}/api/services/${id}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different possible response formats
      let serviceData: any;
      
      if (data && typeof data === 'object' && data.data && typeof data.data === 'object') {
        // If the service is nested in a 'service' property
        if (data.data.service) {
          serviceData = data.data.service;
        } else {
          serviceData = data.data;
        }
      } else {
        serviceData = data;
      }
      
      // Map _id to id for frontend compatibility
      return {
        ...serviceData,
        id: serviceData._id,
        status: serviceData.isActive ? 'active' : 'inactive'
      };
    } catch (error) {
      console.error(`Error fetching service with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new service
   */
  async createService(data: CreateServiceData): Promise<Service> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${BASE_URL}/api/services`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle different possible response formats
      let serviceData: any;
      
      if (result && typeof result === 'object' && result.data && typeof result.data === 'object') {
        // If the service is nested in a 'service' property
        if (result.data.service) {
          serviceData = result.data.service;
        } else {
          serviceData = result.data;
        }
      } else {
        serviceData = result;
      }
      
      // Map _id to id for frontend compatibility
      return {
        ...serviceData,
        id: serviceData._id,
        status: serviceData.isActive ? 'active' : 'inactive'
      };
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  }

  /**
   * Update a service
   */
  async updateService(id: string, data: UpdateServiceData): Promise<Service> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${BASE_URL}/api/services/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle different possible response formats
      let serviceData: any;
      
      if (result && typeof result === 'object' && result.data && typeof result.data === 'object') {
        // If the service is nested in a 'service' property
        if (result.data.service) {
          serviceData = result.data.service;
        } else {
          serviceData = result.data;
        }
      } else {
        serviceData = result;
      }
      
      // Map _id to id for frontend compatibility
      return {
        ...serviceData,
        id: serviceData._id,
        status: serviceData.isActive ? 'active' : 'inactive'
      };
    } catch (error) {
      console.error(`Error updating service with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a service (soft delete)
   */
  async deleteService(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${BASE_URL}/api/services/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`Error deleting service with id ${id}:`, error);
      throw error;
    }
  }
}

export default ServiceService;
export type { Service, CreateServiceData, UpdateServiceData };
