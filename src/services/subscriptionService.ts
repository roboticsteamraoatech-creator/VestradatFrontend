// services/subscriptionService.ts
import { HttpService } from './HttpService';
import { routes } from './apiRoutes';
import { BASE_URL } from '@/config/api';

// Define interfaces for module system
export interface ModuleConfig {
  moduleKey: string;
  moduleName: string;
  isEnabled: boolean;
}

// Backend returns enabledModules as either strings or objects
export type EnabledModule = string | ModuleConfig;

export interface ServiceLimits {
  maxBodyMeasurements?: number;
  maxOrgUsers?: number;
  [key: string]: number | undefined;
}

// Define the subscription package interface to match the API response
export interface SubscriptionPackage {
  id: string;
  _id?: string; // For MongoDB compatibility
  title: string;
  description: string;
  services: Array<{ 
    serviceId: string;
    serviceName: string;
    duration: 'monthly' | 'quarterly' | 'yearly';
    price: number;
    modules?: ModuleConfig[];
    limits?: ServiceLimits;
    _id?: string;
  }>;
  totalServiceCost?: number;
  promoCode?: string;
  discountPercentage?: number;
  promoStartDate?: string;
  promoEndDate?: string;
  discountAmount?: number;
  finalPriceAfterDiscount?: number;
  features: string[];
  note?: string;
  price: number;
  monthlyPrice?: number;
  quarterlyPrice?: number;
  yearlyPrice?: number;
  setupDate?: string;
  updatedDate?: string;
  status: 'active' | 'inactive';
  isActive?: boolean; // Some APIs use isActive instead of status
  subscriberCount?: number;
  maxUsers?: number;
  enabledModules?: EnabledModule[]; // Can be strings or objects
  limits?: ServiceLimits;
  createdAt: string;
  updatedAt: string;
  // Additional fields from API
  createdBy?: string;
  __v?: number; // MongoDB version key
}

// Extended interface for form data (used in create/edit pages)
export interface SubscriptionPackageFormData extends SubscriptionPackage {
  featuresInput?: string;
  financialDetails?: Array<{
    id: string;
    amount: number;
    platformChargePercent: number;
    platformChargeValue: number;
    actualAmount: number;
    discountPercentage: number;
  }>;
}

// Interface for creating a subscription package
export interface CreateSubscriptionPackageData {
  title: string;
  description: string;
  services: Array<{
    serviceId: string;
    serviceName: string;
    duration: 'monthly' | 'quarterly' | 'yearly';
    price: number;
    modules?: ModuleConfig[];
    limits?: ServiceLimits;
  }>;
  totalServiceCost: number;
  promoCode?: string;
  discountPercentage?: number;
  promoStartDate?: string;
  promoEndDate?: string;
  discountAmount: number;
  finalPriceAfterDiscount: number;
  features: string[];
  maxUsers: number;
  note?: string;
  isActive: boolean;
  createdBy: string;
  enabledModules?: ModuleConfig[];
  limits?: ServiceLimits;
  // Optional field not included in the basic interface
  // applyTo?: {
  //   individual: boolean;
  //   industries: string[];
  //   categories: string[];
  // };
}

// Interface for updating subscription status
export interface UpdateSubscriptionStatusData {
  status: 'active' | 'inactive';
}

// Interface for the API response structure
interface SubscriptionPackageResponse {
  success: boolean;
  data: {
    package: {
      _id: string;
      title: string;
      description: string;
      services: Array<{ 
        serviceId: string;
        serviceName: string;
        duration: 'monthly' | 'quarterly' | 'yearly';
        price: number;
        _id?: string;
      }>;
      totalServiceCost?: number;
      promoCode?: string;
      discountPercentage?: number;
      promoStartDate?: string;
      promoEndDate?: string;
      discountAmount?: number;
      finalPriceAfterDiscount?: number;
      features: string[];
      note?: string;
      isActive: boolean;
      createdBy?: string;
      maxUsers?: number;
      createdAt: string;
      updatedAt: string;
      __v?: number;
    };
    message?: string;
  };
}

interface SubscriptionPackagesResponse {
  success: boolean;
  data: {
    packages: Array<{ 
      _id: string;
      title: string;
      description: string;
      services: Array<{
        serviceId: string;
        serviceName: string;
        duration: 'monthly' | 'quarterly' | 'yearly';
        price: number;
        _id?: string;
      }>;
      totalServiceCost?: number;
      promoCode?: string;
      discountPercentage?: number;
      promoStartDate?: string;
      promoEndDate?: string;
      discountAmount?: number;
      finalPriceAfterDiscount?: number;
      features: string[];
      note?: string;
      price: number;
      monthlyPrice?: number;
      quarterlyPrice?: number;
      yearlyPrice?: number;
      setupDate?: string;
      updatedDate?: string;
      isActive?: boolean;
      subscriberCount?: number;
      createdAt: string;
      updatedAt: string;
      createdBy?: string;
      maxUsers?: number;
      __v?: number;
    }>; 
    total: number;
    message?: string;
  };
}

class SubscriptionService {
  private httpService: HttpService;

  constructor() {
    this.httpService = new HttpService(BASE_URL);
  }

