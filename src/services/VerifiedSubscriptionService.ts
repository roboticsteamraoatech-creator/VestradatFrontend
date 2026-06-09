// services/VerifiedSubscriptionService.ts
import { HttpService } from './HttpService';
import { routes } from './apiRoutes';
import { BASE_URL } from '@/config/api';

// Define the verified subscription interface to match the API response
interface Branch {
  id: string;
  branchName: string;
  houseNumber: string;
  streetName: string;
  cityRegion: string;
  typeOfBuilding?: string; // optional
  lga: string;
  state: string;
  country: string;
  personName?: string; // optional
  position: string;
  emailAddress: string;
  phoneNumber: string;
  createdAt: string;
}

interface VerifiedSubscription {
  id: string;
  organizationName: string;
  organizationId: string;
  totalSubscriptionAmount: number; // in naira
  currency: string;
  totalNumberOfLocations: number;
  headquartersLocation: string;
  locationVerificationCost: number;
  subscriptionDuration: string; // e.g., "1 year", "6 months"
  address: string; // city's region
  city: string;
  lga: string;
  state: string;
  country: string;
  branches: Branch[];
  createdAt: string;
  updatedAt: string;
}

// Interface for creating a verified subscription
interface CreateVerifiedSubscriptionData {
  organizationName: string;
  organizationId?: string;
  totalSubscriptionAmount: number;
  currency?: string;
  totalNumberOfLocations?: number;
  headquartersLocation: string;
  locationVerificationCost?: number;
  subscriptionDuration?: string;
  address?: string;
  city?: string;
  lga?: string;
  state?: string;
  country?: string;
  branches?: Branch[];
}

// Interface for updating a verified subscription
interface UpdateVerifiedSubscriptionData {
  id: string;
  organizationName?: string;
  organizationId?: string;
  totalSubscriptionAmount?: number;
  currency?: string;
  totalNumberOfLocations?: number;
  headquartersLocation?: string;
  locationVerificationCost?: number;
  subscriptionDuration?: string;
  address?: string;
  city?: string;
  lga?: string;
  state?: string;
  country?: string;
  branches?: Branch[];
}

// Interface for the response from the API
interface VerifiedSubscriptionResponse {
  success: boolean;
  data: {
    subscription: VerifiedSubscription;
  };
  message: string;
}

interface VerifiedSubscriptionsResponse {
  success: boolean;
  data: {
    subscriptions: VerifiedSubscription[];
  };
  message: string;
}

class VerifiedSubscriptionService {
  private httpService: HttpService;

  constructor() {
    this.httpService = new HttpService();
  }

  // Get all verified subscriptions with filtering
  async getVerifiedSubscriptions(search?: string): Promise<VerifiedSubscription[]> {
    try {
      const url = `${BASE_URL}${routes.getVerifiedSubscriptions(search)}`;
      const response = await this.httpService.getData<VerifiedSubscriptionsResponse>(url);
      
      if (response.success) {
        return response.data.subscriptions;
      } else {
        throw new Error(response.message || 'Failed to fetch verified subscriptions');
      }
    } catch (error) {
      console.error('Error fetching verified subscriptions:', error);
      throw error;
    }
  }

  // Get a specific verified subscription by ID
  async getVerifiedSubscriptionById(id: string): Promise<VerifiedSubscription> {
    try {
      const url = `${BASE_URL}${routes.getVerifiedSubscriptionById(id)}`;
      const response = await this.httpService.getData<VerifiedSubscriptionResponse>(url);
      
      if (response.success) {
        return response.data.subscription;
      } else {
        throw new Error(response.message || 'Failed to fetch verified subscription');
      }
    } catch (error) {
      console.error('Error fetching verified subscription:', error);
      throw error;
    }
  }

  // Create a new verified subscription
  async createVerifiedSubscription(data: CreateVerifiedSubscriptionData): Promise<VerifiedSubscription> {
    try {
      const url = `${BASE_URL}${routes.createVerifiedSubscription()}`;
      const response = await this.httpService.postData<VerifiedSubscriptionResponse>(data, url);
      
      if (response.success) {
        return response.data.subscription;
      } else {
        throw new Error(response.message || 'Failed to create verified subscription');
      }
    } catch (error) {
      console.error('Error creating verified subscription:', error);
      throw error;
    }
  }

  // Update a verified subscription
  async updateVerifiedSubscription(id: string, data: UpdateVerifiedSubscriptionData): Promise<VerifiedSubscription> {
    try {
      const url = `${BASE_URL}${routes.updateVerifiedSubscription(id)}`;
      const response = await this.httpService.putData<VerifiedSubscriptionResponse>({...data, id}, url);
      
      if (response.success) {
        return response.data.subscription;
      } else {
        throw new Error(response.message || 'Failed to update verified subscription');
      }
    } catch (error) {
      console.error('Error updating verified subscription:', error);
      throw error;
    }
  }

  // Delete a verified subscription
  async deleteVerifiedSubscription(id: string): Promise<boolean> {
    try {
      const url = `${BASE_URL}${routes.deleteVerifiedSubscription(id)}`;
      const response = await this.httpService.deleteData<{ success: boolean; message: string }>(url);
      
      return response.success;
    } catch (error) {
      console.error('Error deleting verified subscription:', error);
      throw error;
    }
  }
}

export default new VerifiedSubscriptionService();
export type { VerifiedSubscription, Branch, CreateVerifiedSubscriptionData, UpdateVerifiedSubscriptionData };