import { Order } from '@/types/order';
import { BASE_URL } from '@/config/api';

class DeliveryService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = BASE_URL;
  }

  /**
   * Get delivery confirmation template for an order
   */
  async getDeliveryTemplate(orderId: string, token: string): Promise<{ success: boolean; data?: { template: string }; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/orders/user/${orderId}/delivery-template`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error getting delivery template:', error);
      return { success: false, message: 'An error occurred while fetching the delivery template.' };
    }
  }

  /**
   * Confirm delivery for an order
   */
  async confirmDelivery(
    orderId: string, 
    token: string, 
    confirmationData: {
      deliveryMode: 'pickup_center' | 'shipping' | 'organization_location';
      deliveryAddress?: string;
      pickupCenterName?: string;
      productImage?: File;
      representativeImage?: File;
      userImage?: File;
      imageComment?: string;
      videoUrl?: string;
      satisfactionDeclaration: string;
    }
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const formData = new FormData();
      
      // Add text fields
      formData.append('deliveryMode', confirmationData.deliveryMode);
      if (confirmationData.deliveryAddress) {
        formData.append('deliveryAddress', confirmationData.deliveryAddress);
      }
      if (confirmationData.pickupCenterName) {
        formData.append('pickupCenterName', confirmationData.pickupCenterName);
      }
      if (confirmationData.imageComment) {
        formData.append('imageComment', confirmationData.imageComment);
      }
      if (confirmationData.videoUrl) {
        formData.append('videoUrl', confirmationData.videoUrl);
      }
      formData.append('satisfactionDeclaration', confirmationData.satisfactionDeclaration);

      // Add image files
      if (confirmationData.productImage) {
        formData.append('productImage', confirmationData.productImage);
      }
      if (confirmationData.representativeImage) {
        formData.append('representativeImage', confirmationData.representativeImage);
      }
      if (confirmationData.userImage) {
        formData.append('userImage', confirmationData.userImage);
      }

      const response = await fetch(`${this.baseUrl}/api/orders/user/${orderId}/confirm-delivery`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - let browser handle it for multipart/form-data
        },
        body: formData,
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error confirming delivery:', error);
      return { success: false, message: 'An error occurred while confirming delivery.' };
    }
  }

  /**
   * Get user orders eligible for delivery confirmation
   */
  async getUserOrders(token: string): Promise<{ success: boolean; data?: { orders: Order[] }; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/orders/user/my-orders`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error getting user orders:', error);
      return { success: false, message: 'An error occurred while fetching user orders.' };
    }
  }
}

export default DeliveryService;