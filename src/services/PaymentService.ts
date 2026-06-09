import { HttpService } from './HttpService';
import { routes } from './apiRoutes';
import { BASE_URL } from '@/config/api';

interface InitializePaymentRequest {
  userId: string;
  userType: 'organization' | 'individual';
  packageId: string;
  subscriptionDuration: 'monthly' | 'quarterly' | 'yearly';
  amount: number; // The amount to be charged
  maxUsers: number; // Number of users for the subscription
  email: string;
  name: string;
  phone?: string;
  callbackUrl?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

interface InitializePaymentResponse {
  success: boolean;
  data: {
    paymentLink: string;
    transactionRef: string;
    amount: number;
  };
  message: string;
}

interface VerifyPaymentRequest {
  transactionId: string;
}

interface SubscriptionData {
  _id: string;
  userId: string;
  packageTitle: string;
  subscriptionDuration: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive';
  paymentStatus: 'completed' | 'pending' | 'failed';
  amountPaid: number;
}

interface VerifyPaymentResponse {
  success: boolean;
  data: {
    subscription: SubscriptionData;
  };
  message: string;
}

class PaymentService {
  private httpService: HttpService;

  constructor() {
    this.httpService = new HttpService(BASE_URL);
  }

  async initializePayment(request: InitializePaymentRequest): Promise<InitializePaymentResponse> {
    try {
      const url = '/api/payment/initialize'; // Using direct path since it's not in the routes file
      const response = await this.httpService.postData<InitializePaymentResponse>(request, url);
      return response;
    } catch (error) {
      console.error('Error initializing payment:', error);
      throw error;
    }
  }

  async verifyPayment(request: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
    try {
      const url = '/api/payment/verify';
      
      const response = await this.httpService.postData<VerifyPaymentResponse>(
        { tx_ref: request.transactionId },
        url
      );
      
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new PaymentService();
export type { InitializePaymentRequest, VerifyPaymentRequest, SubscriptionData };
export { PaymentService };