  // Helper function to transform API package to SubscriptionPackage interface
  private transformPackage(pkg: any): SubscriptionPackage {
    return {
      id: pkg._id, // Map _id to id
      _id: pkg._id,
      title: pkg.title || '',
      description: pkg.description || '',
      services: Array.isArray(pkg.services) ? pkg.services : [],
      totalServiceCost: pkg.totalServiceCost || pkg.price || 0,
      promoCode: pkg.promoCode,
      discountPercentage: pkg.discountPercentage,
      promoStartDate: pkg.promoStartDate,
      promoEndDate: pkg.promoEndDate,
      discountAmount: pkg.discountAmount || 0,
      finalPriceAfterDiscount: pkg.finalPriceAfterDiscount || pkg.price || 0,
      features: Array.isArray(pkg.features) ? pkg.features : [],
      note: pkg.note,
      price: pkg.price || pkg.finalPriceAfterDiscount || 0,
      monthlyPrice: pkg.monthlyPrice,
      quarterlyPrice: pkg.quarterlyPrice,
      yearlyPrice: pkg.yearlyPrice,
      setupDate: pkg.setupDate,
      updatedDate: pkg.updatedDate,
      status: pkg.isActive ? 'active' : 'inactive', // Convert isActive to status
      isActive: pkg.isActive,
      subscriberCount: pkg.subscriberCount,
      maxUsers: pkg.maxUsers,
      createdAt: pkg.createdAt || new Date().toISOString(),
      updatedAt: pkg.updatedAt || new Date().toISOString(),
      createdBy: pkg.createdBy,
      __v: pkg.__v
    };
  }

  // Get all subscription packages
  async getSubscriptionPackages(): Promise<{ packages: SubscriptionPackage[]; total: number }> {
    try {
      const url = routes.getAllSubscriptionPackage();
      const response = await this.httpService.getData<SubscriptionPackagesResponse>(url);
      
      if (response.success) {
        // Transform all packages to match our interface
        const transformedPackages = response.data.packages.map(pkg => 
          this.transformPackage(pkg)
        );
        
        return {
          packages: transformedPackages,
          total: response.data.total
        };
      } else {
        throw new Error(response.data?.message || 'Failed to fetch subscription packages');
      }
    } catch (error) {
      console.error('Error fetching subscription packages:', error);
      throw error;
    }
  }

  // Get all subscription packages (alias for compatibility)
  async getAllSubscriptionPackages(): Promise<SubscriptionPackage[]> {
    try {
      const { packages } = await this.getSubscriptionPackages();
      return packages;
    } catch (error) {
      console.error('Error fetching subscription packages:', error);
      throw error;
    }
  }

  // Get a specific subscription package by ID
  async getSubscriptionPackageById(id: string): Promise<SubscriptionPackage> {
    try {
      const url = routes.getSubscriptionPackageById(id);
      const response = await this.httpService.getData<SubscriptionPackageResponse>(url);
      
      if (response.success) {
        return this.transformPackage(response.data.package);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch subscription package');
      }
    } catch (error) {
      console.error('Error fetching subscription package:', error);
      throw error;
    }
  }

  // Create a new subscription package
  async createSubscriptionPackage(data: CreateSubscriptionPackageData): Promise<SubscriptionPackage> {
    try {
      const url = routes.createSubscriptionPackage();
      const response = await this.httpService.postData<SubscriptionPackageResponse>(data, url);
      
      if (response.success) {
        return this.transformPackage(response.data.package);
      } else {
        throw new Error(response.data?.message || 'Failed to create subscription package');
      }
    } catch (error) {
      console.error('Error creating subscription package:', error);
      throw error;
    }
  }

  // Update a subscription package
  async updateSubscriptionPackage(id: string, data: Partial<CreateSubscriptionPackageData>): Promise<SubscriptionPackage> {
    try {
      const url = routes.updateSubscriptionPackage(id);
      
      // Clean the data to remove undefined values
      const cleanedData: any = {};
      Object.keys(data).forEach(key => {
        const value = data[key as keyof CreateSubscriptionPackageData];
        if (value !== undefined && value !== null) {
          cleanedData[key] = value;
        }
      });
      
      const response = await this.httpService.putData<SubscriptionPackageResponse>(cleanedData, url);
      
      if (response.success) {
        return this.transformPackage(response.data.package);
      } else {
        throw new Error(response.data?.message || 'Failed to update subscription package');
      }
    } catch (error) {
      console.error('Error updating subscription package:', error);
      throw error;
    }
  }

  // Delete a subscription package
  async deleteSubscriptionPackage(id: string): Promise<boolean> {
    try {
      const url = routes.deleteSubscriptionPackage(id);
      const response = await this.httpService.deleteData<{ success: boolean; message: string }>(url);
      
      return response.success;
    } catch (error) {
      console.error('Error deleting subscription package:', error);
      throw error;
    }
  }

  // Update subscription status
  async updateSubscriptionStatus(id: string, status: 'active' | 'inactive'): Promise<SubscriptionPackage> {
    try {
      const url = routes.updateSubscriptionStatus(id);
      // Convert status to isActive for the API
      const isActive = status === 'active';
      const response = await this.httpService.putData<SubscriptionPackageResponse>({ isActive }, url);
      
      if (response.success) {
        return this.transformPackage(response.data.package);
      } else {
        throw new Error(response.data?.message || 'Failed to update subscription status');
      }
    } catch (error) {
      console.error('Error updating subscription status:', error);
      throw error;
    }
  }

  // Export subscription packages
  async exportSubscriptionPackages(format: 'csv' | 'excel' | 'pdf'): Promise<Blob> {
    try {
      const url = routes.exportSubscriptionPackages(format);
      return await this.httpService.download(url);
    } catch (error) {
      console.error('Error exporting subscription packages:', error);
      throw error;
    }
  }
}

export default new SubscriptionService();
