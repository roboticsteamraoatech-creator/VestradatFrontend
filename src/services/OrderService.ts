import { BASE_URL } from '@/config/api';
interface BookedPerson {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  age?: string;
  notes?: string;
  slotDateTime: string;
  selectedSubServices?: {
    subServiceId: string;
    name: string;
    code: string;
    price: number;
  }[];
}

interface InitiatePaymentData {
  productId: string;
  productName: string;
  organizationId: string;
  organizationName: string;
  productPrice: number;
  upfrontPercentage: number;
  userId?: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  paymentType: 'upfront' | 'remaining' | 'full';
  itemType: 'product' | 'service';
  platform?: 'web' | 'mobile';
  bookingDate?: string | null;
  bookingTime?: string | null;
  bookingDuration?: number;
  bookingLocation?: { type: string; address?: string; whatsappLocationUrl?: string };
  bookedForPersons?: BookedPerson[];
  bookingNotes?: string;
  redirectUrl?: string;
}

interface VerifyPaymentData {
  transactionId: string;
}

interface PaymentResponse {
  success: boolean;
  data: {
    link: string;
    orderId: string;
    tx_ref: string;
  };
  message: string;
}

interface VerifyResponse {
  success: boolean;
  data: {
    order: any;
  };
  message: string;
}

interface OrdersResponse {
  success: boolean;
  data: {
    orders: any[];
    total: number;
  };
  message: string;
}

class OrderService {
  private static BASE_URL = BASE_URL;

  /**
   * Initiate payment for a product
   */
  static async initiatePayment(data: InitiatePaymentData, token?: string): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}/api/orders/public/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to initiate payment');
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify payment status
   */
  static async verifyPayment(data: VerifyPaymentData): Promise<VerifyResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}/api/orders/public/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactionId: data.transactionId }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to verify payment');
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user's orders (authenticated)
   */
  static async getUserOrders(token: string): Promise<OrdersResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}/api/orders/user/my-orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch orders');
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get specific order details (authenticated)
   */
  static async getOrderById(orderId: string, token: string): Promise<any> {
    try {
      const response = await fetch(`${this.BASE_URL}/api/orders/user/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch order details');
      }

      return result;
    } catch (error) {
      throw error;
    }
  }
}

export default OrderService;